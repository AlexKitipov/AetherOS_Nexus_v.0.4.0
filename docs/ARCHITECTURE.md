# AetherOS Nexus Architecture

AetherOS Nexus v0.4.0 currently contains a split architecture: an authoritative Rust OS core inherited from v0.3 and an experimental TypeScript/React shell introduced for v0.4 design exploration.

## Authoritative Rust Core

The operating-system implementation lives under `Aether_OS_Nexus_Core_v.0.3/AetherOS/`.

Important components:

- `kernel/`: the Rust kernel implementation, including architecture setup, memory/runtime subsystems, syscall dispatch, IPC, and capability checks.
- `common/`: shared `no_std` APIs used by the kernel and V-Nodes, including syscall constants and ABI wrappers.
- `vnode/`: Rust V-Node/service crates such as registry, shell, VFS, networking, logger, and model runtime experiments.
- `libnexus-net/`: networking support used by the Rust core.
- `tools/image_builder/`: tooling for boot/image generation.

The Rust core is the source of truth for implemented OS behavior. Root-level manifests and documents should point back to this implementation rather than describing an unrelated architecture.

## Root-Level Support Directories

The root-level `kernel/src/syscall/` directory is contract/documentation support for ABI review. It is not the live kernel implementation, should not be treated as a replacement for `Aether_OS_Nexus_Core_v.0.3/AetherOS/kernel/`, and should remain aligned with the canonical Rust core syscall definitions.

## TypeScript/React v0.4 Shell

The root TypeScript project (`client/`, `server/`, `shared/`, and related config files) is an optional UI/development shell. It can be useful for prototyping concepts such as desktop interactions, system visualization, and developer workflows, but it is not currently a bootable OS layer and does not replace the Rust kernel.

Security-sensitive claims for the UI shell should be limited to what the code actually enforces. It should not be described as a trusted kernel, a complete V-Node runtime, or a production security boundary.

## V-Nodes and Capabilities

V-Nodes are the intended unit for isolated services and applications. In the current Rust core, V-Node-related crates and syscall paths provide the foundation for service separation and explicit permissions.

At a high level:

- V-Nodes communicate with the kernel and services through the syscall and IPC interfaces.
- Capabilities describe which actions or channels a V-Node may use.
- Kernel-side checks are expected to reject operations without the required capability.

The long-term goal is for V-Nodes to become immutable, content-addressed, cryptographically verifiable bundles with reproducible manifests and stable capability hashes. That is not yet complete and is tracked as roadmap language in [`docs/ROADMAP.md`](ROADMAP.md) until implemented and tested.

## IPC and Networking Status

The project aims for efficient IPC and networking. Current documentation should avoid claiming production zero-copy IPC or end-to-end zero-copy networking unless the relevant Rust paths actually implement and test those semantics.

Current safe wording:

- IPC exists and is part of the kernel/V-Node design.
- Some paths may use shared buffers or low-copy techniques.
- Formal zero-copy ownership transfer and complete zero-copy networking are future goals tracked in [`docs/ROADMAP.md`](ROADMAP.md).

## Build Model

The repository root contains a Cargo workspace wrapper that points to the v0.3 Rust core members. This allows root-level discovery and basic checks while preserving the existing Rust implementation layout.

The TypeScript shell remains built with npm scripts and should be validated separately.
