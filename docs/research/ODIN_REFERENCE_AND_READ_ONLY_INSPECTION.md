# GEN-ADL-001 — Odin Reference and Read-Only Firmware Asset Inspection

**Status:** EXPERIMENTAL research tooling. Not firmware authenticity verification, carrier compliance certification, or device execution.

## Scope and architecture

The Odin3 interface is a *research reference* for device connection indicators, BL/AP/CP/CSC/USERDATA file selection, activity logging, and explicit operation initiation. Odin is not integrated as a trusted firmware executor. This milestone provides only offline SHA-256 hashing and file-size inspection. It performs **no** USB communication, firmware unpacking, flashing, rooting, bootloader changes, device access, or network requests.

Accepted [ADR-006](../adr/ADR-006-android-and-firmware-safety.md) remains authoritative: physical device operations require explicit authorization, identification, compatibility and recovery evidence, policy, audit, and independent verification. The RootMaster operator safety gate remains disabled.

## Usage

```bash
python3 scripts/firmware_inspect.py /path/to/authorized/local/file.bin
python3 -m unittest discover -s tests/firmware -p 'test_*.py' -v
```

On Windows, use `py -3` in place of `python3` when necessary. This is a command-line utility, not a graphical firmware control panel. JSON is emitted to standard output; you may redirect it to a file for evidence. Entries contain observed byte size, SHA-256, `NOT_VERIFIED` authenticity, and `NOT_ASSESSED` device compatibility. Failed paths are reported as `ERROR` with nonzero exit status. Symbolic links and non-regular files are rejected. A change to file size or timestamps during reading is rejected.

## Limitations and security

- SHA-256 alone does not prove an official vendor origin, signature verification, valid firmware reference, secure boot state, device compatibility, RF performance, or CTIA certification.
- File mutations invisible to operating-system size/time metadata checks cannot be detected; inspect an immutable authorized evidence copy for higher assurance.
- Large files are streamed in 1 MiB chunks. The tool does not parse potentially malicious archives.
- Local paths and digests in the JSON report may be sensitive; reports are not uploaded and should be protected by the operator.
- No independent Policy, Audit, or Evidence Authority integration exists. Do not represent this CLI as production-governed device functionality.
- Legacy `scripts/validate-firmware-metadata.sh` and `acing-iu/scripts/validate_firmware_ctia.py` contain synthetic manifest values and self-described compliance checks. These reports **must not** be accepted as device verification or certification evidence. A separate claims/remediation review is required.

## Review and future gates

This change is reviewable after Python tests and relevant repository checks have executed. Promotion to any production device-lab capability requires trusted vendor/reference metadata, secure file provenance, authorized device binding, policy and audit integration, negative-case testing, threat review, and explicit project-owner approval. **No firmware executor is implemented or approved.**
