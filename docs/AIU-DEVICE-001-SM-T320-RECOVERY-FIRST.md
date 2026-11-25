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
