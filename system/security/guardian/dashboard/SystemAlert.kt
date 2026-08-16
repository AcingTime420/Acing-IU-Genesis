package com.acing.guardian.dashboard

data class SystemAlert(
    val severity: AlertSeverity,
    val title: String,
    val message: String,
    val category: AlertCategory
)

enum class AlertSeverity {
    INFO,
    WARNING,
    CRITICAL
}

enum class AlertCategory {
    SECURITY,
    SYSTEM,
    NETWORK,
    HARDWARE
}
