#!/usr/bin/env python3
"""Validate that ABI v2 mirrors and docs match the canonical Rust constants."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CANONICAL = ROOT / "Aether_OS_Nexus_Core_v.0.3/AetherOS/common/src/syscall.rs"
ROOT_CONTRACT = ROOT / "kernel/src/syscall/abi_contract.rs"
DOC = ROOT / "docs/SYSCALL-ABI.md"

CONST_RE = re.compile(
    r"pub const "
    r"(SYS_[A-Z0-9_]+|SYSCALL_ABI_VERSION|SYSCALL_ABI_MAX_ARGS|MAX_SYSCALL_ARGS|MAX_SYSCALL_NUM)"
    r":\s*(?:u64|u32|usize)\s*=\s*([0-9A-Fa-fx]+);"
)
TUPLE_RE = re.compile(r'\("(SYS_[A-Z0-9_]+)",\s*([0-9A-Fa-fx]+)\)')


def parse_consts(path: Path) -> dict[str, int]:
    text = path.read_text()
    return {name: int(value, 0) for name, value in CONST_RE.findall(text)}


def parse_root_tuples(path: Path) -> dict[str, int]:
    text = path.read_text()
    return {name: int(value, 0) for name, value in TUPLE_RE.findall(text)}


def main() -> int:
    canonical = parse_consts(CANONICAL)
    root_contract = parse_consts(ROOT_CONTRACT)
    root_tuples = parse_root_tuples(ROOT_CONTRACT)
    doc = DOC.read_text()

    expected_syscalls = {
        name: value for name, value in canonical.items() if name.startswith("SYS_")
    }
    errors: list[str] = []

    if canonical.get("SYSCALL_ABI_VERSION") != 2:
        errors.append("canonical SYSCALL_ABI_VERSION must remain 2 for ABI v2")

    if root_contract.get("SYSCALL_ABI_VERSION") != canonical.get("SYSCALL_ABI_VERSION"):
        errors.append(
            "root abi_contract SYSCALL_ABI_VERSION drifts from canonical common/src/syscall.rs"
        )

    if root_contract.get("MAX_SYSCALL_ARGS") != canonical.get("SYSCALL_ABI_MAX_ARGS"):
        errors.append(
            "root abi_contract MAX_SYSCALL_ARGS drifts from canonical SYSCALL_ABI_MAX_ARGS"
        )

    if root_contract.get("MAX_SYSCALL_NUM") != max(expected_syscalls.values()):
        errors.append(
            "root abi_contract MAX_SYSCALL_NUM drifts from highest canonical SYS_* value"
        )

    if root_tuples != expected_syscalls:
        errors.append(
            "root abi_contract SYSCALL_NUMBERS table drifts from canonical SYS_* constants"
        )

    for snippet in [
        "SYSCALL_ABI_VERSION: u64 = 2",
        "SYSCALL_ABI_MAX_ARGS: u64 = 6",
        "`rax`",
        "`rdi`",
        "`rsi`",
        "`rdx`",
        "`r10`",
        "`r8`",
        "`r9`",
        "SYS_UDP_RECV",
        "UserBuf",
    ]:
        if snippet not in doc:
            errors.append(f"docs/SYSCALL-ABI.md missing expected ABI snippet: {snippet}")

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print("Syscall ABI v2 contract matches canonical constants, mirror, and docs.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
