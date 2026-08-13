# AetherOS Rust Core Workspace

This is the active Rust workspace for the AetherOS Nexus core that was inherited from v0.3. In the combined v0.4 repository, the canonical status summary is the root [`README.md`](../../README.md), and the current architecture boundaries are documented in [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md).

Use this README for workspace-local build commands. Broader product, architecture, and roadmap claims should remain in the root docs so the repository has one source of truth.

## Current Status

- `kernel/` contains the authoritative Rust kernel implementation.
- `common/` contains shared `no_std` APIs, syscall constants, ABI wrappers, and IPC helpers.
- `vnode/` contains V-Node/service crates and experiments.
- `libnexus-net/` contains network support used by the Rust core.
- `tools/image_builder/` contains kernel/image tooling.

The repository-root TypeScript/React UI shell is separate from this workspace. It is an experimental development shell, not a replacement for the Rust kernel.

## Roadmap Boundaries

AetherOS explores a Nexus hybrid microkernel, capability-based security, V-Nodes, efficient IPC, and network service isolation. Older claims such as "alpha complete," fully immutable V-Nodes, production zero-copy IPC, complete zero-copy networking, visual observability, AI-assisted driver translation, decentralized trust, or swarm federation should be treated as roadmap language unless a current implementation and test proves the specific behavior.

See [`docs/ROADMAP.md`](../../docs/ROADMAP.md) for consolidated future goals.

## Workspace Layout

```text
AetherOS/
├─ Cargo.toml                  # Rust workspace manifest
├─ kernel/                     # Authoritative Rust kernel implementation
├─ common/                     # Shared no_std APIs, syscall ABI, IPC helpers
├─ vnode/                      # V-Node/service crates and experiments
├─ libnexus-net/               # Network support crate
├─ tools/image_builder/        # Kernel/image tooling
└─ Nexus/UI/vnode/             # Rust UI-related V-Node experiments
```

## Build and Run Guidance

For the current unified build model, start with [`docs/BUILDING.md`](../../docs/BUILDING.md). This workspace uses the `bootloader_api` flow; legacy `bootloader` 0.10 / `bootimage` commands are not used.

### Prerequisites

- Rust `nightly-2025-03-01`
- `rust-src` and `llvm-tools-preview` for the pinned nightly
- QEMU (`qemu-system-x86_64`) for runtime smoke tests

```bash
rustup toolchain install nightly-2025-03-01
rustup component add rust-src llvm-tools-preview --toolchain nightly-2025-03-01
```

### Build the kernel

From this `AetherOS/` directory:

```bash
cargo +nightly-2025-03-01 build \
  --release \
  --target .cargo/aetheros-x86_64.json \
  -Zbuild-std=core,alloc,compiler_builtins \
  -Zbuild-std-features=compiler-builtins-mem
```

Or use the helper:

```bash
./scripts/build_kernel_image.sh
```

### Run and helper commands

```bash
./scripts/build_all.sh
./scripts/build_initrd.sh
./scripts/run_qemu.sh
```

Makefile shortcuts are also available from this directory:

```bash
make kernel   # build kernel
make all      # build kernel + selected V-Nodes
make initrd   # build initrd image
make run      # run in QEMU
make test     # non-interactive QEMU smoke test
```

## Troubleshooting

If you are validating user-space V-Node services, build those packages directly from this workspace root:

```bash
cargo build -p registry -p init-service
```

If dependency builds fail because standard prelude types such as `Result` or `Option` are missing, check for custom `RUSTFLAGS`, `CARGO_ENCODED_RUSTFLAGS`, or `CARGO_BUILD_RUSTFLAGS` leaking into dependency builds. The provided build scripts clear those variables before invoking Cargo.

If you see `unknown -Z flag specified: json-target-spec`, use the pinned `nightly-2025-03-01` toolchain and the build commands above. If you see a `bootimage` alias conflict, remove or rename the global Cargo alias and avoid legacy `cargo bootimage` instructions for this workspace.
