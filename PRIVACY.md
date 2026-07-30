# Privacy Policy — Acing IU: Genesis

> **Feature-status legend**
> ✅ Implemented · 🧪 Experimental · 📋 Planned

---

## Overview

Acing IU: Genesis is an open-source Android OS security platform.  
This document describes our privacy commitments for contributors, users, and device operators.

---

## What data is collected

### By this repository

| Data | Purpose | Retention |
|---|---|---|
| GitHub account metadata (contributors) | Repository access, commit attribution | GitHub-controlled |
| Issue and PR content | Bug tracking and feature discussion | Public; GitHub-controlled |
| CI run logs | Build and test validation | 7 days (GitHub Actions default) |

### By the platform itself

The Acing Guardian platform **does not currently collect, transmit, or store personal data** to any remote service.

When running on a device, the following data is processed **locally only**:

| Data | Purpose | Status |
|---|---|---|
| Boot image hash | Integrity verification | 🧪 Experimental |
| Biometric authentication result (pass/fail) | Admin access gate | 🧪 Experimental |
| Admin session key | Secure workspace | 🧪 Experimental |
| Security event logs | Local audit trail | 📋 Planned |

---

## What data is NOT collected

- No telemetry is sent to Acing or any third party.
- No biometric raw data leaves the device hardware enclave.
- No user credentials or PII are stored in this repository or transmitted over the network.

---

## Third-party dependencies

| Dependency | Privacy implication |
|---|---|
| GitHub (repository host) | GitHub privacy policy applies to repository interactions |
| GitHub Actions (CI runner) | Build logs retained per GitHub's data retention policy |
| JetBrains Kotlin compiler | Build-time toolchain; no runtime data collection |

---

## Data subject rights 📋 Planned

When the platform processes personal data (Phase 5+):

- Users will have the right to access, correct, and delete their data.
- A Data Protection Officer (DPO) contact will be published.
- A GDPR-compliant privacy notice will be provided in the product.

---

## Changes to this policy

This policy will be updated whenever the platform adds new data processing capabilities.  
Material changes will be announced via GitHub releases and the project's communication channels.

---

## Contact

For privacy-related questions: privacy@acing-iu.example  
*(Placeholder — replace with a real address before product launch.)*

---

## See also

- `DATA_CLASSIFICATION.md` — how we classify data sensitivity
- `SECURITY.md` — how to report security vulnerabilities
