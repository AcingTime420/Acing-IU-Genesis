# CTIA OTA Performance Test Plan Integration (v3.8.2)

This document integrates the key factors, metrics, test setup requirements, and measurement uncertainty guidelines from the **CTIA Test Plan for Wireless Device Over-the-Air (OTA) Performance (Version 3.8.2)** into the **Acing IU** platform verification and device compliance baseline.

---

## 1. Core OTA Performance Metrics

For any mobile, handheld, notebook, or wrist-worn device enrolling in Acing IU, we model and evaluate the following radio frequency (RF) metrics under standardized test conditions:

### 1.1 Total Radiated Power (TRP)
*   **Definition**: The average spherical effective isotropic radiated power of the transmitter, calculated by integrating the radiated power sampled across a complete three-dimensional sphere.
*   **Measurement Step**: Sampled every $15^\circ$ along the theta ($\theta$) and phi ($\phi$) axes, recording orthogonal linear polarizations ($E_\theta$ and $E_\phi$) simultaneously, yielding 264 measurements per polarization.
*   **Formula**:
    $$TRP \approx \frac{\pi}{2NM} \sum_{i=1}^{N-1} \sum_{j=0}^{M-1} \left[ EiRP_\theta(\theta_i, \phi_j) + EiRP_\phi(\theta_i, \phi_j) \right] \sin(\theta_i)$$

### 1.2 Total Isotropic Sensitivity (TIS)
*   **Definition**: The average spherical effective radiated receiver sensitivity, integrated across the total spherical surface.
*   **Measurement Step**: Sampled every $30^\circ$ along the theta ($\theta$) and phi ($\phi$) axes under orthogonal polarizations, using Bit Error Rate (BER), Frame Error Rate (FER), or Block Error Rate (BLER) to evaluate sensitivity at each location.
*   **Formula**:
    $$TIS \approx \frac{4\pi}{\oint \left[ \frac{1}{EIS_\theta(\theta, \phi)} + \frac{1}{EIS_\phi(\theta, \phi)} \right] \sin(\theta) d\theta d\phi}$$

### 1.3 Combined TIS (C-TIS)
*   **Definition**: Spatially integrated receiver radiated sensitivity with all available receivers active. This is critical for assessing Carrier Aggregation (CA) and multi-antenna receiver setups.

---

## 2. Test Setup Configurations (Normative)

Devices under test (EUT) are assessed across specific simulated use conditions:

| Abbreviation | Configuration Name | Description |
| :--- | :--- | :--- |
| **FS** | Free Space | EUT placed directly on a low dielectric constant support structure (e.g. Styrofoam). |
| **BHHL / BHHR** | Beside Head & Hand Left / Right | Simulated "Talk Mode" against left/right ears of a SAM head phantom, using anthropomorphic hand phantoms. |
| **HL / HR** | Hand Left / Hand Right | Simulated "Data Mode" or browsing/navigation holding configurations, utilizing standardized hand phantoms. |
| **WL / WR** | Wrist-Worn Left / Right | Wrist-worn placement simulated using a standardized Forearm Phantom (perimeter of conical section: 162.7 mm). |

---

## 3. Technology & Frequencies Coverage

Acing IU supports compliance tracking for multiple wireless protocols, mapping directly to CTIA-designated test bands:

*   **LTE (FDD/TDD)**: Bands 2, 4, 5, 7, 12, 13, 14, 17, 25, 26, 30, 41, 66, 70.
*   **UMTS (WCDMA)**: Bands I, II, IV, V, VIII.
*   **GSM / GPRS / EGPRS**: 850, 900, 1800, 1900 MHz.
*   **A-GNSS (GPS / GLONASS)**:
    *   *GPS (Scenario #1)*: 8 satellites, HDOP range 1.1 to 1.6, success rate $\ge$ 95% successful fixes (at least 38 out of 40 attempts).
    *   *GLONASS*: 6 satellites, HDOP range 1.4 to 2.1, success rate $\ge$ 95% successful fixes (at least 38 out of 40 attempts).

---

## 4. Measurement Uncertainty (MU) Limits

To satisfy compliance validation, the expanded uncertainty for all TRP and TIS measurements calculated at a 95% confidence level ($k=2$) must not exceed the following maximum limits (derived from CTIA Table 7-8):

| Test Configuration | Max TRP Uncertainty (dB) | Max TIS Uncertainty (dB) |
| :--- | :---: | :---: |
| **Free Space (FS)** | 2.0 | 2.3 |
| **Beside Head and Hand (Left & Right)** | 2.4 | 2.6 |
| **Hand (Left & Right)** | 2.2 | 2.4 |
| **Wrist-Worn (Left & Right)** | 2.2 | 2.4 |

If a device's certification measurements exceed these uncertainty thresholds, the Acing IU Device Trust Engine will flag the device as restricted or quarantine it until calibrated validation results are supplied.
