# AetherOS Nexus Core Security Policy

This file inherits the repository-level security policy in `../SECURITY.md` and narrows it for the Rust core under `AetherOS/`.

AetherOS Nexus Core is experimental operating-system research code. Do not treat the current core as production-ready or suitable for protecting sensitive workloads.

## Supported Code Paths

| Area | Status | Security Support |
| --- | --- | --- |
| `AetherOS/kernel/` | Authoritative Rust kernel implementation | Security issues accepted and prioritized |
| `AetherOS/common/` | Shared ABI and `no_std` APIs | Security issues accepted and prioritized |
| `AetherOS/vnode/` | Rust V-Node/service crates | Security issues accepted when they affect V-Node isolation, IPC, or service permissions |
| `AetherOS/libnexus-net/` and `AetherOS/tools/` | Networking and image/build support | Security issues accepted when they affect kernel integration, build integrity, or misleading artifacts |
| Documentation in this subtree | Guidance and contributor-facing contracts | Issues accepted when docs overstate implemented security behavior |

## Implemented or Partially Implemented Mechanisms

Current code includes capability definitions and checks, syscall ABI constants and wrappers, syscall dispatch, user-copy range validation helpers, IPC service routing, and task capability storage.

These mechanisms are not a complete production security certification. Reviewers should continue to distinguish checked kernel paths from roadmap goals and simulation/bootstrap shortcuts.

## Validation Notes

Use the root security model at `../docs/SECURITY-MODEL.md` for the current review checklist. In particular:

- V-Node and task operations must identify the capability or device right they require.
- Syscall paths should reject missing capabilities before performing privileged work.
- User buffers crossing the ABI boundary should go through kernel copy helpers and enforce bounded lengths.
- ABI changes should keep `AetherOS/common/src/syscall.rs`, root ABI mirrors, and `../docs/SYSCALL-ABI.md` aligned.

## Reporting a Vulnerability

Report vulnerabilities privately to the repository maintainers using the project channels they publish for this repository. Do not open a public issue for a vulnerability until maintainers have coordinated disclosure.

Include affected paths, reproduction steps, expected impact, whether the issue affects the Rust core or documentation/ABI contracts, and any suggested mitigation.

This policy intentionally avoids hard response-time or disclosure-SLA commitments unless maintainers add project-approved wording.

## Roadmap Goals, Not Current Guarantees

Do not describe these goals as implemented security guarantees yet:

- Fully immutable, content-addressed, cryptographically signed V-Node bundles.
- Production zero-copy IPC with formally validated ownership transfer.
- Complete zero-copy networking from NIC to application.
- Production-grade visual observability and policy enforcement for all IPC flows.
