package com.acing.guardian

object NetworkThreatMonitor {
    fun start() {
        println("[NetworkThreatMonitor] Simulator placeholder registered; no live network monitor is running.")
    }

    /** null means no network-threat evidence is available. */
    fun analyzeConnection(connectionInfo: String): Boolean? {
        println("[NetworkThreatMonitor] No live network provider for: $connectionInfo")
        return null
    }
}
