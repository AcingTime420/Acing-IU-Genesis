# Technical Analysis: Hardware Tamper Check & IU Binding Interaction

In the **Acing Guardian Security Platform**, the interaction between the **Hardware Tamper Check** and the **Interface User (IU) Binding** is a critical sequence that establishes the system's **Chain of Trust**. This interaction ensures that the administrative control plane (Interface User) is never exposed on a device whose physical or environment integrity has been compromised.

## 1. The Boot Sequence Logic

The interaction follows a strict "Verify-then-Bind" protocol, primarily orchestrated by the `guardian_vault_init.sh` script and the native `guardian_vault.c` subsystem.

### Step 1: The Primary Gatekeeper (Tamper Check)
Before any administrative components are initialized, the system executes `vault_check_tamper()`. This function queries hardware sensors (voltage, temperature, and physical probing detectors).
- **If Tamper is Detected:** The Vault transitions to a `LOCKDOWN` state (status 2). The boot script catches this, sets the system property `acing.vault.status=LOCKDOWN`, and immediately reboots the device into a restricted recovery mode.
- **If Clean:** The Vault transitions to `ACTIVE` (status 1), allowing the sequence to proceed.

### Step 2: Status-Based Gating
The IU binding process (`iu_security_bind`) is strictly dependent on the Vault's status. As implemented in the native layer:

```c
int iu_security_bind(void) {
    if (g_vault_state.vault_status != 1) { // Check if ACTIVE
        printf("[Native Vault] Error: Vault not active for IU binding.\n");
        return -1;
    }
    // Proceed with binding...
}
```

This ensures that even if the boot script were bypassed, the native binding logic would refuse to execute unless the Vault had successfully cleared its internal hardware integrity checks.

---

## 2. The Binding Mechanism: Cryptographic Sealing

Once the hardware is verified as untampered, the **IU Binding** process creates a cryptographic link between the Interface User and the Vault hardware.

| Component | Role in Interaction |
| :--- | :--- |
| **Boot Nonce** | A unique, hardware-generated random number (`last_boot_nonce`) created only once per clean boot. |
| **Context Sealing** | The IU layer's initial configuration and administrative keys are "sealed" using the Vault's internal `vault_seal_data` function. |
| **Hardware Key Wrapping** | Administrative credentials are encrypted using keys that are physically locked within the Vault and never exposed to the main OS memory. |

By sealing the IU context, the system ensures that the administrative interface is **session-bound**. If the device is tampered with *after* boot, the Vault can instantly "unseal" or revoke the keys, effectively killing the admin session.

---

## 3. Runtime Continuity (The IU-Vault Bridge)

The interaction doesn't end at boot. The `IUVaultBridge.kt` continues to monitor this relationship during runtime:

1.  **Periodic Re-Verification:** The Kotlin bridge periodically calls `nativeVaultCheckTamper()`.
2.  **Tamper Response:** If a hardware sensor triggers a tamper flag during an active session, the `onTamperDetected()` function is called, which:
    - Posts a **CRITICAL** alert to the Admin Dashboard.
    - Triggers the Vault's internal self-destruct/lockdown policy, which erases the keys used to seal the IU context.

## 4. Security Benefits

- **Anti-Spoofing:** A malicious OS cannot spoof a "Clean" state to the IU layer because it lacks the hardware-resident keys required to generate a valid sealed context.
- **Physical Attack Resilience:** Even if an attacker physically probes the device memory, they cannot access the administrative secrets because those secrets are cryptographically bound to a Vault that has entered lockdown.
- **Atomic Failure:** The system is designed to fail closed. If the tamper check fails, the IU binding is impossible, preventing any administrative operations on a compromised device.

---
*This documentation is part of the Acing OS Security Platform technical series.*
