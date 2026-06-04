# AetherOS Syscall ABI

## ABI v2 Canonical Version

The current syscall ABI version is `2`.

The canonical Rust constants live in `Aether_OS_Nexus_Core_v.0.3/AetherOS/common/src/syscall.rs` and are consumed by kernel and V-Node code through the shared `aetheros_common` crate:

```rust
pub const SYSCALL_ABI_VERSION: u64 = 2;
pub const SYSCALL_ABI_MAX_ARGS: u64 = 6;
```

Treat these constants as the source of truth. The root-level mirror at `kernel/src/syscall/abi_contract.rs` must stay byte-for-byte semantically aligned with the canonical version, maximum argument count, and syscall-number table until that mirror is replaced with generated or validated docs in a later PR.

## ABI v2 Register Contract

For the x86_64 `syscall` path, ABI v2 uses the Linux-style register convention below:

| Purpose | Register |
| --- | --- |
| Syscall number | `rax` |
| Argument 1 | `rdi` |
| Argument 2 | `rsi` |
| Argument 3 | `rdx` |
| Argument 4 | `r10` |
| Argument 5 | `r8` |
| Argument 6 | `r9` |
| Return value | `rax` |

`rcx` and `r11` are clobbered by the `syscall` instruction. ABI v2 supports at most six `u64` arguments.

## Syscall Number Table

Syscall numbers are stable for ABI v2. Renumbering any entry, changing an argument layout, changing pointer semantics, or changing return-code semantics requires a manual ABI review and a `SYSCALL_ABI_VERSION` bump.

| Number | Constant | ABI v2 contract summary |
| ---: | --- | --- |
| 0 | `SYS_LOG` | `a1=ptr`, `a2=len`; copies UTF-8 user bytes, capped by kernel log limit; returns `SUCCESS` or error code. |
| 1 | `SYS_IPC_SEND` | `a1=channel_id`, `a2=ptr`, `a3=len`; copies user bytes into mailbox; returns `SUCCESS` or error code. |
| 2 | `SYS_IPC_RECV` | `a1=channel_id`, `a2=out_ptr`, `a3=out_cap`; blocking receive; returns received length or error code. |
| 3 | `SYS_BLOCK_ON_CHAN` | `a1=channel_id`; blocks current task on a channel; returns `SUCCESS`. |
| 4 | `SYS_TIME` | No arguments; returns current timer ticks or access-denied code. |
| 5 | `SYS_IRQ_REGISTER` | `a1=irq_num`, `a2=channel_id`; registers IRQ delivery to channel; returns `SUCCESS` or error code. |
| 6 | `SYS_NET_RX_POLL` | `a1=iface_id`, `a2=dma_handle`, `a3=out_cap`; writes packet into DMA buffer; returns packet length or error code. |
| 7 | `SYS_NET_ALLOC_BUF` | `a1=size`; allocates DMA buffer; returns DMA handle or error code. |
| 8 | `SYS_NET_FREE_BUF` | `a1=dma_handle`; frees DMA buffer; returns `SUCCESS` or error code. |
| 9 | `SYS_NET_TX` | `a2=dma_handle`, `a3=len`; queues packet transmission; returns `SUCCESS` or error code. |
| 10 | `SYS_IRQ_ACK` | `a1=irq_num`; acknowledges IRQ; returns `SUCCESS` or error code. |
| 11 | `SYS_GET_DMA_BUF_PTR` | `a1=dma_handle`; returns DMA buffer pointer as `u64` or error code. |
| 12 | `SYS_SET_DMA_BUF_LEN` | `a1=dma_handle`, `a2=len`; records DMA payload length; returns `SUCCESS` or error code. |
| 13 | `SYS_IPC_RECV_NONBLOCKING` | `a1=channel_id`, `a2=out_ptr`, `a3=out_cap`; nonblocking receive; returns received length or error code. |
| 14 | `SYS_CAP_GRANT` | `a1=target_task_id`, `a2=cap_kind`, `a3=cap_arg`; delegates capability; returns `SUCCESS` or error code. |
| 15 | `SYS_UI_CALL` | `a1=ui_service_channel`, `a2=ptr`, `a3=len`; domain-routed IPC send; returns `SUCCESS` or error code. |
| 16 | `SYS_SWARM_CALL` | `a1=swarm_service_channel`, `a2=ptr`, `a3=len`; domain-routed IPC send; returns `SUCCESS` or error code. |
| 17 | `SYS_AI_CALL` | `a1=ai_service_channel`, `a2=ptr`, `a3=len`; domain-routed IPC send; returns `SUCCESS` or error code. |
| 18 | `SYS_VFS_CALL` | `a1=vfs_service_channel`, `a2=ptr`, `a3=len`; domain-routed IPC send; returns `SUCCESS` or error code. |
| 19 | `SYS_UDP_SEND` | `a1=local_port`, `a2=remote_ipv4_be`, `a3=remote_port`, `a4=payload_ptr`, `a5=payload_len`; returns sent length or error code. |
| 20 | `SYS_UDP_RECV` | `a1=local_port`, `a2=out_ptr`, `a3=out_cap`; copies received payload to user buffer; returns received length or error code. |

## Buffer Contract

ABI v2 passes raw pointer/length pairs as `u64` syscall arguments. Shared code also defines an ABI-safe descriptor for any call surface that needs a single structured buffer argument:

```rust
#[repr(C)]
pub struct UserBuf {
    pub ptr: u64,
    pub len: u64,
}
```

The `UserBuf` layout is exactly two `u64` fields (`ptr`, then `len`). Kernel code must validate user pointers, lengths, capabilities, and channel permissions before dereferencing or acting on user-provided data. Kernel-side copy helpers are responsible for rejecting invalid ranges; callers must not assume user memory remains stable after validation.

## Return Codes

Common return-code constants are part of the ABI contract:

| Constant | Value | Meaning |
| --- | ---: | --- |
| `SUCCESS` | `0` | Operation completed successfully. |
| `E_ERROR` | `1` | Generic operation failure. |
| `E_UNKNOWN_SYSCALL` | `0xffff_ffff_ffff_ffff` | Syscall number is not implemented by the ABI v2 dispatcher. |
| `E_ACC_DENIED` | `0xffff_ffff_ffff_fffe` | Caller lacks required capability or supplied an invalid user buffer. |

Positive nonzero syscall-specific values may be successful payloads, such as received byte lengths, timer ticks, or DMA handles. Callers must interpret return values according to the syscall table above.

## Drift Checks

Run these checks when touching ABI-facing code:

```sh
python3 scripts/check_syscall_abi.py
cargo test -p aetheros_common --lib
```

The Python check compares the canonical Rust constants, the root-level `kernel/src/syscall/abi_contract.rs` mirror, and this document. The Rust tests assert the canonical ABI version, max-argument count, contiguous syscall numbers, and `UserBuf` layout.

## Stabilization Checklist

Before ABI v2 is treated as externally stable:

- [x] Document the ABI version and canonical source of truth.
- [x] Document the x86_64 register mapping and six-argument limit.
- [x] Document syscall numbers, buffer contract, and common return codes.
- [x] Add checks that compare root-level ABI mirrors and docs against canonical Rust constants.
- [ ] Replace root-level mirrors with generated output or wire them directly into a compiled validation crate.
- [ ] Add per-syscall conformance tests for argument layouts, pointer semantics, and return-code handling.
- [ ] Define compatibility policy for future ABI version bumps.
- [ ] Ensure any TypeScript-facing bridge ABI remains explicitly separate from, or generated from, the Rust syscall ABI contract.
