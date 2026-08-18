# Issue #63 Security Claims Gate

The capability register at `docs/security/ISSUE_63_CAPABILITY_EVIDENCE_REGISTER.json` is authoritative for claim maturity. Only traceable repository or hosted validation evidence may be classified as Verified; this change intentionally uses conservative Planned, Simulator, Implemented but unverified, and Prohibited or removed states.

The RootMaster route is now a non-operational boundary page. It does not expose firmware flashing, bootloader unlocking, rooting, bypass, register modification, warranty or fuse inspection, recovery, carrier modification, or device-attestation controls. Educational or emulator references are not presented as production hardware support.

Run `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-security-claims.ps1`. The test validates register structure and status vocabulary, scans active application surfaces for prohibited unqualified claims, reports actionable file-and-line errors, and asserts that the RootMaster page has no executable unsupported-operation control.

Issue #63 remains open until the project owner reviews the complete claim inventory and capability-to-evidence mapping. This change does not close the issue automatically.
