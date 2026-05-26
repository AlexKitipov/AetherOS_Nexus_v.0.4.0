//! Syscall ABI contract validation.

pub const ABI_VERSION: u32 = 2;
pub const MAX_SYSCALL_ARGS: usize = 6;
pub const MAX_SYSCALL_NUM: usize = 20;

const _: () = {
    assert!(core::mem::size_of::<usize>() == 8);
    assert!(core::mem::align_of::<usize>() == 8);
    assert!(core::mem::size_of::<u64>() == 8);
};

const _: () = {
    assert!((0..=20).contains(&MAX_SYSCALL_NUM));
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
        assert!((0..=20).contains(&MAX_SYSCALL_NUM));
    }

    #[test]
    fn test_abi_constants() {
        assert_eq!(ABI_VERSION, 2);
        assert_eq!(MAX_SYSCALL_ARGS, 6);
        assert_eq!(MAX_SYSCALL_NUM, 20);
    }
}
