# AIU-DEVICE-001 — Samsung Galaxy Tab Pro 8.4 SM-T320 recovery-first target

**Status:** PLANNED / NOT FLASHED / NO BOOTABLE GENESIS IMAGE  
**Inspection date:** 2026-11-24  
**Owner-reported state:** Device displays Samsung Download Mode/Odin Mode; no exact on-screen product-name or firmware identifiers supplied yet.  
**Scope:** Authorized, non-invasive research, safety, architecture, and a reproducible evidence checklist. No firmware is written by this document.

## Verified hardware references

- Exact candidate device family: Samsung Galaxy Tab Pro 8.4 Wi-Fi, **SM-T320**, LineageOS codename `mondrianwifi`.
- Chipset: Qualcomm Snapdragon 800; platform architecture **arm** (32-bit); 2 GB RAM; 16/32 GB storage configurations.
- Vendor specification: https://www.samsungmobilepress.com/media-assets/galaxy-tabpro-8-4?tab=specs
- Previously documented by LineageOS: https://lineageos.github.io/lineage_wiki/devices/mondrianwifi/ — **no longer officially maintained**; older device sources exist.
- Prior device tree: https://github.com/LineageOS/android_device_samsung_mondrianwifi — historical CyanogenMod/LineageOS sources, **not** a proven modern Android build.
- Official TWRP device page: https://twrp.me/samsung/samsunggalaxytabpro8.4wifi.html — `mondrianwifi` recovery support; **Odin uses a device-specific recovery TAR**, whereas many recovery-based ROM packages are ZIP. Do not relabel a generic ZIP as Odin firmware.
- Samsung official recovery guidance: https://update.kies.samsung.com/SmartSwitchPC_recovery_guide/firmware/emergencyrecovery/ ; eligibility for this retired model must be checked without assuming support.
- Samsung's Download Mode warning: https://www.samsung.com/us/support/troubleshooting/TSG01212623/ — incorrect/unsupported software can cause device damage and introduce security exposure.

**Model caveat:** `SM-T320`, `SM-T320NU`, `SM-T321`, `SM-T325`, and some region variants must not be treated as interchangeable without verified device-specific mapping. Source branch names, ROM titles and package names alone are insufficient.

## P0 recovery gate — no writes

Record the following from the **actual device**, not from a website or inference:

| Evidence | Status / required observation |
|---|---|
| Download Mode PRODUCT NAME/model string | NOT PROVIDED — confirm exact match to compatible artifact |
| Current binary/system status, if displayed | NOT PROVIDED |
| Knox/warranty/revision indicators, if displayed | NOT PROVIDED; never infer a secure boot guarantee |
| Current recovery behavior (stock, TWRP, unavailable) | NOT PROVIDED |
| Existing personal data and need for preservation | NOT PROVIDED — stop if data matters and no viable backup |
| Battery condition and USB-port/cable stability | NOT VERIFIED |
| Host USB recognition in Odin (read-only) | NOT VERIFIED |
| Exact firmware package name, region/CSC, revision, digest, provenance | NOT CHOSEN |
| Known recovery path back to signed/correct model stock build | NOT VERIFIED |
| Device-owner authorization | User reports own tablet; no third-party research permission implied |

**Stop conditions:** mismatched Download Mode identifiers; ambiguous variant; missing or damaged source archives; unsigned/untrusted stock source; compromised battery/USB; missing data preservation decision; uncertain compatibility; inability to recover if the experiment fails. Do not use PIT repartition, NAND erase, forced downgrade, bootloader replacement, unofficial `unlock` tricks, or partition editing as exploratory steps.

## P1 known-good Android recovery baseline

1. Identify the exact device revision and compatible stock image using authoritative Samsung records where available. Third-party mirrors may list firmware but do **not** establish origin, integrity, regional appropriateness or safety.
2. Prefer Samsung's supported recovery pathway if the actual device is eligible. Reinstalling a stock OS may erase local data and does not guarantee modern security support.
3. Confirm that recovery is repeatable **before** testing custom firmware. Document boot, display, touch, charging, Wi-Fi, microSD, and backup/restore capabilities without collecting personal identifiers.
4. No firmware flashing occurs through this PR; keep the physical operation supervised and manual after the artifact and recovery plan are approved.

## P2 Genesis Android technical feasibility

The existing Genesis GitHub project is a **human-authority platform with service backends and user-facing components**, not a bootable `mondrianwifi` firmware distribution. Do not package `backend/`, frontend source, Guardian prototypes or a website into an Odin TAR and claim it is an Android ROM.

Preferred phased architecture:

- **Tablet:** lightweight Android app/shell, local nonprivileged UX and optional offline read-only status; compatible 32-bit Android API/ABI support must be built and tested for the chosen base OS.
- **Separate trusted host:** authenticated Gateway, Identity, HumanAuthority authorization/evidence and policy evaluation under independently enforced permissions.
- **Connection:** TLS, explicit user device enrollment, revocable scoped grants and privacy-respecting telemetry.
- **No claim** of verified hardware attestation, Knox enforcement, root functionality, production device trust or security certification.
- **Potential future OEM/ROM integration:** fork or build against a legal, reproducible, device-compatible Android tree and maintain proper open-source licenses and source provenance; hardware-specific proprietary blobs and old Linux kernel support create significant maintenance and security risks.
- **No root requirement:** Genesis app functionality should not require privileged partition writes.

## P3 packaging and validation boundaries

| Artifact type | Intended consumer | Requirement |
|---|---|---|
| Stock firmware archive (model-specific) | Samsung compatible service/Download Mode tooling | Verified model, revision, signature, region and restore plan |
| Recovery `.tar` (model-specific) | Odin recovery partition operation | Verified `mondrianwifi` recovery release from maintainer |
| Recovery-installable custom ROM `.zip` | Compatible Android recovery | Full boot/system/vendor compatibility plus manifest and trusted provenance |
| Genesis Android `.apk` | Running Android OS | ABI/API compatibility; signature; no claim that APK is firmware |
| Proposed Genesis OS firmware | Device-specific boot and system stack | **UNSUPPORTED / BLOCKED** until boot images, kernel, partition layout, recovery and verified negative/smoke tests exist |

## Device bring-up acceptance tests (future; NOT EXECUTED)

- Device model/partition/boot revision match is proven.
- Recoverable stock baseline and backup evidence documented.
- Kernel boots to a functioning UI on **exact device**.
- Touch, display, charging, USB, Wi-Fi, storage and suspend/resume verified individually.
- Android package/install signature and package permissions checked.
- Genesis UI starts with **SIMULATED/PLANNED** claims accurately labeled.
- HumanAuthority grant is checked independently: default deny, scope-match, expiry, revocation, stale/replay rejection and auditable decisions.
- Offline behavior safe; service unavailability cannot grant privilege.
- Artifact SBOM, license notices, source commit, test logs, rollback path and owner's explicit release approval recorded.

## Gate status

| Gate | Current result |
|---|---|
| Model-specific public reference discovery | PASS (research only) |
| Exact connected hardware identity | BLOCKED (device-side observation needed) |
| Data backup and stock recovery | NOT EXECUTED |
| Compatible Android base and build | PLANNED |
| Genesis APK port | PLANNED |
| Actual custom OS image | UNSUPPORTED |
| Odin image safety verification | NOT EXECUTED |
| Physical flash and boot validation | NOT EXECUTED |
| Governance and human approval | BLOCKED |

## Next bounded action

Request a **transcription or photograph of the Download Mode information** with only technical fields visible and any serial number/personal identifier redacted. Also establish whether user files must be preserved. Use that evidence to choose the appropriate authorized restoration route **before** generating any flash package.

Keep this document as a non-operational research/acceptance artifact during the repository stabilization freeze. No activation, protected merge, firmware write, or deployment is authorized.
