package com.example.stresssense.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface StressPredictionDao {

    // Used by the Dashboard to load graph data from real predictions
    @Query("SELECT * FROM stress_predictions WHERE timestamp >= :timestamp ORDER BY timestamp DESC")
    fun getPredictionsSince(timestamp: Long): Flow<List<StressPrediction>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPrediction(prediction: StressPrediction)
}