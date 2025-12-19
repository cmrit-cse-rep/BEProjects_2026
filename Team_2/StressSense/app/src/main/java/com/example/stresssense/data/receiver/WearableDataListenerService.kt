package com.example.stresssense.data.receiver

import android.util.Log
import com.example.stresssense.data.local.SensorData
import com.example.stresssense.data.local.SensorDataDao
import com.example.stresssense.data.local.StressPrediction
import com.example.stresssense.data.local.StressPredictionDao
import com.example.stresssense.ml.StressPredictor
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.WearableListenerService
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class WearableDataListenerService : WearableListenerService() {

    @Inject
    lateinit var sensorDataDao: SensorDataDao

    @Inject
    lateinit var stressPredictionDao: StressPredictionDao

    @Inject
    lateinit var stressPredictor: StressPredictor

    private val serviceJob = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        super.onDataChanged(dataEvents)

        dataEvents.filter { it.type == DataEvent.TYPE_CHANGED && it.dataItem.uri.path == SENSOR_DATA_PATH }
            .forEach { event ->
                val dataMap = DataMapItem.fromDataItem(event.dataItem).dataMap
                
                val timestamps = dataMap.getLongArray(KEY_TIMESTAMPS)
                val heartRates = dataMap.getFloatArray(KEY_HEART_RATES)
                val steps = dataMap.getLongArray(KEY_STEPS)
                val motions = dataMap.getFloatArray(KEY_MOTIONS)

                if (timestamps != null && heartRates != null && motions != null) {
                    val sensorDataList = ArrayList<SensorData>()
                    val size = timestamps.size

                    // Validate arrays are synced
                    if (heartRates.size == size && motions.size == size * 3) {
                        for (i in 0 until size) {
                            val stepCount = if (steps != null && steps.size == size) steps[i] else 0L
                            
                            sensorDataList.add(
                                SensorData(
                                    timestamp = timestamps[i],
                                    heartRate = heartRates[i].toDouble(),
                                    steps = stepCount,
                                    motionX = motions[i * 3],
                                    motionY = motions[i * 3 + 1],
                                    motionZ = motions[i * 3 + 2]
                                )
                            )
                        }

                        if (sensorDataList.isNotEmpty()) {
                            serviceScope.launch {
                                try {
                                    sensorDataDao.insertAll(sensorDataList)
                                    Log.d(TAG, "Inserted batch of ${sensorDataList.size} records.")
                                    
                                    // TRIGGER INFERENCE
                                    // 1. Get window (e.g., last 2 minutes to ensure we have enough data)
                                    val twoMinutesAgo = System.currentTimeMillis() - (2 * 60 * 1000)
                                    val recentData = sensorDataDao.getRecentSensorData(twoMinutesAgo)
                                    
                                    // 2. Run Prediction
                                    val stressScore = stressPredictor.predict(recentData)
                                    
                                    if (stressScore != null) {
                                        // 3. Save Prediction
                                        val prediction = StressPrediction(
                                            timestamp = System.currentTimeMillis(),
                                            stressScore = stressScore
                                        )
                                        stressPredictionDao.insertPrediction(prediction)
                                        Log.i(TAG, "New Stress Score Calculated: $stressScore")
                                        
                                        // 4. Alert if High Stress
                                        if (stressScore > 1.5) {
                                            sendHighStressNotification(stressScore)
                                        }
                                    } else {
                                        Log.w(TAG, "Inference failed or skipped (not enough data?)")
                                    }
                                    
                                } catch (e: Exception) {
                                    Log.e(TAG, "Error in data pipeline", e)
                                }
                            }
                        }
                    } else {
                        Log.w(TAG, "Sensor data arrays size mismatch!")
                    }
                }
            }
    }

    private fun sendHighStressNotification(score: Float) {
        val notificationManager = getSystemService(android.content.Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
        val channelId = "stress_alerts"
        
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            val channel = android.app.NotificationChannel(channelId, "Stress Alerts", android.app.NotificationManager.IMPORTANCE_HIGH)
            notificationManager.createNotificationChannel(channel)
        }
        
        val notification = androidx.core.app.NotificationCompat.Builder(this, channelId)
            .setContentTitle("High Stress Detected")
            .setContentText("Your stress level is rising (${(score/2f*100).toInt()}%). Take a moment to breathe.")
            .setSmallIcon(android.R.drawable.stat_notify_error)
            .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
            .build()
            
        notificationManager.notify(101, notification)
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceJob.cancel()
    }

    companion object {
        private const val TAG = "DataListenerService"

        // Keys to match the Wear OS service
        private const val SENSOR_DATA_PATH = "/sensor_data_batch"
        private const val KEY_TIMESTAMPS = "timestamps"
        private const val KEY_HEART_RATES = "heart_rates"
        private const val KEY_STEPS = "steps"
        private const val KEY_MOTIONS = "motions"
    }
}
