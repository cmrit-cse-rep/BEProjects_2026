package com.example.stresssense.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface SensorDataDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(sensorData: SensorData)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(sensorDataList: List<SensorData>)

    @Query("SELECT * FROM sensor_data ORDER BY timestamp DESC")
    fun getAllSensorData(): Flow<List<SensorData>>

    @Query("SELECT * FROM sensor_data WHERE timestamp >= :startTime")
    suspend fun getRecentSensorData(startTime: Long): List<SensorData>

    @Query("DELETE FROM sensor_data")
    suspend fun deleteAll()
}
