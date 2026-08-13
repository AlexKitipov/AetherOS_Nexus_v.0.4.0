# AetherOS Nexus Security Model

AetherOS Nexus is an experimental operating-system research project. This document describes security mechanisms that are visible in the current repository and separates them from design goals that still need implementation, tests, or maintainer review.

## Scope and Trust Boundaries

The authoritative OS implementation is the Rust core under `Aether_OS_Nexus_Core_v.0.3/AetherOS/`. Root-level TypeScript, React, and contract files are useful for prototypes, documentation, and validation, but they are not a trusted OS security boundary.

Current security review should focus on these boundaries:

- Syscall entry and dispatch between V-Node/user code and the Rust kernel.
- Capability checks on kernel services, IPC, IRQ, DMA, logging, time, and network paths.
- User-buffer validation and copying at the ABI boundary.
- Documentation or contract drift that could cause contributors to rely on behavior the Rust core does not enforce.

## Implemented or Partially Implemented Mechanisms

The current Rust core contains the following security-relevant mechanisms:

- A shared syscall ABI definition in `common/src/syscall.rs`, including ABI version, max argument count, syscall numbers, common return codes, and the ABI-safe `UserBuf` descriptor.
- Kernel syscall dispatch in `kernel/src/syscall.rs` that checks selected capabilities before allowing operations such as logging, IPC, time reads, IRQ registration/acknowledgment, DMA buffer management, network operations, and capability delegation.
- Capability storage and lookup in the scheduler, with helper wrappers in `kernel/src/caps.rs`.
- User-copy helpers in `kernel/src/usercopy.rs` that reject null pointers, arithmetic overflow, and addresses outside the configured user-space range before copying.
- ABI drift checks in `scripts/check_syscall_abi.py` that compare canonical Rust constants, the root-level ABI mirror, and `docs/SYSCALL-ABI.md`.

These mechanisms are security-relevant but should not be described as a complete production sandbox. They need broader negative tests, hardware/entry-path coverage, and policy review before being treated as a stable security boundary.

## V-Node Capability Validation Notes

Current V-Node and task permissions are represented as Rust `Capability` values. Kernel syscall paths check those capabilities before many privileged operations:

- `LogWrite` gates `SYS_LOG`.
- `IpcManage` gates IPC send/receive and domain-routed UI, Swarm, AI, and VFS calls.
- `TimeRead` gates `SYS_TIME`.
- IRQ, DMA, network, and capability-grant paths check their corresponding capability values.
- Device read/write helpers check V-Node device rights before performing the operation.

Reviewers should validate both positive and negative behavior. A change that adds a syscall, service route, device operation, or task-spawn path should answer:

1. Which capability or device right is required?
2. Where is the check performed in the kernel path?
3. What error code is returned when the check fails?
4. Can a task gain the capability only through an intended grant, inheritance, or bootstrap path?
5. Is the denied path covered by a test or a documented manual validation step?

Known limitations:

- Some bootstrap and simulation paths intentionally grant broad capabilities to kernel/init tasks.
- Capability inheritance and delegation exist, but policy for production least-privilege manifests is still evolving.
- The repository does not yet provide a complete formal model or exhaustive conformance suite for V-Node isolation.

## ABI Boundary Validation Notes

ABI v2 currently defines a six-argument `u64` syscall interface for x86_64. User pointers and lengths cross the boundary as raw integer arguments or as the `UserBuf` layout when a structured descriptor is needed.

When touching ABI-facing code, reviewers should validate:

1. The syscall number, argument order, and return-code semantics match `docs/SYSCALL-ABI.md` and `common/src/syscall.rs`.
2. Pointer/length arguments are copied through `copy_from_user`, `copy_to_user`, or `copy_utf8_from_user` instead of being dereferenced directly.
3. Copy sizes are bounded by syscall-specific limits where appropriate.
4. Invalid pointers, kernel-space pointers, overflowing ranges, and malformed UTF-8 return an error instead of being trusted.
5. Any ABI-number or layout change updates the ABI version or is explicitly documented as compatible.
6. `python3 scripts/check_syscall_abi.py` and the relevant Rust tests pass before merging.

Known limitations:

- The current validation helpers perform range checks and bounded copies; they are not a substitute for a complete virtual-memory fault isolation story.
- Per-syscall conformance tests for every argument layout and denied case are still a roadmap item.
- Root-level ABI contract files are mirrors for review and validation, not the live kernel implementation.

## Roadmap Goals, Not Current Guarantees

Do not present the following goals as implemented security guarantees until code, tests, and maintainer review support them:

- Immutable, content-addressed, cryptographically signed V-Node bundles.
- Admission checks that enforce the stable V-Node manifest schema and reject unsigned or mismatched bundles.
- Broader conformance tests for least-privilege V-Node manifests beyond the current deterministic capability-hash coverage.
- Formally verified or production-certified capability isolation.
- Production zero-copy IPC with validated ownership transfer.
- Complete end-to-end zero-copy networking from NIC to application.
- Visual policy enforcement for all IPC and service flows.

## Practical Review Checklist

Before merging security-sensitive changes:

- Confirm whether the change affects the Rust OS core, the TypeScript shell, or documentation-only contract surfaces.
- Verify denied paths fail closed with `E_ACC_DENIED` or another documented error.
- Run ABI drift checks when syscall constants, ABI docs, or mirrors change.
- Update this document or `SECURITY.md` if a claim moves from roadmap to implemented behavior.
- Avoid adding contact channels, disclosure SLAs, or production support promises without maintainer approval.
