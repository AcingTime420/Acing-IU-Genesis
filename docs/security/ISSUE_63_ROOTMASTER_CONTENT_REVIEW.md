# Issue #63 RootMaster Content Review

This review compares the original RootMaster page at `f25484bace3c46ed0f671f6a290e51d8e839533f` with the non-operational page on this branch. The original page was approximately 5,320 lines; the replacement is intentionally non-operational and does not restore device-affecting controls.

| Removed content | Classification | Safety decision | Recommendation |
|---|---|---|---|
| Firmware dissection, flashing-oriented workflows, bootable ISO build statuses, partition payload generation, and recovery/build commands | Unsafe operation | Keep removed | Do not restore; any future design requires a separately approved sandbox and device-safety gate. |
| Knox, attestation, hardware-backed, certification, warranty/fuse, bootloader, root, bypass, and production-security assertions | Unsupported claim | Keep removed or qualify in the register | Preserve only explicitly unavailable, simulated, planned, or unverified wording linked to a capability ID. |
| Galaxy/device results, build identifiers, “ready to flash” statuses, and security-result samples presented as operational output | Fabricated fixture | Keep removed | Reintroduce only as visibly labeled test fixtures with fixture IDs and no production implication. |
| Build history, side-by-side build comparer, charts, partition-size visualizations, and read-only logs | Safe read-only analytics | Removed beyond the minimum Issue #63 boundary | Consider a later separately reviewed read-only analytics route with simulated-data labels and no operation handlers. |
| Explanatory RootMasterOS architecture and educational descriptions | Safe educational material | Removed beyond the minimum Issue #63 boundary | Preserve only in documentation or a read-only page that labels emulator/planned status and links to evidence. |
| Navigation, headings, downloads, notifications, and presentation layout | Navigation/presentation | Removed as part of route replacement | A minimal navigation shell may be restored if it cannot invoke or imply unsupported device operations. |

## Decision

The current one-page boundary is safe but broader than necessary. No unsafe operation should be restored in this PR. Product and security owners must decide whether safe analytics and educational content are worth a subsequent, separately reviewed change.

## Acceptance evidence

- Current RootMaster page contains no operation handlers or device command calls.
- `scripts/test-security-claims.ps1` asserts the route is unavailable and non-operational.
- The expanded capability register records unsupported, simulator, planned, external-dependency, and fixture states conservatively.
