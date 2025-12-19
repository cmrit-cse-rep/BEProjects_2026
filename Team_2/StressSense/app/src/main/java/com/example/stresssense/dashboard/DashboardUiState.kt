package com.example.stresssense.dashboard

/**
 * Represents a single point on the stress graph.
 * @param value The stress score (0.0 to 1.0).
 * @param label The label for the x-axis (e.g., "Mon" or "25 Nov").
 */
data class GraphPoint(val value: Float, val label: String)

/**
 * Represents the full UI state for the Dashboard screen.
 */
data class DashboardUiState(
    val currentStressLevel: Float = 0.0f,
    val currentStressLevelText: String = "Low",
    val currentStressLevelNormalized: Float = 0.0f,

    // Data for the weekly and monthly trend graphs.
    val weeklyStressData: List<GraphPoint> = emptyList(),
    val monthlyStressData: List<GraphPoint> = emptyList(),

    // Basic activity stats.
    val todaySteps: Int = 0, // Placeholder
    val todaySleep: String = "0h 0m" // Placeholder
)
