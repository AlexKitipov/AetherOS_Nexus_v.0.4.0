# AetherOS Syscall ABI

## Current ABI Version

The current syscall ABI version is `2`.

The canonical Rust constant is:

```rust
pub const SYSCALL_ABI_VERSION: u64 = 2;
```

It lives in `Aether_OS_Nexus_Core_v.0.3/AetherOS/common/src/syscall.rs` and is consumed by kernel and V-Node code through the shared `aetheros_common` crate.

## ABI v2 Register Contract

For the x86_64 `syscall` path:

- `rax`: syscall number
- `rdi`: argument 1
- `rsi`: argument 2
- `rdx`: argument 3
- `r10`: argument 4
- `r8`: argument 5
- `r9`: argument 6
- return value: `rax`

The maximum supported argument count for ABI v2 is `6`.

## Syscall Number Stability

The current syscall numbers are defined in `Aether_OS_Nexus_Core_v.0.3/AetherOS/common/src/syscall.rs`. Any change to syscall numbers, argument meaning, pointer/buffer layout, return-code meaning, or register use must bump `SYSCALL_ABI_VERSION` and update this document.

## Buffer Contract

`UserBuf` is the ABI-safe buffer descriptor used by shared code:

```rust
#[repr(C)]
pub struct UserBuf {
    pub ptr: u64,
    pub len: u64,
}
```

Kernel code must validate user pointers, lengths, capabilities, and channel permissions before dereferencing or acting on user-provided data.

## Stabilization Checklist

Before ABI v2 is treated as stable:

- Add explicit tests that compare syscall number constants across kernel/common consumers.
- Document every syscall's arguments and return values.
- Validate pointer-width and alignment assumptions for supported targets.
- Add compatibility policy for future ABI version bumps.
- Ensure the TypeScript `shared/` ABI descriptions do not drift from Rust constants.
