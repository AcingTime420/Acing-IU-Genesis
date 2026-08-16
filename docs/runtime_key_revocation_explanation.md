# Technical Deep-Dive: Runtime Key Revocation in IUVaultBridge

In the **Acing Guardian Security Platform**, the ability to revoke cryptographic keys in real-time is the ultimate defense against physical tampering. The `IUVaultBridge` acts as the critical link between hardware sensors and the high-level administrative environment, ensuring that a compromise at the physical layer results in an immediate and irreversible loss of access to sensitive data.

## 1. The Revocation Trigger Flow

The revocation process is a rapid, multi-layered response triggered by a hardware-level event.

### Phase 1: Hardware Detection (The Source)
Hardware sensors (Voltage, Temperature, Probing) detect an anomaly. The **Acing Vault Subsystem** (or the `AcingVaultEmulator`) immediately sets an internal `tamper_flags` bitmask.
- **Atomic Action:** In the native layer, the vault's status is shifted to `LOCKDOWN`.
- **Immediate Erasure:** The Vault Subsystem's internal crypto-engine wipes the **Master Sealing Key (MSK)** from its isolated SRAM.

### Phase 2: Native-to-Kotlin Notification
The `IUVaultBridge` performs continuous or event-driven monitoring via the JNI layer.

```kotlin
// Inside IUVaultBridge.kt
if (nativeVaultCheckTamper() != 0) {
    onTamperDetected()
}
```

The `nativeVaultCheckTamper()` call reaches down into the C implementation, which checks the global `VaultState`. If `tamper_flags` is non-zero, it returns a failure code to the Kotlin runtime.

---

## 2. The Revocation Mechanism

When `onTamperDetected()` is invoked, the `IUVaultBridge` executes a series of "Fail-Closed" operations:

### A. Invalidating the Admin Session
The bridge immediately informs the `AdminDashboardViewModel` of the breach. This triggers a UI lockdown, but more importantly, it calls for the revocation of the current session token.
- **Key Invalidation:** Any future calls to `nativeVerifyAdminSession(token)` will fail because the Vault's status is no longer `ACTIVE`.

### B. Unsealing Failure (Cryptographic Dead-End)
Because the Vault's Master Sealing Key was erased in Phase 1, any data previously "sealed" (encrypted and authenticated) by the IU layer becomes permanently unreadable.
- **The Dead-End:** When the system attempts to call `vault_unseal_data`, the native code checks the status:
  ```c
  if (g_vault_state.vault_status != 1) { // If not ACTIVE (e.g., LOCKDOWN)
      return -1; // Fail unsealing
  }
  ```
- Even if an attacker captures the encrypted "blob" from memory, the key required to decrypt it no longer exists anywhere on the device.

### C. Resource Revocation
The `IUVaultBridge` coordinates with the `GuardianService` to:
1.  **Kill Secure Workspaces:** Terminate all isolated processes associated with the "ADMIN" role.
2.  **Purge Memory:** Trigger a garbage collection and explicit memory zeroing of any IU-related context strings that might remain in the Java heap.

---

## 3. The "Self-Destruct" Logic

The key revocation is designed to be **non-recoverable** without a full system re-provisioning.

| Stage | Action | Impact |
| :--- | :--- | :--- |
| **Volatile Revocation** | Erasure of SRAM keys. | Immediate loss of runtime access. |
| **Persistent Revocation** | Marking the `acing_vault` partition as `TAMPERED`. | Prevents access to long-term secrets (biometrics, saved credentials) even after a reboot. |
| **Policy Enforcement** | Triggering `lockdown_on_tamper` from `policies.json`. | Can trigger a factory reset or "Bricking" of the administrative control plane. |

## 4. Summary of the IUVaultBridge Role

The `IUVaultBridge` ensures that the **Software Intelligence** of the Admin Dashboard is always synchronized with the **Hardware Reality** of the Vault. By handling revocation at the bridge level, Acing OS guarantees that no administrative tool can continue to operate on a foundation that is no longer trusted.

---
*This documentation is part of the Acing OS Security Platform technical series.*
