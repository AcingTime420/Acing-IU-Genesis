package com.acing.guardian

import java.security.MessageDigest
import java.security.SecureRandom
import java.util.concurrent.ConcurrentHashMap

/**
 * Software-only vault simulator for development and tests.
 *
 * This object provides no hardware isolation, hardware attestation, certification,
 * or production key-protection guarantee. Callers must never treat simulator
 * success as hardware-backed security evidence.
 */
object AcingVaultEmulator {
    private val secureStorage = ConcurrentHashMap<String, ByteArray>()
    @Volatile private var tamperDetected: Boolean = false
    private val random = SecureRandom()

    fun initialize() {
        println("[AcingVaultEmulator] Initializing software-only vault simulator.")
        println("[AcingVaultEmulator] Simulator tamper status: ${if (tamperDetected) "DETECTED" else "CLEAN"}")
    }

    fun storeSecret(key: String, data: ByteArray): Boolean {
        require(key.isNotBlank()) { "key must not be blank" }
        if (tamperDetected) {
            println("[AcingVaultEmulator] Tamper state active; simulator storage denied.")
            return false
        }
        secureStorage.put(key, data.copyOf())?.fill(0)
        return true
    }

    fun retrieveSecret(key: String): ByteArray? {
        if (tamperDetected) return null
        return secureStorage[key]?.copyOf()
    }

    fun eraseSecret(key: String): Boolean {
        if (tamperDetected) return false
        val removed = secureStorage.remove(key) ?: return false
        removed.fill(0)
        return true
    }

    fun isTampered(): Boolean = tamperDetected

    /** Explicit test-only tamper transition. */
    fun simulateTamper() {
        println("[AcingVaultEmulator] Simulating tamper; clearing simulator-held secret material.")
        tamperDetected = true
        secureStorage.values.forEach { it.fill(0) }
        secureStorage.clear()
    }

    /** Test/development helper only; real hardware would not expose this reset. */
    fun resetTamperStatus() {
        println("[AcingVaultEmulator] Resetting simulator tamper state (development only).")
        tamperDetected = false
    }

    fun getSecureRandomBytes(numBytes: Int): ByteArray {
        require(numBytes > 0) { "numBytes must be positive" }
        check(!tamperDetected) { "vault simulator is tampered; random-byte request denied" }
        return ByteArray(numBytes).also(random::nextBytes)
    }

    /**
     * Produces deterministic simulator evidence bound to a challenge.
     * This is not a signature and must not satisfy a hardware-attestation gate.
     */
    fun performAttestation(challenge: ByteArray): ByteArray? {
        if (tamperDetected || challenge.isEmpty()) return null
        val digest = MessageDigest.getInstance("SHA-256").digest(challenge)
        val prefix = "SIMULATOR_ATTESTATION_ONLY:".toByteArray(Charsets.UTF_8)
        return prefix + digest
    }
}
