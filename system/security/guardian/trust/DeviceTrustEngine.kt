package com.acing.guardian.trust

import com.acing.guardian.AcingVaultEmulator
import java.time.Instant
import kotlin.math.roundToInt

data class TrustSignal(
    val malwareRisk: Int,
    val anomalyScore: Int,
    val networkRisk: Int,
    val attestationPassed: Boolean
)

data class TrustThresholds(
    val minimalAccessThreshold: Int = 40,
    val restrictedAccessThreshold: Int = 70
)

data class TrustDecision(
    val trustScore: Int,
    val reason: String,
    val enforcementAction: EnforcementAction
)

data class DeviceTelemetrySnapshot(
    val deviceId: String,
    val signal: TrustSignal,
    val observedAt: Instant = Instant.now()
)

enum class EnforcementAction {
    FULL_ACCESS,
    RESTRICTED_MODE,
    MINIMAL_IU,
    DENY_ACCESS
}

class DeviceTrustEngine(
    private val thresholds: TrustThresholds = TrustThresholds()
) {
    fun evaluateTrust(deviceId: String, signal: TrustSignal): TrustDecision {
        val telemetry = DeviceTelemetrySnapshot(deviceId = deviceId, signal = signal)
        val score = computeTrustScore(telemetry.signal)

        val action = when {
            !signal.attestationPassed -> EnforcementAction.DENY_ACCESS
            score < thresholds.minimalAccessThreshold -> EnforcementAction.MINIMAL_IU
            score < thresholds.restrictedAccessThreshold -> EnforcementAction.RESTRICTED_MODE
            else -> EnforcementAction.FULL_ACCESS
        }

        val reason = when (action) {
            EnforcementAction.DENY_ACCESS -> "Attestation failed; deny access."
            EnforcementAction.MINIMAL_IU -> "Trust score below ${thresholds.minimalAccessThreshold}; restrict to minimal IU."
            EnforcementAction.RESTRICTED_MODE -> "Trust score below ${thresholds.restrictedAccessThreshold}; enable restricted mode."
            EnforcementAction.FULL_ACCESS -> "Trust score acceptable for full access."
        }

        return TrustDecision(trustScore = score, reason = reason, enforcementAction = action)
    }

    fun attestDevice(deviceId: String, challenge: ByteArray): Boolean {
        // TODO(PROD): Replace emulator attestation with Play Integrity / SafetyNet provider.
        // TODO(PROD): Define telemetry boundaries and minimum-data collection for trust workflows.
        // TODO(PROD): Add GDPR-compliant retention and deletion policy for trust signal history.
        val result = AcingVaultEmulator.performAttestation(challenge) != null
        println("[DeviceTrustEngine] Attestation result for $deviceId: $result")
        return result
    }

    private fun computeTrustScore(signal: TrustSignal): Int {
        val malwareWeight = 0.50
        val anomalyWeight = 0.30
        val networkWeight = 0.20

        val weightedRisk = (signal.malwareRisk * malwareWeight) +
            (signal.anomalyScore * anomalyWeight) +
            (signal.networkRisk * networkWeight)

        return (100 - weightedRisk.roundToInt()).coerceIn(0, 100)
    }
}
