//! Stable V-Node manifest schema helpers.
//!
//! The manifest encoded here is intentionally small and canonical: every
//! multi-byte integer is little-endian, variable-length byte strings carry a
//! `u32` byte length, and capability records are emitted by callers in their
//! granted order. Kernel-side hashing must hash these exact bytes, not an empty
//! placeholder or debug formatting.

#[cfg(feature = "alloc")]
use alloc::vec::Vec;

/// Current canonical V-Node manifest schema version.
pub const VNODE_MANIFEST_SCHEMA_VERSION: u16 = 1;

/// Domain separator used at the start of every canonical manifest byte stream.
pub const VNODE_MANIFEST_MAGIC: &[u8; 16] = b"AOS_VNODE_MAN_V1";

/// Stable filesystem rights tags for canonical V-Node manifests.
pub mod fs_rights_tag {
    /// Read-only filesystem capability rooted at the supplied hash.
    pub const READ_ONLY: u8 = 0;
    /// Read-write filesystem capability rooted at the supplied hash.
    pub const READ_WRITE: u8 = 1;
}

/// Stable kernel capability tags for canonical V-Node manifests.
pub mod capability_tag {
    pub const LOG_WRITE: u16 = 1;
    pub const TIME_READ: u16 = 2;
    pub const NETWORK_ACCESS: u16 = 3;
    pub const STORAGE_ACCESS: u16 = 4;
    pub const IRQ_REGISTER: u16 = 5;
    pub const DMA_ALLOC: u16 = 6;
    pub const DMA_ACCESS: u16 = 7;
    pub const IRQ_ACK: u16 = 8;
    pub const IPC_MANAGE: u16 = 9;
    pub const READ_METRICS: u16 = 10;
    pub const WRITE_LOGS: u16 = 11;
    pub const RESTART_VNODE: u16 = 12;
    pub const SYNC_SNAPSHOTS: u16 = 13;
    pub const READ_OWN_METRICS: u16 = 14;
}

/// Permission bits recorded in canonical V-Node manifests.
pub mod permission_bit {
    pub const CAN_SYSCALL: u8 = 1 << 0;
    pub const CAN_IPC: u8 = 1 << 1;
    pub const CAN_IO: u8 = 1 << 2;
}

/// Canonical encoder for schema-versioned V-Node manifests.
#[cfg(feature = "alloc")]
#[derive(Debug, Clone)]
pub struct VNodeManifestEncoder {
    bytes: Vec<u8>,
}

#[cfg(feature = "alloc")]
impl VNodeManifestEncoder {
    /// Starts an encoder and writes the schema domain separator.
    pub fn new() -> Self {
        let mut bytes = Vec::new();
        bytes.extend_from_slice(VNODE_MANIFEST_MAGIC);
        bytes.extend_from_slice(&VNODE_MANIFEST_SCHEMA_VERSION.to_le_bytes());
        Self { bytes }
    }

    /// Appends a V-Node identity and image binding section.
    pub fn vnode_identity(
        mut self,
        id: u64,
        name: &str,
        image_hash: &[u8; 32],
        entry: u64,
    ) -> Self {
        self.push_u64(id);
        self.push_bytes(name.as_bytes());
        self.bytes.extend_from_slice(image_hash);
        self.push_u64(entry);
        self
    }

    /// Appends V-Node permissions as a stable bitset.
    pub fn permissions(mut self, can_syscall: bool, can_ipc: bool, can_io: bool) -> Self {
        let mut bits = 0u8;
        if can_syscall {
            bits |= permission_bit::CAN_SYSCALL;
        }
        if can_ipc {
            bits |= permission_bit::CAN_IPC;
        }
        if can_io {
            bits |= permission_bit::CAN_IO;
        }
        self.bytes.push(bits);
        self
    }

    /// Appends the filesystem root capability section.
    pub fn fs_capability(mut self, root_hash: &[u8; 32], rights_tag: u8) -> Self {
        self.bytes.extend_from_slice(root_hash);
        self.bytes.push(rights_tag);
        self
    }

    /// Starts the capability section with the declared capability count.
    pub fn capability_count(mut self, count: u32) -> Self {
        self.push_u32(count);
        self
    }

    /// Appends one capability record. Capabilities without parameters should use `0`.
    pub fn capability(mut self, tag: u16, parameter: u64) -> Self {
        self.push_u16(tag);
        self.push_u64(parameter);
        self
    }

    /// Returns the final canonical manifest bytes.
    pub fn finish(self) -> Vec<u8> {
        self.bytes
    }

    fn push_bytes(&mut self, bytes: &[u8]) {
        let len = bytes.len() as u32;
        self.push_u32(len);
        self.bytes.extend_from_slice(bytes);
    }

    fn push_u16(&mut self, value: u16) {
        self.bytes.extend_from_slice(&value.to_le_bytes());
    }

    fn push_u32(&mut self, value: u32) {
        self.bytes.extend_from_slice(&value.to_le_bytes());
    }

    fn push_u64(&mut self, value: u64) {
        self.bytes.extend_from_slice(&value.to_le_bytes());
    }
}

#[cfg(feature = "alloc")]
impl Default for VNodeManifestEncoder {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::{capability_tag, fs_rights_tag, VNodeManifestEncoder, VNODE_MANIFEST_MAGIC};
    use alloc::vec::Vec;

    #[test]
    fn manifest_encoder_includes_identity_and_capabilities() {
        let image_hash = [0x11; 32];
        let root_hash = [0x22; 32];
        let encoded = VNodeManifestEncoder::new()
            .vnode_identity(7, "logger", &image_hash, 0x401000)
            .permissions(true, true, false)
            .fs_capability(&root_hash, fs_rights_tag::READ_ONLY)
            .capability_count(2)
            .capability(capability_tag::LOG_WRITE, 0)
            .capability(capability_tag::IRQ_ACK, 14)
            .finish();

        assert!(encoded.starts_with(VNODE_MANIFEST_MAGIC));
        assert!(encoded
            .windows(image_hash.len())
            .any(|window| window == image_hash));
        assert!(encoded
            .windows(root_hash.len())
            .any(|window| window == root_hash));
        assert!(encoded.len() > VNODE_MANIFEST_MAGIC.len());
    }

    #[test]
    fn capability_changes_change_manifest_bytes() {
        let image_hash = [0x33; 32];
        let root_hash = [0x44; 32];
        let base = VNodeManifestEncoder::new()
            .vnode_identity(1, "net", &image_hash, 0x1000)
            .permissions(true, true, false)
            .fs_capability(&root_hash, fs_rights_tag::READ_ONLY)
            .capability_count(1)
            .capability(capability_tag::NETWORK_ACCESS, 0)
            .finish();
        let changed = VNodeManifestEncoder::new()
            .vnode_identity(1, "net", &image_hash, 0x1000)
            .permissions(true, true, false)
            .fs_capability(&root_hash, fs_rights_tag::READ_ONLY)
            .capability_count(1)
            .capability(capability_tag::STORAGE_ACCESS, 0)
            .finish();

        assert_ne!(base, changed);
        assert_ne!(base, Vec::<u8>::new());
    }
}
