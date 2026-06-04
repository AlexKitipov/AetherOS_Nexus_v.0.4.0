# AetherOS Nexus v0.4.0

AetherOS Nexus v0.4.0 is a split repository containing two very different code paths:

1. **Authoritative Rust OS core (v0.3)** under `Aether_OS_Nexus_Core_v.0.3/AetherOS/`.
2. **TypeScript/React Nexus UI shell (v0.4)** under `client/`, `server/`, `shared/`, and related root files.

The Rust kernel and its `common`/`vnode` crates are the source of truth for OS behavior. The v0.4 TypeScript/React interface is an experimental UI and development shell; it is not currently a bootable OS, kernel replacement, or complete user-space runtime.

## Current Repository Status

- The functional Rust workspace lives in `Aether_OS_Nexus_Core_v.0.3/AetherOS/`.
- The root `Cargo.toml` is a wrapper over that Rust workspace so basic Cargo commands can be run from the repository root without moving the core crates.
- Root-level `kernel/` currently contains ABI contract/documentation support only and is not the authoritative kernel implementation.
- Root-level TypeScript code is an optional Nexus UI/server prototype.
- Claims such as fully immutable V-Nodes, production zero-copy IPC, and complete zero-copy networking are roadmap goals unless specifically implemented in the Rust core.

## Repository Layout

```text
.
├── Cargo.toml                         # Root Rust workspace wrapper for the v0.3 OS core
├── rust-toolchain.toml                 # Unified Rust toolchain for root-level Cargo commands
├── Aether_OS_Nexus_Core_v.0.3/
│   └── AetherOS/
│       ├── Cargo.toml                  # Original Rust workspace manifest
│       ├── common/                     # Shared no_std Rust APIs, syscall ABI, IPC helpers
│       ├── kernel/                     # Authoritative Rust kernel implementation
│       ├── vnode/                      # Rust V-Node/service crates
│       ├── libnexus-net/               # Network support crate
│       ├── tools/image_builder/        # Kernel/image tooling
│       └── Nexus/UI/vnode/             # Rust UI-related V-Node experiments
├── client/                             # Experimental TypeScript/React UI shell
├── server/                             # Experimental Node/Express backend for the UI shell
├── shared/                             # Shared TypeScript schemas/ABI descriptions
├── docs/                               # Root architecture, ABI, and PR planning documents
└── kernel/src/syscall/                 # Root-level ABI contract notes, not the live kernel
```

## Building from the Repository Root

The safest root-level Rust check builds the shared `common` crate:

```bash
cargo check -p aetheros_common
```

The full bare-metal kernel build still uses the AetherOS target JSON and nightly `-Zbuild-std` flags:

```bash
cargo build \
  -p aetheros-kernel \
  --release \
  --target Aether_OS_Nexus_Core_v.0.3/AetherOS/.cargo/aetheros-x86_64.json \
  -Zbuild-std=core,alloc,compiler_builtins \
  -Zbuild-std-features=compiler-builtins-mem
```

The original helper remains available:

```bash
cd Aether_OS_Nexus_Core_v.0.3/AetherOS
./scripts/build_kernel_image.sh
```

## Running the TypeScript/React Shell

The v0.4 UI shell is separate from the Rust kernel and should be treated as an experimental web application:

```bash
npm run dev
```

Use TypeScript checks for the UI/server code:

```bash
npm run check
```

## Architecture Documentation

- `docs/ARCHITECTURE.md` describes the current split architecture, root support-directory boundaries, and roadmap boundaries.
- `docs/SYSCALL-ABI.md` documents the current syscall ABI version and stabilization expectations.
- `docs/PR-ROADMAP.md` turns the repository audit into a staged PR plan.

## Security

See `SECURITY.md` for supported code paths, reporting guidance, and an honest summary of implemented vs. planned security properties.
