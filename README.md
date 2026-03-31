
🌌 AetherOS Alpha — The Nexus Architecture
Join the Aether. Build the Nexus.

🚀 Project Vision & Mission
AetherOS is not just another operating system; it's a Nexus Hybrid – a new class of OS designed from the ground up to redefine security, performance, and transparency. Our mission is to build a platform that is robust, user‑centric, and resilient in an increasingly complex digital world, empowering developers with unprecedented control and insight.

Traditional operating systems are prisoners of their history:

Windows is a monolithic labyrinth of legacy code.

Linux is powerful but fragmented and requires deep expertise.

macOS is polished but closed and restrictive.

None of them are built for a world where drivers are sandboxed by default, IPC is visually inspectable, and applications are immutable, cryptographically verifiable entities.
AetherOS aims to be that paradigm shift.

🧬 Core Architectural Pillars (Alpha Complete)
Memory Safety by Default — Rust‑based Nexus Core eliminates most classic kernel vulnerabilities.

Nexus Hybrid Microkernel — Minimal kernel handling memory, scheduling, and IPC.

Capability‑Based Security — No root user; every V‑Node has explicit rights.

Zero‑Copy IPC — Shared memory with transfer‑of‑ownership semantics.

Zero‑Trust Runtime — Every operation is validated.

Immutable V‑Nodes — Cryptographically signed, content‑addressed application bundles.

Zero‑Copy Networking — NIC → application with minimal CPU overhead.

Visual Observability — Real‑time visualization of IPC flows and V‑Node states.

Aether Driver Intelligence (ADI) — AI‑assisted translation of unsafe drivers into sandboxed V‑Nodes.

Decentralized Trust Model — Merkle Trees + CAS.

Resource Quotas & Admission Control — Enforced per V‑Node.

⚠️ Experimental Replit‑Style Interface (Concept Only)
AetherOS Nexus v0.4 introduces an experimental Replit‑style development interface included as a conceptual preview of the future user‑space environment.

It is not functional.

It serves as a visual and architectural prototype only.

It demonstrates how developers may interact with V‑Nodes, IPC flows, and system services in future releases.

This interface is included for exploration and early design validation.

📁 Project Structure
Код
aetheros/
├─ Cargo.toml
├─ kernel/
│  ├─ Cargo.toml
│  ├─ src/
│  │  ├─ arch/x86_64/
│  │  ├─ drivers/
│  │  ├─ memory/
│  │  ├─ task/
│  │  ├─ ipc/
│  │  ├─ console.rs
│  │  ├─ timer.rs
│  │  ├─ caps.rs
│  │  ├─ syscall.rs
│  │  ├─ lib.rs
│  │  ├─ main.rs
│  │  ├─ aetherfs.rs
│  │  ├─ elf.rs
│  │  └─ vnode_loader.rs
│  └─ linker.ld
├─ common/
│  ├─ Cargo.toml
│  ├─ src/
│  │  ├─ ipc/
│  │  ├─ syscall.rs
│  │  └─ lib.rs
├─ vnode/
│  ├─ dns-resolver/
│  ├─ file-manager/
│  ├─ init-service/
│  ├─ mail-service/
│  ├─ model-runtime/
│  ├─ net-bridge/
│  ├─ net-stack/
│  ├─ registry/
│  ├─ shell/
│  ├─ socket-api/
│  └─ vfs/
🛠️ Build & Run Guide (bootloader_api 0.11)
Prerequisites
Rust nightly

rust-src and llvm-tools-preview

QEMU

bash
rustup toolchain install nightly-2024-12-01
rustup override set nightly-2024-12-01
rustup component add rust-src
rustup component add llvm-tools-preview
Build kernel
bash
cd AetherOS
cargo +nightly-2024-12-01 build --release --target .cargo/aetheros-x86_64.json \
  -Zbuild-std=core,alloc,compiler_builtins \
  -Zbuild-std-features=compiler-builtins-mem \
  -Zjson-target-spec
Or:

bash
./scripts/build_kernel_image.sh
Run in QEMU
bash
qemu-system-x86_64 -kernel target/aetheros-x86_64/release/aetheros-kernel
Workspace helpers
bash
./scripts/build_all.sh
./scripts/build_initrd.sh
./scripts/run_qemu.sh
🔧 Troubleshooting
If validating user‑space V‑Nodes:

bash
cd AetherOS
cargo build -p registry -p init-service
If you see:

Код
WARNING: `CARGO_MANIFEST_DIR` env variable not set
error: `.json` target specs require -Zjson-target-spec
You may be:

outside AetherOS/

on the wrong nightly

mixing toolchains

missing -Zjson-target-spec

Use the helper scripts for consistency.

📘 NotebookLM — Centralized Knowledge Hub
NotebookLM aggregates all AetherOS Nexus Core v0.3 documentation:

Architecture

Security & cryptography

Networking & AetherNet

V‑Node analysis

Rust safety

Diagrams & visualizations

Summaries, tests, reports

🔗 https://notebooklm.google.com/notebook/be0fd2b7-ed9f-4bbb-9f09-eb93b779d822 (notebooklm.google.com in Bing)

⚠️ Current Limitations
AetherOS Nexus Core v0.3 is early alpha and lacks:

CI/CD

Automated tests

Linting & formatting

Security policies

Contribution guidelines

Roadmap includes GitHub Actions, test suites, formatting standards, and a project roadmap.

🎯 v0.4 Integration Priority — ABI Synchronization
First PR should focus on:

64‑bit syscall3 ABI

Pointer‑width validation

Argument marshalling

Minimal IPC roundtrip test

This stabilizes the foundation for all V‑Node services.

🧭 Recommended Execution Order After v0.3
API Documentation Freeze

Live ISO Bring‑up

Performance Iteration

This minimizes rework and ensures stable integration.

Join the Aether. Build the Nexus.
