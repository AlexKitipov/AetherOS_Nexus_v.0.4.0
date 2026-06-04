# Building AetherOS Nexus

## Rust toolchain

AetherOS Nexus standardizes root and core Rust development on `nightly-2025-03-01`.
The following files intentionally use the same channel:

- `rust-toolchain.toml`
- `Aether_OS_Nexus_Core_v.0.3/rust-toolchain.toml`
- `Aether_OS_Nexus_Core_v.0.3/AetherOS/rust-toolchain.toml`

Do not update vendored bootloader toolchain files as part of general repository toolchain alignment.
Those files belong to the vendored bootloader package and require a separate reviewed update if its build flow changes.

Install the pinned toolchain and components with:

```bash
rustup toolchain install nightly-2025-03-01
rustup component add rust-src llvm-tools-preview --toolchain nightly-2025-03-01
```

The repository `rust-toolchain.toml` files select the pinned toolchain automatically when commands are run from their directories.
Use explicit `+nightly-2025-03-01` invocations in scripts or troubleshooting commands when you need to avoid global overrides.

## Root workspace check

From the repository root, the fastest Rust validation path is the shared `common` crate:

```bash
cargo check -p aetheros_common
```

## Kernel build from the repository root

The bare-metal kernel build uses the AetherOS target JSON and nightly `-Zbuild-std` flags:

```bash
cargo build \
  -p aetheros-kernel \
  --release \
  --target Aether_OS_Nexus_Core_v.0.3/AetherOS/.cargo/aetheros-x86_64.json \
  -Zbuild-std=core,alloc,compiler_builtins \
  -Zbuild-std-features=compiler-builtins-mem
```

## Core helper build

The original helper remains available from the active Rust core:

```bash
cd Aether_OS_Nexus_Core_v.0.3/AetherOS
./scripts/build_kernel_image.sh
```

Avoid legacy `cargo bootimage` instructions for this workspace. The active kernel uses the `bootloader_api` flow instead.
