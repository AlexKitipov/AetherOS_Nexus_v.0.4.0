#!/usr/bin/env bash
set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

warn_count=0

print_section() {
  printf '\n[%s]\n' "$1"
}

ok() {
  printf '  [OK] %s\n' "$1"
}

warn() {
  printf '  [WARN] %s\n' "$1"
  warn_count=$((warn_count + 1))
}

check_bin() {
  local bin="$1"
  local label="$2"
  if command -v "${bin}" >/dev/null 2>&1; then
    ok "${label}: $(command -v "${bin}")"
  else
    warn "${label}: not found"
  fi
}

print_section "Kernel-level toolchain validation"
check_bin nasm "nasm"
check_bin mcopy "mtools (mcopy)"
check_bin grub-mkrescue "grub-mkrescue"
check_bin x86_64-elf-gcc "x86_64-elf-gcc"
check_bin clang "clang (fallback cross-compiler candidate)"

if [[ -f /usr/share/OVMF/OVMF.fd || -f /usr/share/OVMF/OVMF_CODE.fd || -f /usr/share/edk2/ovmf/OVMF_CODE.fd ]]; then
  ok "OVMF firmware image found"
else
  warn "OVMF firmware image not found (checked /usr/share/OVMF and /usr/share/edk2/ovmf)"
fi

print_section "Rust target installation verification"
if command -v rustup >/dev/null 2>&1; then
  installed_targets="$(rustup target list --installed 2>/dev/null || true)"
  printf '  rustup target list --installed:\n'
  printf '    %s\n' "${installed_targets:-<none>}"

  if printf '%s\n' "${installed_targets}" | grep -qx 'x86_64-unknown-uefi'; then
    ok "x86_64-unknown-uefi is installed"
  else
    warn "x86_64-unknown-uefi is NOT installed"
  fi

  if printf '%s\n' "${installed_targets}" | grep -qx 'x86_64-unknown-none'; then
    ok "x86_64-unknown-none is installed"
  else
    warn "x86_64-unknown-none is NOT installed"
  fi
else
  warn "rustup not found; cannot verify installed targets"
fi

print_section "Python runtime integrity"
if command -v python3 >/dev/null 2>&1; then
  ok "python3: $(python3 --version 2>&1)"
else
  warn "python3 not found"
fi

if command -v pip3 >/dev/null 2>&1; then
  ok "pip3: $(pip3 --version 2>&1)"
else
  warn "pip3 not found"
fi

if command -v python3 >/dev/null 2>&1; then
  python3 - <<'PY'
import importlib
modules = ["numpy", "PIL", "websockets", "IPython"]
for mod in modules:
    try:
        importlib.import_module(mod)
        print(f"  [OK] python import: {mod}")
    except Exception as exc:
        print(f"  [WARN] python import: {mod} ({exc.__class__.__name__}: {exc})")
PY
fi

print_section "Script permissions & shebang validation"
script_issues=0
while IFS= read -r file; do
  if [[ ! -x "${file}" ]]; then
    warn "not executable: ${file}"
    script_issues=$((script_issues + 1))
  fi

  first_line="$(head -n 1 "${file}" || true)"
  if [[ "${first_line}" != "#!/usr/bin/env bash" ]]; then
    warn "unexpected shebang in ${file}: ${first_line:-<empty>}"
    script_issues=$((script_issues + 1))
  fi
done < <(find scripts -maxdepth 1 -type f -name '*.sh' | sort)

if [[ "${script_issues}" -eq 0 ]]; then
  ok "all scripts/*.sh files are executable and use #!/usr/bin/env bash"
fi

print_section "QEMU acceleration (KVM) check"
if [[ -e /dev/kvm ]]; then
  ok "/dev/kvm exists"
  if [[ -r /dev/kvm && -w /dev/kvm ]]; then
    ok "current user has read/write access to /dev/kvm"
  else
    warn "current user lacks read/write access to /dev/kvm"
  fi
else
  warn "/dev/kvm does not exist"
fi

if grep -Eiq '(vmx|svm)' /proc/cpuinfo 2>/dev/null; then
  ok "CPU virtualization flags detected (vmx/svm)"
else
  warn "CPU virtualization flags (vmx/svm) not detected"
fi

print_section "Disk space / tmpfs capacity"
df -h . /tmp | sed 's/^/  /'

print_section "Node.js native module ABI compatibility"
if command -v node >/dev/null 2>&1; then
  node -p "'  [OK] node ' + process.version + ', abi ' + process.versions.modules + ', napi ' + process.versions.napi"
  ldd --version 2>/dev/null | head -n 1 | sed 's/^/  [INFO] /' || warn "could not detect glibc version with ldd"
else
  warn "node is not installed"
fi

print_section "Bootloader build pipeline validation"
if command -v cargo >/dev/null 2>&1; then
  if cargo build -p bootloader >/tmp/aetheros_bootloader_audit.log 2>&1; then
    ok "cargo build -p bootloader succeeded"
  else
    warn "cargo build -p bootloader failed (see /tmp/aetheros_bootloader_audit.log)"
  fi
else
  warn "cargo not installed; cannot validate bootloader pipeline"
fi

if [[ -f scripts/build_kernel_image.sh ]]; then
  ok "build entrypoint exists: scripts/build_kernel_image.sh"
else
  warn "build entrypoint missing: scripts/build_kernel_image.sh"
fi

print_section "Security integrity checks"
warn "file hashes, signature validation, and supply-chain verification are not automated in this script"

print_section "Cross-platform reproducibility"
warn "audit executed on one host only; package names/toolchain paths may differ on macOS, Windows (non-WSL), Arch, and Fedora"

printf '\nAudit completed with %d warning(s).\n' "${warn_count}"
