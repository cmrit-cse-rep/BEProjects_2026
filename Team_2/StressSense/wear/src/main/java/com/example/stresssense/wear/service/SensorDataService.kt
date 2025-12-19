package com.example.stresssense.wear.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import android.content.pm.ServiceInfo
import android.os.Build
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class SensorDataService : Service(), SensorEventListener {

    private lateinit var sensorManager: SensorManager
    private var accelerometer: Sensor? = null
    private var heartRateSensor: Sensor? = null
    private var stepCounter: Sensor? = null
    
    private var wakeLock: android.os.PowerManager.WakeLock? = null

    private val dataClient by lazy { Wearable.getDataClient(this) }
    private val serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)

    // Current latest values (updated by callbacks)
    private val latestHeartRate = MutableStateFlow(0.0f)
    private val latestSteps = MutableStateFlow(0L)
    private val latestMotion = MutableStateFlow<FloatArray>(floatArrayOf(0f, 0f, 0f))

    // Buffering
    private data class SensorReading(
        val timestamp: Long,
        val heartRate: Float,
        val steps: Long,
        val motion: FloatArray
    )
    private val dataBuffer = mutableListOf<SensorReading>()
    private val bufferLock = Any()

    override fun onCreate() {
        super.onCreate()
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        heartRateSensor = sensorManager.getDefaultSensor(Sensor.TYPE_HEART_RATE)
        stepCounter = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)

        // Acquire WakeLock to keep CPU running for sensor collection
        val powerManager = getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
        wakeLock = powerManager.newWakeLock(android.os.PowerManager.PARTIAL_WAKE_LOCK, "StressSense::SensorServiceWakeLock")
        wakeLock?.acquire(10 * 60 * 1000L /*10 minutes timeout*/)

        createNotificationChannel()
        
        val type = if (Build.VERSION.SDK_INT >= 34) {
            ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH
        } else {
            0
        }
        ServiceCompat.startForeground(this, NOTIFICATION_ID, createNotification(), type)

        startSensorCollection()
        startSamplingLoop()
    }

    private fun startSensorCollection() {
        accelerometer?.let { sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME) }
        heartRateSensor?.let { sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_NORMAL) }
        stepCounter?.let { sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_NORMAL) }
    }

    /**
     * Sampling Loop:
     * Instead of reacting to every sensor event (which is chaotic for transmission),
     * we sample the "latest" known values at a fixed rate (e.g., 10Hz = 100ms).
     * This creates a consistent time-series.
     */
    private fun startSamplingLoop() {
        serviceScope.launch {
            while (true) {
                val now = System.currentTimeMillis()
                val reading = SensorReading(
                    timestamp = now,
                    heartRate = latestHeartRate.value,
                    steps = latestSteps.value,
                    motion = latestMotion.value.clone()
                )

                synchronized(bufferLock) {
                    dataBuffer.add(reading)
                }

                // If buffer is full or time passed, flush
                if (dataBuffer.size >= BATCH_SIZE) {
                    flushBuffer()
                }

                delay(SAMPLING_INTERVAL_MS)
            }
        }
    }

    private suspend fun flushBuffer() {
        val batchToSend = synchronized(bufferLock) {
            val copy = dataBuffer.toList()
            dataBuffer.clear()
            copy
        }

        if (batchToSend.isEmpty()) return

        try {
            // Convert list to primitive arrays for DataMap
            val timestamps = LongArray(batchToSend.size) { batchToSend[it].timestamp }
            val heartRates = FloatArray(batchToSend.size) { batchToSend[it].heartRate }
            val stepCounts = LongArray(batchToSend.size) { batchToSend[it].steps }
            // Flatten motion: [x1, y1, z1, x2, y2, z2, ...]
            val motions = FloatArray(batchToSend.size * 3)
            batchToSend.forEachIndexed { index, reading ->
                motions[index * 3] = reading.motion[0]
                motions[index * 3 + 1] = reading.motion[1]
                motions[index * 3 + 2] = reading.motion[2]
            }

            val putDataMapReq = PutDataMapRequest.create(SENSOR_DATA_PATH).apply {
                dataMap.putLongArray(KEY_TIMESTAMPS, timestamps)
                dataMap.putFloatArray(KEY_HEART_RATES, heartRates)
                dataMap.putLongArray(KEY_STEPS, stepCounts)
                dataMap.putFloatArray(KEY_MOTIONS, motions) // Flattened
                dataMap.putLong("batch_timestamp", System.currentTimeMillis())
            }
            
            val putDataReq = putDataMapReq.asPutDataRequest().setUrgent()
            dataClient.putDataItem(putDataReq).await()
            
            Log.d(TAG, "Sent batch of ${batchToSend.size} readings.")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to send sensor batch", e)
            // Ideally, we should add data back to buffer or save to file if offline
            // For now, we log error (simple implementation)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceJob.cancel()
        sensorManager.unregisterListener(this)
        if (wakeLock?.isHeld == true) {
            wakeLock?.release()
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    override fun onSensorChanged(event: SensorEvent?) {
        event ?: return
        when (event.sensor.type) {
            Sensor.TYPE_ACCELEROMETER -> {
                latestMotion.value = event.values.clone()
            }
            Sensor.TYPE_HEART_RATE -> {
                if (event.values.isNotEmpty()) {
                    latestHeartRate.value = event.values[0]
                }
            }
            Sensor.TYPE_STEP_COUNTER -> {
                if (event.values.isNotEmpty()) {
                    latestSteps.value = event.values[0].toLong()
                }
            }
        }
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(NOTIFICATION_CHANNEL_ID, "Sensor Data", NotificationManager.IMPORTANCE_DEFAULT)
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)
    }

    private fun createNotification(): Notification = NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
        .setContentTitle("StressSense Active")
        .setContentText("Collecting advanced sensor data...")
        .setSmallIcon(android.R.drawable.ic_dialog_info) 
        .build()

    companion object {
        private const val TAG = "SensorDataService"
        private const val NOTIFICATION_ID = 1
        private const val NOTIFICATION_CHANNEL_ID = "stresssense_sensor_data"
        
        // Sampling Config
        private const val SAMPLING_INTERVAL_MS = 200L // 5Hz
        private const val BATCH_SIZE = 50 // Packets per transmission (approx every 10 secs)

        const val SENSOR_DATA_PATH = "/sensor_data_batch" // Changed path for batch
        const val KEY_TIMESTAMPS = "timestamps"
        const val KEY_HEART_RATES = "heart_rates"
        const val KEY_STEPS = "steps"
        const val KEY_MOTIONS = "motions"
    }
}
