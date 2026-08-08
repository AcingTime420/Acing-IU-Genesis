# CTIA OTA Performance Compliance & S938U Firmware Integrity

This document defines the key requirements from the **CTIA Test Plan for Wireless Device Over-the-Air (OTA) Performance (Version 3.8.2)** applicable to maintaining firmware integrity and radio communication standards on the **Samsung Galaxy S25 Ultra (SM-S938U)** Verizon baseline.

---

## 1. SM-S938U Frequency Bands & Carrier Specifications

As a premium Verizon 5G Ultra Wideband (UWB) terminal, the SM-S938U must maintain certified performance across the following spectrum baselines:

### 1.1 Verizon LTE Bands
*   **Primary Bands**: B13 (700 MHz), B66 (1700/2100 MHz AWS).
*   **Secondary/Roaming Bands**: B2, B4, B5, B48, B5.

### 1.2 Verizon 5G NR (New Radio) Bands
*   **Sub-6 GHz**: n2, n5, n66, n77 (C-band).
*   **mmWave (High-Band)**: n260 (39 GHz), n261 (28 GHz).

---

## 2. Firmware Integrity & Radio Calibration Validation

To protect against baseband modification, partition corruptions, or radio spoofing, Acing IU requires that the SM-S938U baseband/radio subsystem is continuously validated:

1.  **Modem Partition (CP) Verification**: The baseband modem firmware image (e.g. `S938UVRU1AXB7`) must be verified by matching its SHA-256 hash against Verizon's certified release.
2.  **Calibrated Parameter Verification**: The device must report active calibration metrics matching factory defaults. Handheld and wrist-worn test offsets must align with CTIA specifications.
3.  **Forbidden Firmware Flag**: Any detection of non-Verizon, uncertified CSC, or bootloader modifications blocks wireless network registration.

---

## 3. Normative Measurement Parameters (CTIA 3.8.2)

For OTA verification in standardized RF chambers, the following parameters are strictly enforced:

### 3.1 Total Radiated Power (TRP)
TRP represents the average spherical effective isotropic radiated power of the SM-S938U's transmitter:
*   **Measurement Grid**: Sampled every $15^\circ$ along the theta ($\theta$) and phi ($\phi$) axes under simultaneous $E_\theta$ and $E_\phi$ polarizations, yielding 264 discrete measurements per polarization.
*   **S938U Target (Verizon LTE B13 Baseline)**: TRP must meet or exceed **$23.0 \text{ dBm}$** in Free Space (FS) mode to be flagged as compliant.

### 3.2 Total Isotropic Sensitivity (TIS)
TIS measures the average spherical receiver sensitivity:
*   **Measurement Grid**: Sampled every $30^\circ$ along the theta ($\theta$) and phi ($\phi$) axes under orthogonal polarizations, using Bit Error Rate (BER) or Frame Error Rate (FER) to evaluate receiver performance.
*   **S938U Target (Verizon LTE B13 Baseline)**: TIS must be **$\le -90.0 \text{ dBm}$** in Free Space to satisfy access criteria.

### 3.3 Combined TIS (C-TIS)
With multiple antennas active (MIMO setup on SM-S938U), Combined TIS is measured to ensure carrier-aggregation (CA) and antenna switching do not degrade reception below the normative Verizon threshold.

---

## 4. Test Positioning & Phantoms

To simulate human interaction with the S25 Ultra or companion wearables, the following normative phantom environments must be used:

| Configuration | Phantom Model | Placement Specifications |
| :--- | :--- | :--- |
| **Free Space (FS)** | Low-loss Dielectric Support | EUT mounted on Styrofoam block ($\varepsilon_r < 1.2$, loss tangent $< 0.05$). |
| **BHHL / BHHR** | SAM Head + Hand Phantom | Mounted in "cheek" or "touch" position ($6^\circ$ tilt mask spacer) using standardized hand phantoms. |
| **HL / HR** | Hand Phantom Only | Standalone holding configuration mimicking web browsing/data mode. |
| **WL / WR** | Forearm Phantom | wrist-worn devices (wearables paired with S938U) must utilize a forearm phantom with a wrist circumference of $16.27 \text{ cm}$. |

---

## 5. Maximum Allowed Measurement Uncertainty (MU) Limits

To establish certified validity of the S938U's wireless capability, test chamber results must fall within the maximum allowed uncertainty limits defined by CTIA Table 7-8:

*   **Free Space (FS)**: Max TRP Uncertainty: **$2.0 \text{ dB}$** | Max TIS Uncertainty: **$2.3 \text{ dB}$**
*   **Beside Head and Hand (BHHL/BHHR)**: Max TRP Uncertainty: **$2.4 \text{ dB}$** | Max TIS Uncertainty: **$2.6 \text{ dB}$**
*   **Hand Only (HL/HR)**: Max TRP Uncertainty: **$2.2 \text{ dB}$** | Max TIS Uncertainty: **$2.4 \text{ dB}$**
*   **Wrist-Worn (WL/WR)**: Max TRP Uncertainty: **$2.2 \text{ dB}$** | Max TIS Uncertainty: **$2.4 \text{ dB}$**

The **Device Trust Engine** will automatically decrease the client device trust score by $15$ points for any registered terminal exhibiting non-compliant RF indicators or lacking a verified CTIA uncertainty certificate.
