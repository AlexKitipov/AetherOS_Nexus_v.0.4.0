#![allow(dead_code)]

extern crate alloc;

use aetheros_common::vnode_manifest::{capability_tag, fs_rights_tag, VNodeManifestEncoder};
use alloc::format;
use alloc::string::String;
use alloc::vec::Vec;
use sha2::{Digest, Sha256};
use spin::Mutex;
use x86_64::VirtAddr;

use crate::aetherfs::{self, FsCapability, FsRights, Hash};
use crate::caps::Capability;
use crate::elf;
use crate::kprintln;
use crate::memory::address_space::{self, UserSegment, UserSegmentFlags};

pub type VNodeId = u64;

#[derive(Debug, Clone)]
pub struct Permissions {
    pub can_syscall: bool,
    pub can_ipc: bool,
    pub can_io: bool,
}

impl Default for Permissions {
    fn default() -> Self {
        Self {
            can_syscall: true,
            can_ipc: true,
            can_io: false,
        }
    }
}

#[derive(Debug, Clone)]
pub struct VNode {
    pub id: VNodeId,
    pub name: String,
    pub image_hash: Hash,
    pub entry: u64,
    pub permissions: Permissions,
    pub fs_capability: FsCapability,
    pub load_segments: Vec<elf::ElfLoadSegment>,
}

#[derive(Debug, Clone)]
struct ManagedVNode {
    id: VNodeId,
    image_hash: Hash,
    manifest_hash: [u8; 32],
}

impl ManagedVNode {
    fn capability_hash(&self) -> [u8; 32] {
        self.manifest_hash
    }
}

static VNODE_MANAGER: Mutex<Vec<ManagedVNode>> = Mutex::new(Vec::new());

pub fn init() {
    kprintln!("[kernel] vnode_loader: Initializing immutable V-Node loader...");
    kprintln!("[kernel] vnode_loader: Ready.");
}

pub fn build_vnode_descriptor(
    id: VNodeId,
    name: &str,
    image_hash: Hash,
    entry: u64,
    permissions: Permissions,
    fs_capability: FsCapability,
    load_segments: Vec<elf::ElfLoadSegment>,
) -> VNode {
    VNode {
        id,
        name: name.into(),
        image_hash,
        entry,
        permissions,
        fs_capability,
        load_segments,
    }
}

pub fn check_fs_cap(vnode: &VNode, path: &str, right: FsRights) -> bool {
    if right == FsRights::ReadWrite && vnode.fs_capability.rights != FsRights::ReadWrite {
        return false;
    }

    aetherfs::fs_resolve_path(vnode.fs_capability.root, path).is_some()
}

pub fn spawn_vnode_task(
    vnode: &VNode,
    image: &[u8],
    capabilities: Vec<Capability>,
) -> Result<(), String> {
    let manifest_hash = hash_vnode_manifest(vnode, &capabilities);
    let entry_point = VirtAddr::new(vnode.entry);
    let segment_images = materialize_load_segments(image, &vnode.load_segments)?;
    let user_segments: Vec<UserSegment> = segment_images
        .iter()
        .map(|segment| UserSegment {
            virtual_start: VirtAddr::new(segment.virtual_start),
            bytes: &segment.bytes,
            flags: segment.flags,
        })
        .collect();
    let layout = address_space::create_vnode_address_space(
        &user_segments,
        address_space::DEFAULT_USER_STACK_PAGES,
    )
    .map_err(String::from)?;

    let address_space_root = layout.root_pml4();
    let mut tcb = crate::task::TaskControlBlock::new_user_task(
        vnode.id,
        vnode.name.clone(),
        capabilities,
        entry_point,
        layout.user_stack_top,
        address_space_root,
    );
    tcb.user_stack_base = Some(layout.user_stack_base);
    tcb.set_address_space_layout(layout.mapped_pages, layout.owned_frames, address_space_root);
    crate::task::scheduler::add_task(tcb);

    kprintln!(
        "[kernel] vnode_loader: spawned V-Node '{}' as task {} (entry={:#x}, image={:02x?}).",
        vnode.name,
        vnode.id,
        vnode.entry,
        vnode.image_hash.0
    );

    VNODE_MANAGER.lock().push(ManagedVNode {
        id: vnode.id,
        image_hash: vnode.image_hash,
        manifest_hash,
    });

    Ok(())
}

pub fn load_vnode(vnode_name: &str, capabilities: Vec<Capability>) -> Result<(), String> {
    kprintln!("[kernel] vnode_loader: Loading V-Node '{}'.", vnode_name);

    let boot_snapshot = aetherfs::load_snapshot(aetherfs::BOOT_SNAPSHOT_HASH)
        .ok_or_else(|| String::from("Boot snapshot not available"))?;

    let vnode_path = format!("/initrd/{}.bin", vnode_name);
    let image_hash = aetherfs::fs_resolve_path(boot_snapshot.root, &vnode_path)
        .ok_or_else(|| format!("V-Node image not found at '{}'", vnode_path))?;
    let image = aetherfs::fs_read(image_hash)
        .ok_or_else(|| format!("V-Node image hash {:02x?} is not readable", image_hash.0))?;
    let elf_header = elf::ElfLoader::parse_elf_bytes(&image)?;

    let vnode = build_vnode_descriptor(
        1000 + vnode_name.as_bytes()[0] as u64,
        vnode_name,
        image_hash,
        elf_header.entry_point,
        Permissions::default(),
        FsCapability {
            root: boot_snapshot.root,
            rights: FsRights::ReadOnly,
        },
        elf_header.load_segments,
    );

    if !check_fs_cap(&vnode, &vnode_path, FsRights::ReadOnly) {
        return Err(format!("FS capability check failed for {}", vnode_path));
    }

    spawn_vnode_task(&vnode, &image, capabilities)?;

    kprintln!(
        "[kernel] vnode_loader: V-Node '{}' loaded from immutable storage.",
        vnode_name
    );
    Ok(())
}

pub fn snapshot_vnode_states() -> Vec<crate::snapshot_engine::VNodeState> {
    VNODE_MANAGER
        .lock()
        .iter()
        .map(|vnode| crate::snapshot_engine::VNodeState {
            vnode_id: vnode.id,
            image_hash: vnode.image_hash.0,
            caps_hash: vnode.capability_hash(),
        })
        .collect()
}

pub fn spawn_from_snapshot(vnode: &crate::snapshot_engine::VNodeState) -> Result<(), String> {
    let image_hash = Hash(vnode.image_hash);
    let image = aetherfs::fs_read(image_hash).ok_or_else(|| {
        format!(
            "V-Node image hash {:02x?} is not readable",
            vnode.image_hash
        )
    })?;
    let elf_header = elf::ElfLoader::parse_elf_bytes(&image)?;

    let current = aetherfs::current_snapshot()
        .ok_or_else(|| String::from("AetherFS has no active snapshot"))?;
    let descriptor = build_vnode_descriptor(
        vnode.vnode_id,
        "restored-vnode",
        image_hash,
        elf_header.entry_point,
        Permissions::default(),
        FsCapability {
            root: current.root,
            rights: FsRights::ReadOnly,
        },
        elf_header.load_segments,
    );

    spawn_vnode_task(&descriptor, &image, Vec::new())
}

#[derive(Debug)]
struct MaterializedLoadSegment {
    virtual_start: u64,
    bytes: Vec<u8>,
    flags: UserSegmentFlags,
}

fn materialize_load_segments(
    image: &[u8],
    load_segments: &[elf::ElfLoadSegment],
) -> Result<Vec<MaterializedLoadSegment>, String> {
    load_segments
        .iter()
        .map(|segment| {
            if segment.memory_size > usize::MAX as u64 {
                return Err(String::from(
                    "ELF PT_LOAD memory size is too large for this target.",
                ));
            }
            let file_end = segment.file_end()? as usize;
            let file_start = segment.file_offset as usize;
            let segment_bytes = image
                .get(file_start..file_end)
                .ok_or_else(|| String::from("ELF PT_LOAD file bytes are outside the image."))?;
            let mut bytes = Vec::new();
            bytes
                .try_reserve(segment.memory_size as usize)
                .map_err(|_| String::from("Failed to reserve memory for ELF PT_LOAD segment."))?;
            bytes.extend_from_slice(segment_bytes);
            bytes.resize(segment.memory_size as usize, 0);

            Ok(MaterializedLoadSegment {
                virtual_start: segment.virtual_start,
                bytes,
                flags: UserSegmentFlags {
                    writable: segment.writable,
                    executable: segment.executable,
                },
            })
        })
        .collect()
}

fn hash_vnode_manifest(vnode: &VNode, capabilities: &[Capability]) -> [u8; 32] {
    let encoded = encode_vnode_manifest(vnode, capabilities);
    sha2_256(&encoded)
}

fn encode_vnode_manifest(vnode: &VNode, capabilities: &[Capability]) -> Vec<u8> {
    let mut encoder = VNodeManifestEncoder::new()
        .vnode_identity(vnode.id, &vnode.name, &vnode.image_hash.0, vnode.entry)
        .permissions(
            vnode.permissions.can_syscall,
            vnode.permissions.can_ipc,
            vnode.permissions.can_io,
        )
        .fs_capability(
            &vnode.fs_capability.root.0,
            fs_rights_manifest_tag(vnode.fs_capability.rights),
        )
        .capability_count(capabilities.len() as u32);

    for capability in capabilities {
        let (tag, parameter) = capability_manifest_record(*capability);
        encoder = encoder.capability(tag, parameter);
    }

    encoder.finish()
}

fn fs_rights_manifest_tag(rights: FsRights) -> u8 {
    match rights {
        FsRights::ReadOnly => fs_rights_tag::READ_ONLY,
        FsRights::ReadWrite => fs_rights_tag::READ_WRITE,
    }
}

fn capability_manifest_record(capability: Capability) -> (u16, u64) {
    match capability {
        Capability::LogWrite => (capability_tag::LOG_WRITE, 0),
        Capability::TimeRead => (capability_tag::TIME_READ, 0),
        Capability::NetworkAccess => (capability_tag::NETWORK_ACCESS, 0),
        Capability::StorageAccess => (capability_tag::STORAGE_ACCESS, 0),
        Capability::IrqRegister(irq) => (capability_tag::IRQ_REGISTER, irq as u64),
        Capability::DmaAlloc => (capability_tag::DMA_ALLOC, 0),
        Capability::DmaAccess => (capability_tag::DMA_ACCESS, 0),
        Capability::IrqAck(irq) => (capability_tag::IRQ_ACK, irq as u64),
        Capability::IpcManage => (capability_tag::IPC_MANAGE, 0),
        Capability::ReadMetrics => (capability_tag::READ_METRICS, 0),
        Capability::WriteLogs => (capability_tag::WRITE_LOGS, 0),
        Capability::RestartVNode => (capability_tag::RESTART_VNODE, 0),
        Capability::SyncSnapshots => (capability_tag::SYNC_SNAPSHOTS, 0),
        Capability::ReadOwnMetrics => (capability_tag::READ_OWN_METRICS, 0),
    }
}

fn sha2_256(bytes: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    let digest = hasher.finalize();
    let mut hash = [0u8; 32];
    hash.copy_from_slice(&digest);
    hash
}
