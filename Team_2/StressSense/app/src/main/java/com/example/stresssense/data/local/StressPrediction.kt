package com.example.stresssense.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "stress_predictions")
data class StressPrediction(
    @PrimaryKey
    val timestamp: Long, // Use time as the unique ID
    val stressScore: Float,
    val note: String? = null
)