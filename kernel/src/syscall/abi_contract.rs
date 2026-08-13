//! Syscall ABI contract validation.
//!
//! Keep this root-level mirror aligned with the canonical ABI constants in
//! `Aether_OS_Nexus_Core_v.0.3/AetherOS/common/src/syscall.rs`. The common
//! crate remains the source of truth for user-space V-Nodes and the kernel
//! dispatcher; this file exists for root-level contract checks until the mirror
//! can be replaced by generated documentation.

/// Canonical syscall ABI version mirrored from `aetheros_common::syscall`.
pub const SYSCALL_ABI_VERSION: u64 = 2;

/// Backward-compatible alias for local ABI contract tests.
pub const ABI_VERSION: u64 = SYSCALL_ABI_VERSION;
pub const MAX_SYSCALL_ARGS: u64 = 6;
pub const MAX_SYSCALL_NUM: u64 = 20;

/// Stable syscall number mapping for ABI v2.
pub const SYSCALL_NUMBERS: &[(&str, u64)] = &[
    ("SYS_LOG", 0),
    ("SYS_IPC_SEND", 1),
    ("SYS_IPC_RECV", 2),
    ("SYS_BLOCK_ON_CHAN", 3),
    ("SYS_TIME", 4),
    ("SYS_IRQ_REGISTER", 5),
    ("SYS_NET_RX_POLL", 6),
    ("SYS_NET_ALLOC_BUF", 7),
    ("SYS_NET_FREE_BUF", 8),
    ("SYS_NET_TX", 9),
    ("SYS_IRQ_ACK", 10),
    ("SYS_GET_DMA_BUF_PTR", 11),
    ("SYS_SET_DMA_BUF_LEN", 12),
    ("SYS_IPC_RECV_NONBLOCKING", 13),
    ("SYS_CAP_GRANT", 14),
    ("SYS_UI_CALL", 15),
    ("SYS_SWARM_CALL", 16),
    ("SYS_AI_CALL", 17),
    ("SYS_VFS_CALL", 18),
    ("SYS_UDP_SEND", 19),
    ("SYS_UDP_RECV", 20),
];

const _: () = {
    assert!(core::mem::size_of::<usize>() == 8);
    assert!(core::mem::align_of::<usize>() == 8);
    assert!(core::mem::size_of::<u64>() == 8);
};

const _: () = {
    assert!(MAX_SYSCALL_NUM == 20);
    assert!(SYSCALL_NUMBERS.len() == (MAX_SYSCALL_NUM as usize + 1));
};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pointer_width() {
        assert_eq!(core::mem::size_of::<usize>(), 8);
        assert_eq!(core::mem::align_of::<usize>(), 8);
    }

    #[test]
    fn test_syscall_bounds() {
        assert_eq!(MAX_SYSCALL_NUM, 20);
        assert_eq!(SYSCALL_NUMBERS.len(), MAX_SYSCALL_NUM as usize + 1);
    }

    #[test]
    fn test_abi_constants() {
        assert_eq!(ABI_VERSION, 2);
        assert_eq!(MAX_SYSCALL_ARGS, 6);
        assert_eq!(MAX_SYSCALL_NUM, 20);
    }

    #[test]
    fn test_syscall_numbers_are_contiguous() {
        for (expected, (_name, actual)) in SYSCALL_NUMBERS.iter().enumerate() {
            assert_eq!(*actual, expected as u64);
        }
    }
}
