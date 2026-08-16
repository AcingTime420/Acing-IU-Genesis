#!/system/bin/sh
# Acing Guardian Vault - Deep Boot Initialization

echo "[Guardian Vault] Phase 1: Hardware/Environment Check..."

# 1. Early Tamper Detection
if [ -f /data/acing/tamper_detected ]; then
    echo "[CRITICAL] Persistent tamper detected - entering Vault Lockdown" > /dev/kmsg
    setprop acing.vault.status LOCKDOWN
    exit 1
fi

# 2. Initialize Vault Subsystem
/system/bin/guardian_vault_init || {
    echo "[ERROR] Vault hardware init failed"
    setprop acing.vault.status DEGRADED
}

# 3. Interface User Security Binding (Critical)
echo "[Guardian Vault] Binding Interface User Security..."
/system/bin/iu_security_init --vault

# Generate boot nonce and seal it
/system/bin/guardian_vault seal_boot_nonce

# 4. Load Critical IU Policies
/system/bin/guardian_policy --load /system/etc/guardian/iu_policies.json

setprop acing.vault.status ACTIVE
setprop acing.guardian.ready 1

echo "[Guardian Vault] Initialized successfully - IU Protected"
