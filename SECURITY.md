# Security Policy

AetherOS Nexus is an experimental operating-system research repository. Please do not treat any current release as production-ready or suitable for protecting sensitive workloads.

## Supported Code Paths

| Area | Status | Security Support |
| --- | --- | --- |
| Rust OS core in `Aether_OS_Nexus_Core_v.0.3/AetherOS/` | Authoritative implementation | Security issues accepted and prioritized |
| Root Rust workspace wrapper | Build/discovery support for the OS core | Security issues accepted when they affect builds or ABI clarity |
| TypeScript/React v0.4 UI shell in `client/`, `server/`, `shared/` | Experimental prototype | Security issues accepted, but this shell is not a trusted OS boundary |
| Root-level placeholder/contract directories such as `kernel/src/syscall/` | Documentation/contract support only | Issues accepted when they create misleading ABI or security claims |

## Current Security Model

See `docs/SECURITY-MODEL.md` for validation notes covering V-Node capability checks, ABI boundary checks, and known limitations.

Implemented or partially implemented areas include:

- Rust-first kernel and shared crates to reduce memory-safety defects in core code.
- Syscall number and ABI constants in `Aether_OS_Nexus_Core_v.0.3/AetherOS/common/src/syscall.rs`.
- Kernel-side syscall dispatch and capability checks in the Rust core.
- V-Node/service separation as the intended unit for user-space services.

Roadmap goals that must not be represented as complete security guarantees yet:

- Fully immutable, content-addressed, cryptographically signed V-Node bundles.
- Production zero-copy IPC with formally validated ownership transfer.
- Complete zero-copy networking from NIC to application.
- Production-grade visual observability and policy enforcement for all IPC flows.

## Reporting a Vulnerability

Please report vulnerabilities privately to the repository maintainers. Include:

- Affected path(s) and component(s).
- Reproduction steps or proof-of-concept details.
- Expected impact and whether the issue affects the Rust OS core, the TypeScript shell, or documentation/ABI contracts.
- Any suggested mitigation.

Maintainers should acknowledge reports within a reasonable period for an experimental project and coordinate disclosure timing based on impact and fix complexity.

## Disclosure and Fix Priorities

1. Kernel memory-safety, syscall, privilege, and capability-boundary issues.
2. V-Node isolation, IPC, and ABI compatibility issues.
3. Build-chain/toolchain issues that can cause unsafe or misleading artifacts.
4. TypeScript UI/server issues.
5. Documentation issues that overstate implemented security properties.

## Out of Scope

- Claims that roadmap-only features are incomplete, unless documentation incorrectly presents them as implemented.
- Vulnerabilities requiring untrusted production deployment of the experimental UI shell without additional hardening.
