# AetherOS Nexus Roadmap and Future Goals

This document collects roadmap-only claims that used to be mixed into README status sections. It is intentionally aspirational: items here are planned, experimental, or partially prototyped unless a linked implementation document says otherwise.

For current repository status and architecture boundaries, start with the root [`README.md`](../README.md) and [`docs/ARCHITECTURE.md`](ARCHITECTURE.md).

## Current Focus

1. **ABI synchronization**
   - Keep the kernel syscall dispatcher, `common` syscall wrappers, root ABI notes, and TypeScript ABI descriptions aligned.
   - Preserve a stable 64-bit `syscall3` contract for IPC and service integration.
2. **Documentation and build hygiene**
   - Maintain current build instructions in [`docs/BUILDING.md`](BUILDING.md).
   - Keep README files short, status-focused, and linked back to canonical docs.
3. **Core validation**
   - Expand smoke tests around kernel/common boundaries and V-Node IPC paths.
   - Add CI coverage for formatting, linting, and targeted Rust/TypeScript checks.

## Future Architecture Goals

The following are project goals, not completed repository guarantees:

- Fully immutable, content-addressed, cryptographically verifiable V-Node bundles.
- Production-grade zero-copy IPC with formal ownership-transfer semantics.
- Complete zero-copy networking from NIC buffers through service/application boundaries.
- Capability-scoped driver sandboxing for a broader set of hardware drivers.
- Visual observability of IPC flows, V-Node state, and resource usage.
- Aether Driver Intelligence (ADI) or other AI-assisted driver translation workflows.
- Decentralized trust models using Merkle trees, content-addressable storage, and reproducible manifests.
- Resource quotas and admission control enforced across all V-Node lifecycle stages.
- Aether Swarm Federation concepts such as discovery, gossip synchronization, and capability-gated remote V-Node execution.

## Suggested Implementation Sequence

1. **API documentation freeze**
   - Generate canonical docs for syscall ABI, IPC message schemas, and V-Node service contracts.
   - Mark protocol and version boundaries explicitly before v0.4 performance work.
2. **Live image bring-up**
   - Build a minimal bootable image containing the kernel plus enough services to validate a real runtime path.
   - Validate boot and IPC behavior in QEMU before optimizing.
3. **Performance iteration**
   - Introduce DMA ring-buffer and dispatch-filtering experiments only after interfaces are stable.
   - Benchmark latency and throughput before and after each optimization step.

## Quality Infrastructure Goals

- Add or maintain CI workflows for build, test, format, and lint checks.
- Grow unit and integration tests for `common`, V-Node services, and kernel/user ABI boundaries.
- Keep security and contribution guidance up to date as implemented guarantees change.
