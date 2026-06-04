# V-Node Manifest Schema

AetherOS now records V-Node capability state by hashing deterministic manifest bytes instead of hashing an empty placeholder. The schema is intentionally small, versioned, and shared from `aetheros_common::vnode_manifest` so kernel and V-Node tooling can converge on one encoding.

## Schema version

- Magic/domain separator: `AOS_VNODE_MAN_V1`
- Version: `1`
- Endianness: little-endian for every multi-byte integer
- Variable-length bytes: `u32` byte length followed by raw bytes
- Hashes: 32 raw bytes

## Canonical fields

The manifest hash input is encoded in this order:

1. Magic and schema version.
2. V-Node identity:
   - `u64` V-Node id
   - V-Node name bytes
   - 32-byte immutable image hash
   - `u64` ELF entry point
3. Permission bitset:
   - bit 0: syscall permission
   - bit 1: IPC permission
   - bit 2: I/O permission
4. Filesystem capability:
   - 32-byte root hash
   - rights tag (`0 = read-only`, `1 = read-write`)
5. Capability section:
   - `u32` capability count
   - one record per granted capability, in granted order
   - each record is a stable `u16` capability tag followed by a `u64` parameter (`0` when unused)

## Stable capability tags

| Tag | Capability | Parameter |
| --- | --- | --- |
| 1 | `LogWrite` | `0` |
| 2 | `TimeRead` | `0` |
| 3 | `NetworkAccess` | `0` |
| 4 | `StorageAccess` | `0` |
| 5 | `IrqRegister` | IRQ number |
| 6 | `DmaAlloc` | `0` |
| 7 | `DmaAccess` | `0` |
| 8 | `IrqAck` | IRQ number |
| 9 | `IpcManage` | `0` |
| 10 | `ReadMetrics` | `0` |
| 11 | `WriteLogs` | `0` |
| 12 | `RestartVNode` | `0` |
| 13 | `SyncSnapshots` | `0` |
| 14 | `ReadOwnMetrics` | `0` |

## Current enforcement boundary

This schema fixes the previously unstable capability-hash input: snapshots now hash the real V-Node descriptor and granted capability set. Full immutable bundle enforcement is still intentionally limited: this PR does not reject existing V-Nodes, enforce signatures, or require all `vnode.yml` files to be content-addressed. Those stricter admission checks need manual review because they can break existing V-Node bundles.
