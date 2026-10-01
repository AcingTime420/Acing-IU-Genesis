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

enum class EnforcementAction { FULL_ACCESS, RESTRICTED_MODE, MINIMAL_IU, DENY_ACCESS }

class DeviceTrustEngine(private val thresholds: TrustThresholds = TrustThresholds()) {
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
            EnforcementAction.DENY_ACCESS -> "Required attestation evidence is unavailable or failed; deny access."
            EnforcementAction.MINIMAL_IU -> "Trust score below ${thresholds.minimalAccessThreshold}; restrict to minimal IU."
            EnforcementAction.RESTRICTED_MODE -> "Trust score below ${thresholds.restrictedAccessThreshold}; enable restricted mode."
            EnforcementAction.FULL_ACCESS -> "Trust score acceptable for full access."
        }
        return TrustDecision(score, reason, action)
    }

    /**
     * Hardware-backed attestation is not implemented in the current repository.
     * Simulator evidence is intentionally incapable of satisfying this gate.
     */
    fun attestDevice(deviceId: String, challenge: ByteArray): Boolean {
        val simulatorEvidenceAvailable = AcingVaultEmulator.performAttestation(challenge) != null
        println(
            "[DeviceTrustEngine] Hardware-backed attestation unavailable for $deviceId; " +
                "simulatorEvidence=$simulatorEvidenceAvailable; enforcementResult=false"
        )
        return false
    }

    private fun computeTrustScore(signal: TrustSignal): Int {
        val weightedRisk =
            signal.malwareRisk * 0.50 +
            signal.anomalyScore * 0.30 +
            signal.networkRisk * 0.20
        return (100 - weightedRisk.roundToInt()).coerceIn(0, 100)
    }
}
