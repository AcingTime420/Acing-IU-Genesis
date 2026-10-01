package com.acing.guardian

object AnomalyDetector {
    fun start() {
        println("[AnomalyDetector] Simulator placeholder registered; no live anomaly detector is running.")
    }

    /** null means no anomaly evidence is available. */
    fun detectAnomaly(data: String): Boolean? {
        println("[AnomalyDetector] No live anomaly provider for: $data")
        return null
    }
}
