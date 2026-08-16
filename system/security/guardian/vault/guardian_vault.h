#ifndef GUARDIAN_VAULT_H
#define GUARDIAN_VAULT_H

#include <stdint.h>
#include <stddef.h>

// Define VaultState structure
typedef struct {
    uint8_t vault_status;        // 0=LOCKED, 1=ACTIVE, 2=LOCKDOWN
    uint64_t tamper_flags;
    uint32_t key_count;
    uint64_t last_boot_nonce;
} VaultState;

// Function declarations for native vault operations
int vault_init(void);
int vault_seal_data(const void* data, size_t len, uint8_t* sealed, size_t* out_len);
int vault_unseal_data(const uint8_t* sealed, size_t len, void* data, size_t* out_len);
int vault_check_tamper(void);
int iu_security_bind(void);   // Interface User binding

#endif // GUARDIAN_VAULT_H
