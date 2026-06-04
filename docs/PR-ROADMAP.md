# Audit Remediation PR Roadmap

This roadmap converts the repository-wide audit into seven low-risk pull requests. The sequencing keeps the Rust v0.3 kernel as the authoritative implementation and avoids destructive moves until documentation, builds, and ABI contracts are stable.

## PR #1 — Directory Consolidation and Root Build Wrapper

### Summary

- Add a root `Cargo.toml` that points to existing Rust core workspace members under `Aether_OS_Nexus_Core_v.0.3/AetherOS/`.
- Keep the existing v0.3 tree intact; do not move or delete the Rust kernel yet.
- Mark root-level `kernel/src/syscall/` as contract/documentation support rather than the live kernel.
- Add root documentation that names the Rust v0.3 core as authoritative.

### Files to change

- Create/modify: `Cargo.toml`
- Create/modify: `rust-toolchain.toml`
- Modify: `README.md`
- Create: `docs/ARCHITECTURE.md`
- Create: `docs/PR-ROADMAP.md`

### Safe to auto-apply

- Root workspace wrapper.
- README wording corrections.
- Architecture/roadmap docs.

### Manual review required

- Any physical move from `Aether_OS_Nexus_Core_v.0.3/AetherOS/{kernel,common,vnode}` to root-level directories.
- Deletion of placeholder directories.

### Suggested commit message

`chore: add root workspace wrapper and architecture docs`

## PR #2 — Toolchain Unification

### Summary

- Standardize on `nightly-2025-03-01`, matching the active Rust core under `Aether_OS_Nexus_Core_v.0.3/AetherOS/`.
- Update stale docs and parent toolchain files that still mention `nightly-2024-12-01`.
- Preserve the vendored bootloader toolchain unless its build scripts require a separate reviewed update.

### Files to change

- Modify: `rust-toolchain.toml`
- Modify: `Aether_OS_Nexus_Core_v.0.3/rust-toolchain.toml`
- Verify/keep: `Aether_OS_Nexus_Core_v.0.3/AetherOS/rust-toolchain.toml`
- Modify: `README.md`
- Optional create: `docs/BUILDING.md`

### Safe to auto-apply

- Toolchain file updates from `nightly-2024-12-01` to `nightly-2025-03-01`.
- Documentation updates for root build commands.

### Manual review required

- Changes to vendored bootloader toolchain files.
- Changes to target JSON or boot image scripts.

### Suggested commit message

`chore: unify rust toolchain on nightly-2025-03-01`

## PR #3 — ABI Stabilization

### Summary

- Treat `SYSCALL_ABI_VERSION = 2` in `Aether_OS_Nexus_Core_v.0.3/AetherOS/common/src/syscall.rs` as canonical.
- Add `docs/SYSCALL-ABI.md` with version, register mapping, buffer contract, and stabilization checklist.
- Keep root-level `kernel/src/syscall/abi_contract.rs` aligned with the canonical constant or replace it with generated/validated docs in a later PR.
- Add tests or checks to catch ABI drift.

### Files to change

- Verify/modify: `Aether_OS_Nexus_Core_v.0.3/AetherOS/common/src/syscall.rs`
- Verify/modify: `Aether_OS_Nexus_Core_v.0.3/AetherOS/kernel/src/syscall.rs`
- Modify: `kernel/src/syscall/abi_contract.rs`
- Create: `docs/SYSCALL-ABI.md`
- Optional modify: `shared/kernelAbi.ts`

### Safe to auto-apply

- ABI documentation.
- Non-invasive constant/test alignment.

### Manual review required

- Any syscall renumbering.
- Any change to argument layouts, pointer semantics, or return codes.

### Suggested commit message

`docs: document syscall ABI version 2 contract`

## PR #4 — Security and Validation Honesty

### Summary

- Replace the generic root `SECURITY.md` template with project-specific reporting and supported-code-path guidance.
- Explicitly distinguish implemented security mechanisms from roadmap goals.
- Add validation notes for V-Node capability checks and ABI boundary checks.

### Files to change

- Modify: `SECURITY.md`
- Optional modify: `Aether_OS_Nexus_Core_v.0.3/SECURITY.md`
- Optional create: `docs/SECURITY-MODEL.md`

### Safe to auto-apply

- Root `SECURITY.md` replacement.
- Documentation wording that removes unsupported claims.

### Manual review required

- Security policy commitments, contact channels, or SLA wording from maintainers.
- Kernel capability enforcement changes.

### Suggested commit message

`docs: replace generic security policy with project-specific guidance`

## PR #5 — Documentation Consolidation

### Summary

- Consolidate conflicting README claims.
- Ensure all READMEs point to the root README and `docs/ARCHITECTURE.md` for current status.
- Move alpha-complete or roadmap-only claims into a clearly labeled roadmap/future-goals section.

### Files to change

- Modify: `README.md`
- Modify: `Aether_OS_Nexus_Core_v.0.3/README.md`
- Modify: `Aether_OS_Nexus_Core_v.0.3/AetherOS/README.md`
- Optional create: `docs/ROADMAP.md`
- Optional create: `docs/BUILDING.md`

### Safe to auto-apply

- Wording changes that reduce overclaims.
- Cross-links among docs.

### Manual review required

- Removing historical docs.
- Rebranding or version-number changes.

### Suggested commit message

`docs: consolidate repository status and roadmap claims`

## PR #6 — V-Node Immutability and Capability Hashing

### Summary

- Replace any hash-of-empty-vector placeholder with deterministic hashing of the actual V-Node manifest/capability set.
- Define a stable manifest schema before enforcing immutable bundle guarantees.
- Keep documentation clear that full immutability is not complete until this PR lands and tests pass.

### Files to change

- Search/modify: `Aether_OS_Nexus_Core_v.0.3/AetherOS/kernel/src/vnode_loader.rs`
- Search/modify: `Aether_OS_Nexus_Core_v.0.3/AetherOS/common/src/**`
- Search/modify: `Aether_OS_Nexus_Core_v.0.3/AetherOS/vnode/**`
- Optional create: `docs/VNODE-MANIFEST.md`
- Optional add tests near the implementation crate.

### Safe to auto-apply

- Documentation stating current limitations.
- Tests that expose the empty-hash placeholder.

### Manual review required

- Manifest schema finalization.
- Enforcement of signature checks or content-addressing.
- Changes that can reject existing V-Nodes.

### Suggested commit message

`feat: hash vnode capabilities from deterministic manifests`

## PR #7 — IPC Protocol Enhancement

### Summary

- Document current IPC semantics and avoid calling them production zero-copy unless ownership-transfer invariants are implemented and tested.
- Introduce explicit message/buffer descriptors if needed.
- Add compatibility checks so ABI v2 callers remain supported or the ABI version is bumped.

### Files to change

- Search/modify: `Aether_OS_Nexus_Core_v.0.3/AetherOS/common/src/ipc/**`
- Search/modify: `Aether_OS_Nexus_Core_v.0.3/AetherOS/kernel/src/ipc*`
- Search/modify: `Aether_OS_Nexus_Core_v.0.3/AetherOS/kernel/src/syscall.rs`
- Create: `docs/IPC.md`
- Update: `docs/SYSCALL-ABI.md` if syscall contracts change.

### Safe to auto-apply

- IPC documentation and tests describing current copy/low-copy behavior.

### Manual review required

- Ownership-transfer semantics.
- Shared-memory lifetime management.
- Any ABI-breaking IPC syscall changes.

### Suggested commit message

`docs: clarify ipc semantics and zero-copy roadmap`
