# Aether_OS_Nexus_Core_v0.3.0

This directory contains the historical v0.3 Rust-first AetherOS Nexus core. In the combined v0.4 repository, the canonical status summary is the root [`README.md`](../README.md), and architecture boundaries are documented in [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

Use this README as a navigation and build note for the v0.3 core directory. Avoid treating older aspirational language as an implemented guarantee unless it is backed by code in `AetherOS/` and current architecture docs.

## Current Status

- The active Rust workspace lives in [`AetherOS/`](AetherOS/).
- The Rust kernel implementation lives in `AetherOS/kernel/`.
- Shared `no_std` APIs, syscall constants, ABI wrappers, and IPC helpers live in `AetherOS/common/`.
- V-Node/service experiments live in `AetherOS/vnode/` and related workspace crates.
- The repository-root TypeScript/React UI shell is separate from this Rust core and is described in the root [`README.md`](../README.md).

## Implemented vs. Roadmap Language

AetherOS is an experimental operating-system architecture exploring a Nexus hybrid microkernel, capability security, V-Nodes, efficient IPC, and network service isolation. Some older descriptions used stronger language such as "alpha complete," "fully immutable V-Nodes," "production zero-copy IPC," "complete zero-copy networking," or "AI-assisted driver translation."

Those claims should now be read as roadmap or future-goal language unless the current Rust core implements and tests the specific behavior. See [`docs/ROADMAP.md`](../docs/ROADMAP.md) for consolidated future goals.

## Local Project Structure

```text
Aether_OS_Nexus_Core_v.0.3/
├─ AetherOS/
│  ├─ Cargo.toml                  # Original Rust workspace manifest
│  ├─ kernel/                     # Authoritative Rust kernel implementation
│  ├─ common/                     # Shared no_std APIs, syscall ABI, IPC helpers
│  ├─ vnode/                      # V-Node/service crates and experiments
│  ├─ libnexus-net/               # Network support crate
│  ├─ tools/image_builder/        # Kernel/image tooling
│  └─ Nexus/UI/vnode/             # Rust UI-related V-Node experiments
├─ docs/                          # Historical dependency/environment notes for this core
└─ README.md
```

## Build and Run Guidance

For the current unified build model, start with the root [`docs/BUILDING.md`](../docs/BUILDING.md). This core still uses the `bootloader_api` flow; legacy `bootloader` 0.10 / `bootimage` commands are not used.

### Prerequisites

- Rust `nightly-2025-03-01`
- `rust-src` and `llvm-tools-preview` for the pinned nightly
- QEMU (`qemu-system-x86_64`) for runtime smoke tests

```bash
rustup toolchain install nightly-2025-03-01
rustup component add rust-src llvm-tools-preview --toolchain nightly-2025-03-01
```

For local dependency details that were captured with the v0.3 core, see [`docs/dependencies.md`](docs/dependencies.md) and [`docs/environment_audit_checklist.md`](docs/environment_audit_checklist.md).

### Build the kernel from the core workspace

```bash
cd AetherOS
cargo +nightly-2025-03-01 build \
  --release \
  --target .cargo/aetheros-x86_64.json \
  -Zbuild-std=core,alloc,compiler_builtins \
  -Zbuild-std-features=compiler-builtins-mem
```

Or use the helper from `AetherOS/`:

```bash
./scripts/build_kernel_image.sh
```

### Workspace helper flow

```bash
cd AetherOS
./scripts/build_all.sh
./scripts/build_initrd.sh
./scripts/run_qemu.sh
```

## Troubleshooting

If you are validating user-space V-Node services, build those packages directly from `AetherOS/`:

```bash
cd AetherOS
cargo build -p registry -p init-service
```

If you see `unknown -Z flag specified: json-target-spec`, use the pinned `nightly-2025-03-01` toolchain and the build commands above. If you see a `bootimage` alias conflict, remove or rename the global Cargo alias and avoid legacy `cargo bootimage` instructions for this workspace.
