package com.example.stresssense.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "sensor_data")
data class SensorData(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val timestamp: Long,
    val heartRate: Double,
    val steps: Long,
    val motionX: Float,
    val motionY: Float,
    val motionZ: Float
)
