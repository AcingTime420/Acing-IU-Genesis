package com.acing.guardian

import com.acing.guardian.dashboard.SystemAlert

object AdminDashboardViewModel {
    private val _alerts = mutableListOf<SystemAlert>()
    val alerts: List<SystemAlert> get() = _alerts

    fun updateSecurityState(state: String) {
        println("[AdminDashboardViewModel] Updating security state: $state")
        // Logic to update the admin dashboard UI
    }

    fun postCriticalAlert(alert: SystemAlert) {
        println("[AdminDashboardViewModel] Posting critical alert: ${alert.title} - ${alert.message}")
        _alerts.add(alert)
        // In a real UI, this would trigger a visual alert or notification
    }
}
