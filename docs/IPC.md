# IPC Semantics and Zero-Copy Roadmap

This document describes the IPC behavior implemented by the v0.3 core used in the v0.4 repository. It is intentionally conservative: the current syscall-facing IPC path is copy-based, while kernel-internal shared payload support is treated as low-copy only until ownership-transfer and lifetime invariants are implemented and tested.

## Current ABI v2 IPC Contract

ABI v2 exposes IPC through the existing syscall number table:

| Syscall | Arguments | Current behavior |
| --- | --- | --- |
| `SYS_IPC_SEND` | `a1=channel_id`, `a2=ptr`, `a3=len` | Validates and copies `len` bytes from the caller into a kernel-owned inline mailbox message. |
| `SYS_IPC_RECV` | `a1=channel_id`, `a2=out_ptr`, `a3=out_cap` | Blocks until an inline message is available, then copies bytes into the caller's output buffer. |
| `SYS_IPC_RECV_NONBLOCKING` | `a1=channel_id`, `a2=out_ptr`, `a3=out_cap` | Returns `0` when no inline message is available; otherwise copies bytes into the caller's output buffer. |
| Domain calls (`SYS_UI_CALL`, `SYS_SWARM_CALL`, `SYS_AI_CALL`, `SYS_VFS_CALL`) | `a1=service_channel`, `a2=ptr`, `a3=len` | Route through the same inline-copy mailbox path after service-channel validation. |

The ABI v2 contract remains pointer/length based. Existing ABI v2 callers are still compatible because this PR does not renumber IPC syscalls, does not reinterpret existing `ptr,len` arguments as descriptors, and does not change IPC return codes.

## Current Copy and Low-Copy Behavior

The kernel mailbox currently has two payload forms:

- **Inline payloads** copy sender bytes into a `Vec<u8>` while enqueueing and copy the same bytes to the receiver's user buffer during inline receive.
- **Shared-memory payloads** store immutable bytes behind an `Arc<[u8]>` in `SharedMemoryGrant`. This avoids repeated kernel-side payload clones when a grant is queued, but it is kernel-internal and is not production zero-copy IPC.

`SYS_IPC_RECV` and `SYS_IPC_RECV_NONBLOCKING` reject shared-memory payloads instead of exposing them through the inline receive ABI. That rejection is deliberate: user-space shared-memory IPC needs a reviewed descriptor contract, ownership-transfer rules, revocation behavior, and mapping lifetime management before it can be considered stable.

## Descriptors

Shared code now defines explicit IPC descriptors for future descriptor-aware IPC surfaces:

- `IpcPayloadKind` distinguishes inline and shared-memory payload descriptions.
- `IpcBufferDescriptor` describes one pointer/length payload and reserves flag bytes for future extensions.
- `IpcMessageDescriptor` carries an `abi_version`, sender metadata, and a buffer descriptor.

These structs document the expected shape of descriptor IPC without changing ABI v2 syscall arguments. Descriptor-aware callers can check `IpcMessageDescriptor::is_abi_v2_compatible()` for the current inline-only compatibility case, but the kernel does not accept these descriptors as `SYS_IPC_SEND` or `SYS_IPC_RECV` arguments today.

## What Is Not Yet Production Zero-Copy

Do not describe current syscall IPC as production zero-copy. The following invariants are still manual-review items:

- sender-to-receiver ownership transfer or lending semantics;
- mapping and unmapping lifetime rules;
- sender mutation and receiver visibility rules;
- revocation on task exit, channel close, or capability loss;
- accounting for shared pages versus inline queue bytes;
- descriptor validation across privilege and capability boundaries;
- conformance tests that prove ABI compatibility and failure modes.

## ABI Compatibility Policy

IPC changes that keep ABI v2 compatibility must preserve all of the following:

1. syscall numbers remain unchanged;
2. existing pointer/length argument layouts remain unchanged;
3. inline send and receive continue to copy through kernel-validated user buffers;
4. shared-memory payloads are not silently returned through the inline receive ABI;
5. return-code semantics in `docs/SYSCALL-ABI.md` remain valid.

Any IPC change that alters those rules must receive manual ABI review and either prove ABI v2 compatibility with tests or bump `SYSCALL_ABI_VERSION`.

## Validation

Run the following checks after IPC ABI changes:

```sh
python3 scripts/check_syscall_abi.py
cargo test -p aetheros_common --lib
```

The Python check guards syscall-number/document drift. The Rust tests assert ABI v2 constants and descriptor layout stability.
