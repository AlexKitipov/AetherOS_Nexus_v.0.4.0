#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub enum IpcMessage {
    Ping,
    Pong,
    Data(alloc::vec::Vec<u8>),
}

/// Payload representation used by IPC descriptors.
///
/// The current ABI v2 syscall path accepts only inline byte buffers for
/// `SYS_IPC_SEND` and `SYS_IPC_RECV`; descriptor values are reserved for
/// documenting and validating future low-copy or shared-memory surfaces without
/// changing the syscall number table.
#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum IpcPayloadKind {
    /// Payload bytes are copied from the sender and copied to the receiver.
    Inline = 0,
    /// Payload refers to kernel-managed shared data; not exposed by ABI v2
    /// `SYS_IPC_RECV` because ownership and lifetime transfer are not stable.
    SharedMemory = 1,
}

/// ABI-safe descriptor for one IPC byte range.
///
/// This descriptor is intentionally layout-stable, but it is not a standalone
/// ABI v2 syscall argument today. Existing v2 callers continue to pass
/// pointer/length pairs to `SYS_IPC_SEND` and `SYS_IPC_RECV`.
#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct IpcBufferDescriptor {
    pub ptr: u64,
    pub len: u64,
    pub kind: IpcPayloadKind,
    pub flags: u8,
    pub reserved: [u8; 6],
}

impl IpcBufferDescriptor {
    #[must_use]
    pub const fn inline(ptr: u64, len: u64) -> Self {
        Self {
            ptr,
            len,
            kind: IpcPayloadKind::Inline,
            flags: 0,
            reserved: [0; 6],
        }
    }

    #[must_use]
    pub const fn is_inline(&self) -> bool {
        matches!(self.kind, IpcPayloadKind::Inline)
    }
}

/// ABI-safe envelope metadata for a described IPC payload.
///
/// `abi_version` lets descriptor-aware callers assert compatibility before a
/// future IPC extension is accepted. Keeping this at `2` documents that the
/// descriptor shape is compatible with ABI v2, not that ABI v2 syscalls consume
/// this struct directly.
#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct IpcMessageDescriptor {
    pub abi_version: u64,
    pub sender: u64,
    pub buffer: IpcBufferDescriptor,
}

impl IpcMessageDescriptor {
    pub const ABI_VERSION: u64 = 2;

    #[must_use]
    pub const fn inline(sender: u64, ptr: u64, len: u64) -> Self {
        Self {
            abi_version: Self::ABI_VERSION,
            sender,
            buffer: IpcBufferDescriptor::inline(ptr, len),
        }
    }

    #[must_use]
    pub const fn is_abi_v2_compatible(&self) -> bool {
        self.abi_version == Self::ABI_VERSION && self.buffer.is_inline()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ipc_descriptors_are_layout_stable_for_abi_v2() {
        assert_eq!(IpcMessageDescriptor::ABI_VERSION, 2);
        assert_eq!(core::mem::size_of::<IpcPayloadKind>(), 1);
        assert_eq!(core::mem::size_of::<IpcBufferDescriptor>(), 24);
        assert_eq!(core::mem::align_of::<IpcBufferDescriptor>(), 8);
        assert_eq!(core::mem::size_of::<IpcMessageDescriptor>(), 40);
        assert_eq!(core::mem::align_of::<IpcMessageDescriptor>(), 8);
    }

    #[test]
    fn inline_descriptor_marks_abi_v2_compatibility() {
        let descriptor = IpcMessageDescriptor::inline(7, 0x1000, 32);

        assert!(descriptor.is_abi_v2_compatible());
        assert_eq!(descriptor.sender, 7);
        assert_eq!(descriptor.buffer.ptr, 0x1000);
        assert_eq!(descriptor.buffer.len, 32);
        assert_eq!(descriptor.buffer.kind, IpcPayloadKind::Inline);
    }
}
