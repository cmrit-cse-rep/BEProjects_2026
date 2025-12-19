package com.example.stresssense.worker

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.stresssense.data.local.SensorDataDao
import com.example.stresssense.data.local.StressPrediction
import com.example.stresssense.data.local.StressPredictionDao
import com.example.stresssense.ml.StressPredictor
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

@HiltWorker
class StressWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted workerParams: WorkerParameters,
    private val sensorDataDao: SensorDataDao,
    private val stressPredictionDao: StressPredictionDao,
    private val stressPredictor: StressPredictor
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Worker starting.")

            // 1. Calculate the start time for the 5-minute window
            val fiveMinutesAgo = System.currentTimeMillis() - TimeUnit.MINUTES.toMillis(5)

            // 2. Fetch the last 5 minutes of sensor data
            val recentData = sensorDataDao.getRecentSensorData(fiveMinutesAgo)

            if (recentData.isEmpty()) {
                Log.d(TAG, "No recent sensor data to process.")
                return@withContext Result.success()
            }

            // 3. Construct the feature vector (calculate averages)
            val avgHeartRate = recentData.map { it.heartRate }.average().toFloat()
            val avgMotionMagnitude = recentData.map { kotlin.math.sqrt(it.motionX * it.motionX + it.motionY * it.motionY + it.motionZ * it.motionZ) }.average().toFloat()
            // You can add more complex feature engineering here

            // TODO: Finalize your feature vector based on your model's requirements.
            // This example assumes a simple 2-feature model.
            val featureVector = arrayOf(floatArrayOf(avgHeartRate, avgMotionMagnitude))

            // 4. Run the prediction
            val predictionResult = stressPredictor.predict(featureVector)

            predictionResult.onSuccess { stressScore ->
                Log.d(TAG, "Prediction successful. Stress score: $stressScore")

                // 5. Save the prediction
                val predictionEntity = StressPrediction(
                    timestamp = System.currentTimeMillis(),
                    stressScore = stressScore
                )
                stressPredictionDao.insertPrediction(predictionEntity)
                Log.d(TAG, "Saved new prediction.")

            }.onFailure { 
                Log.e(TAG, "Prediction failed", it)
                return@withContext Result.failure()
            }

            Log.d(TAG, "Worker finished successfully.")
            Result.success()

        } catch (e: Exception) {
            Log.e(TAG, "Worker failed", e)
            Result.failure()
        }
    }

    companion object {
        const val WORK_NAME = "StressPredictionWorker"
        private const val TAG = "StressWorker"
    }
}