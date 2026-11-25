# AIU-DEVICE-001 — Samsung Galaxy Tab Pro 8.4 SM-T320 recovery-first target

**Status:** PLANNED / NOT FLASHED / NO BOOTABLE GENESIS IMAGE  
**Inspection date:** 2026-11-24  
**Photo-observed state:** Device shows Download Mode with PRODUCT NAME `SM-T320`, CURRENT BINARY `Custom`, SYSTEM STATUS `Custom`, KNOX KERNEL LOCK `0x0`, KNOX WARRANTY VOID `0x1`, QUALCOMM SECUREBOOT `ENABLE (CSB)`, RP SWREV `S1, T1, R1, A1, P1`, WRITE PROTECTION `Enable`, and `UDC START`. Observation is not an authentication of current firmware or proof of flash compatibility.  
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
| Download Mode PRODUCT NAME/model string | **PHOTO VERIFIED: `SM-T320`**. Exact firmware package, regional variant and revision still need independent verification |
| Current binary/system status, if displayed | **PHOTO VERIFIED: `CURRENT BINARY: Custom`; `SYSTEM STATUS: Custom`**; does not identify installed OS or recovery version |
| Knox/warranty/revision indicators, if displayed | **PHOTO VERIFIED:** `KNOX KERNEL LOCK: 0x0`; `KNOX WARRANTY VOID: 0x1`; `QUALCOMM SECUREBOOT: ENABLE (CSB)`; `RP SWREV: S1, T1, R1, A1, P1`; `WRITE PROTECTION: Enable`. Do not interpret any one flag as a guaranteed boot, verified security posture, or ability to downgrade |
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
| Exact connected hardware identity | **PARTIALLY VERIFIED**: Download Mode identifies `SM-T320`; region, stock build, partitions and hardware health not verified |
| Data backup and stock recovery | NOT EXECUTED |
| Compatible Android base and build | PLANNED |
| Genesis APK port | PLANNED |
| Actual custom OS image | UNSUPPORTED |
| Odin image safety verification | NOT EXECUTED |
| Physical flash and boot validation | NOT EXECUTED |
| Governance and human approval | BLOCKED |

## Next bounded action

Photo evidence of Download Mode has been received and transcribed above. **Next: establish whether existing user data must be preserved**, and whether recovery mode is accessible without any writing. Record the firmware/region only from trusted sources before selecting an artifact. No package is approved for flashing.

Keep this document as a non-operational research/acceptance artifact during the repository stabilization freeze. No activation, protected merge, firmware write, or deployment is authorized.

## 2026-11-24 physical evidence addendum

A user-supplied photograph of the **actual Download Mode screen** was visually inspected. The photograph is not copied into this public repository; only non-unique technical status fields are recorded. No serial number or other device identifier is included. Observations:

| Field | Photo transcription |
|---|---|
| PRODUCT NAME | `SM-T320` |
| CURRENT BINARY | `Custom` |
| SYSTEM STATUS | `Custom` |
| KNOX KERNEL LOCK | `0x0` |
| KNOX WARRANTY VOID | `0x1` |
| QUALCOMM SECUREBOOT | `ENABLE (CSB)` |
| RP SWREV | `S1, T1, R1, A1, P1` |
| WRITE PROTECTION | `Enable` |
| Last red status | `UDC START` |

**Interpretation limits:** The custom status suggests the installed firmware has been modified at some point but does not prove that root is currently operational. The warranty-void flag is shown as `0x1`, commonly associated with a tripped Knox warranty indicator, and must not be represented as reversible by stock firmware. The displayed Download Mode status proves the mode is present, not that recovery, Odin transfers, USB, storage health, partition images, or boot functions have been verified.

**User-data status: NOT DETERMINED.** No write, erase, PIT, firmware selection or flash operation has been performed. Preserve original user data until its importance is determined.

## 2026-11-24 stock recovery baseline research and erasure authorization

**Owner decision:** Existing user data may be erased if necessary; this removes the *data preservation* decision blocker, but is **not** approval to perform a specific flashing operation. Existing modem/board/CSC state, image provenance, and recovery mode accessibility remain unverified.

### Firmware family identification

- Stock Samsung SM-T320 Android **4.4.2 KitKat** is the historical recovery-baseline family; treat this as a restoration target, **not a secure up-to-date daily-driver OS**.
- Historical third-party Samsung firmware indexes list **SM-T320 XAR** (US) `T320UES1AQA2` and `T320UEU1AOC1`, and **SM-T320 XEO** (Poland) `T320XXU1BQB2`. Sources:
  - https://firmwareindex.com/samsung/sm-t320/
  - https://samfrew.com/devices/galaxy-tab-pro-8-4/sm-t320
  - https://samfw.com/firmware/SM-T320/
- **Candidate only. No archive downloaded, cryptographic digest verified, official signature/provenance confirmed, regional CSC confirmed or flash authorized.** Do not assume user's residence determines device's original CSC. No listed build is designated the correct image yet.
- Samsung support page explicitly identifies model SM-T320: https://www.samsung.com/uk/support/model/SM-T320NZKABGL/
- Official Samsung emergency recovery reference: https://update.kies.samsung.com/SmartSwitchPC_recovery_guide/firmware/emergencyrecovery/ (device support on this old model unverified).

### Recovery alternative

- TWRP's **official** page identifies `mondrianwifi`, support status `Current`, and a model-specific Odin-installable recovery `.tar` option: https://twrp.me/samsung/samsunggalaxytabpro8.4wifi.html.
- This is a *recovery image*, not a complete ROM. Its existence does not prove this tablet's partition/USB/flash health.
- No TWRP or stock image has been selected or written.

### Required preflash checks — not yet passed

1. Determine whether device can boot existing recovery without a write, and distinguish stock recovery / custom TWRP / absent or stuck.
2. Confirm model `SM-T320` once more on the exact device and establish the original firmware CSC/revision from reliable device or official support evidence; no region guessing.
3. Confirm battery/USB reliability and host USB detection without changing the device.
4. Acquire a device-specific trusted firmware archive via an approved source and compare origin, intended region, build identifier, size, format and published SHA-256 when available; source alone must not be equated with verification.
5. Document recovery/rollback and a supervised human go/no-go review. Never enable exploratory PIT/repartition, NAND erase, forced downgrade or bootloader rewrites.
6. Only after a clean stock baseline boots and essential hardware passes tests, develop a lightweight Genesis Android application separately from any firmware experiment.

**Decision:** **NO-GO FOR FLASH**. Next safe observation is a *non-destructive recovery-mode availability check*; no Odin image approval or flashing instructions have been issued.

## 2026-11-24 recovery-mode diagnostic result

**Reported user observation:** The SM-T320 shows a Samsung logo followed by a black screen or boot loop when attempting recovery; no stock recovery or TWRP menu has been observed.

**What is and is not established:**
- **VERIFIED BY OWNER REPORT:** Recovery-mode attempt did not produce a working recovery menu.
- **PREVIOUS PHOTO VERIFIED:** Download Mode identifies the device as SM-T320, with custom binary/system states and Knox warranty flag 0x1.
- **UNVERIFIED:** Whether the button combination registered correctly, the battery and power state, OS boot/system partition integrity, recovery partition contents, storage health, USB connection, firmware CSC/revision or any presently viable recovery installation.
- **NOT A DIAGNOSIS:** A logo/black screen does not conclusively indicate a damaged recovery partition; an incompatible installation, power issue or other faults are also possible.
- **ERASURE AUTHORIZATION:** Owner has said data can be erased if necessary, but no specific flash has been approved.

### Safe non-writing verification gate

1. Treat device recovery as unavailable until actual screen observation contradicts this status. Do not attempt an install, wipe, PIT repartition, downgrade or bootloader write on an unverified image.
2. Confirm steady charging using a suitable wall charger and inspect external cable/USB-port condition; stop if device becomes unusually hot, swollen, or physically damaged.
3. Record exactly which state occurs during a **single non-destructive normal restart** (logo steady, cyclic logo, black display, or Android boot). Avoid repeated forced attempts.
4. Have a knowledgeable repair technician assess power, USB enumeration, recovery accessibility, and compatibility if the boot/recovery state remains uncertain.
5. Before any future firmware write, obtain a provenance-checked, exact-model build and documented fallback/recovery pathway; require separate owner approval of the specific artifact and action.

**Current decision:** **NO-GO FOR FLASH**; no working recovery menu has been verified, no Odin archive selected, and no Genesis OS image exists. Resume firmware selection only when device diagnostics and artifact provenance are sufficient.

## 2026-11-25 local artifact inspection — read-only

**Host:** Windows `DESKTOP-7PJDIRC`; owner reports downloaded files and Samloader clone.

- **Found:** `D:\\twrp-3.7.0_9-0-mondrianwifi.img.tar`, 12,451,840 bytes.
- **Archive inventory:** exactly `recovery.img` (listed without extraction).
- **Calculated local SHA-256:** `9dfd5e342e9716a3d3765fc7380d42824fea6c8ea0b77c9d5906b4b837a85426`.
- **Independent comparison:** Team Win's published SHA-256 from `https://dl.twrp.me/mondrianwifi/twrp-3.7.0_9-0-mondrianwifi.img.tar.sha256` matched exactly on the Windows host.
- **Classification:** **VERIFIED IMPLEMENTED only for file integrity versus published SHA-256**. This is a TWRP recovery archive and **not stock Android firmware, a full ROM, or a Genesis image**. PGP signer verification, actual flash compatibility, tablet recovery function and boot are **NOT EXECUTED**.
- **Also found:** existing `D:\\Odin3_v3.13.1`, `D:\\Odin3_v3.14.4`, and `D:\\Samsung\\SmartSwitch` folders. No execution or modification of these tools.
- **Not found in inspected paths:** exact-model SM-T320 stock firmware archive; initial search covered user Downloads/Desktop/Documents top-level, D:\\ root and selected Samsung/Odin/recovery directories. This is **not an exhaustive search of every drive**.
- **Samloader:** clone location **NOT FOUND** in inspected shallow folder paths; do not assert that the clone is missing or installed incorrectly. Do not invoke unfamiliar source without inspecting its actual checkout.
- **Unrelated firmware:** D:\\ contains an SM-S938U-named folder; **incompatible with SM-T320, never use as a substitute**.
- **No Odin use, flashing, extraction, local file modification, or partition writes occurred.**

**Next gated decision:** Determine the location and current status of the Samloader source and any stock Android archive; verify firmware model/region/revision/provenance and a recovery plan before requesting owner approval for a specific device operation. The verified recovery checksum does not establish a working operating system. The current flash decision remains **NO-GO**.

## 2026-11-25 stock firmware archive inspection (read only)

Owner-reported firmware download was located directly on connected Windows host `DESKTOP-7PJDIRC`, and its container verified without flashing, extracting, or modifying the firmware file.

- Path: `D:\\SAMFW.COM_SM-T320_XAR_T320UES1AQA2_fac.zip`
- ZIP byte size: `1462354752`
- Calculated SHA-256: `d78b91266895777e09fde28c6216fc3b7683860fa5d140916a8d79655725bf73`
- ZIP archive structure (four members):
  - `AP_T320UES1AQA2_CL4441590_QB12357844_REV00_user_low_ship_MULTI_CERT.tar.md5` — 2,091,151,466 uncompressed bytes
  - `BL_T320UES1AQA2_CL4441590_QB12357844_REV00_user_low_ship_MULTI_CERT.tar.md5` — 10,025,066 uncompressed bytes
  - `CSC_XAR_T320XAR1AQA2_CL4441590_QB12357844_REV00_user_low_ship_MULTI_CERT.tar.md5` — 179,445,871 uncompressed bytes
  - `_FirmwareInfo_Samfw.com.txt` — 719 uncompressed bytes
- ZIP CRC32 validated with full streaming reads of **all four members**, with no errors (PASS). Model/build identifiers in AP, BL and CSC filenames are consistent with `SM-T320`, `T320UES1AQA2`, `XAR`.
- Included SamFW text *claims* firmware was sourced from Samsung Cloud Server and warns of user risk. This is a distributor's statement and **not cryptographic proof** of Samsung origin.
- **NOT VERIFIED:** published SHA-256 from an independent authoritative publisher; Samsung firmware signature/chain; bootloader revision and actual downgrade compatibility; device's original CSC; authenticity of the internal TAR.MD5 members; tablet battery/power stability or recovery success.
- **NO-GO remains:** Do not flash BL/AP/CSC or TWRP on the basis of filename and CRC checks alone. A flash is a separate protected operation requiring device-specific readiness review and explicit approval.
- **Samloader checkupdate** with model `SM-T320` and region `XAR` returned `Model or region not found (403)`. Samloader installed and CLI works, but server metadata lookup is unavailable for this pair as tested.

**Next gate:** Validate power stability and firmware authenticity independently, check device-specific signed bootloader downgrade constraints, establish a feasible fallback, and require separate owner confirmation for the precise flash action.

## 2026-11-25 follow-up power report and Odin package digest inspection

**User report:** Device has remained continuously in Download Mode for an extended period while Odin detects it. This is positive evidence of apparent stability in Download Mode only; battery health, charge state, flash-time voltage margin, and eventual boot are NOT VERIFIED.

**Windows read-only verification (host DESKTOP-7PJDIRC):**
- Firmware ZIP: `D:\\SAMFW.COM_SM-T320_XAR_T320UES1AQA2_fac.zip`
- `D:` free space: 760,340,197,376 bytes at the inspection time, sufficient for extraction of the three archives (combined approx. 2.28GB uncompressed).
- The three Odin `.tar.md5` members have Samsung-style MD5 checksum lines; streaming MD5 calculations over TAR payload bytes (excluding trailing checksum line) matched each embedded checksum exactly:
  - AP: `fbea59fa99eb8d8b116d0a3e6226cad1` — PASS
  - BL: `8cd1c7d179208ac8bda52cc8dbb698b1` — PASS
  - CSC: `16ce7c1dcebb3103f9c0723180c79dbe` — PASS
- Earlier ZIP member CRC32 checks (4/4) and package SHA-256 are documented above. These checks indicate file consistency and do **not** verify authenticity or device compatibility.
- Actual device partition/write health, charging margin, firmware's original CSC, signature chain and anti-rollback compatibility remain UNKNOWN.

**Flash gate:** NO-GO pending authentic package provenance, model/build verification against on-device data, and separate explicit owner approval for precise firmware operation. No extraction, Odin Start, device write or firmware flash has occurred.

## 2026-11-25 controlled local extraction and TAR member inventory

**Execution scope:** Owner approved continuation of offline package review. Device write/flash was NOT authorized or performed. Inspection used read-only archive access and extracted copies to an isolated Windows folder, not Genesis source directories.

- Source ZIP unchanged: `D:\\SAMFW.COM_SM-T320_XAR_T320UES1AQA2_fac.zip`
- Extraction destination: `D:\\SM-T320-Recovery-Verification\\T320UES1AQA2`
- Four expected ZIP members extracted and byte lengths checked; **PASS**, with no overwrite of pre-existing files.
- AP TAR members: `boot.img` (10,125,584 B), `recovery.img` (11,690,256 B), `system.img.ext4` (2,048,758,964 B), `modem.bin` (20,563,712 B).
- BL TAR members: `aboot.mbn` (1,379,248 B), `sbl1.mbn` (279,332 B), `rpm.mbn` (164,460 B), `tz.mbn` (312,580 B), `sdi.mbn` (32,356 B), `NON-HLOS.bin` (7,849,728 B).
- CSC TAR members: `MONDRIANWIFI_USA_OPEN.pit` (4,244 B), `cache.img.ext4` (172,163,328 B), `hidden.img.ext4` (7,266,488 B).
- All inspected TAR members reported regular files; TARs were **inspected only**, their internal partition images were **not extracted or written** to any physical device.
- Findings: `MONDRIANWIFI_USA_OPEN.pit` is consistent in filename with target codename but **MUST NOT be used for repartitioning without independent verified need and physical device partition evidence**. BL includes low-level bootloader components; current bootloader/revision and rollback compatibility remain UNKNOWN.
- **No human release/flash authorization, Odin Start, PIT repartition, or tablet firmware write** occurred.

**Gate decision: NO-GO for actual flash**, pending exact board/region/rollback compatibility evidence, trusted original firmware provenance, and controlled recovery plan. Extracted artifacts are research-only.

## 2026-11-25 offline boot, recovery, PIT header, and publisher checksum assessment

A further **read-only** Windows host inspection was run against the previously extracted `.tar.md5` archives in `D:\\SM-T320-Recovery-Verification\\T320UES1AQA2`:

- `boot.img`: Android boot-image header magic `ANDROID!` confirmed; kernel size 7,854,664 bytes; ramdisk 1,387,494 bytes; page size 2048 bytes.
- `recovery.img`: Android boot-image header magic `ANDROID!` confirmed; kernel size 7,854,664 bytes; ramdisk 2,951,874 bytes; page size 2048 bytes.
- `MONDRIANWIFI_USA_OPEN.pit`: first four bytes `76 98 34 12` match expected little-endian Samsung PIT file magic `0x12349876`. **This does not validate any partition layout against the physical tablet.**
- Third-party SamFW catalog listing at `https://samfw.com/firmware/SM-T320/XAR/T320UES1AQA2` identifies SM-T320, `XAR`, `T320UES1AQA2`, Android 4.4.2, binary/revision `1`, and a published download MD5 `4b2f9ae8532def87b6c04ba1e308f569`.
- **Computed local full ZIP MD5:** `4b2f9ae8532def87b6c04ba1e308f569` — **PASS MATCH** against the distributor's published MD5. This confirms the local ZIP matches the publisher's indexed digest; a third-party MD5 value is **not a Samsung signature, and MD5 is not a collision-resistant authenticity mechanism**.
- The owner's previous Download Mode photograph displayed `RP SWREV: S1, T1, R1, A1, P1`. The distributor lists a `BIT 1` firmware. This is **a consistency signal only**; actual per-component anti-rollback enforcement and original CSC cannot be conclusively determined offline.
- Samsung's public emergency recovery reference remains `https://update.kies.samsung.com/SmartSwitchPC_recovery_guide/firmware/emergencyrecovery/`. Eligibility for this retired tablet remains UNVERIFIED.
- The distributed stock system is Android **4.4.2**, unsuitable as a secure internet-connected system for sensitive personal use today.

**Decision:** The research-only image is structurally consistent with the target model and matches the distributor's checksum. **NO-GO** remains for actual flashing because Samsung-origin signature validation, exact physical partition/bootloader compatibility, charging health and fallback recovery are NOT VERIFIED. No flashing, PIT operation, Odin start, or physical device write occurred.
