package com.example.stresssense

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.example.stresssense.data.local.StressPrediction
import com.example.stresssense.data.local.StressPredictionDao
import com.example.stresssense.worker.StressWorker
import dagger.hilt.android.HiltAndroidApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit
import javax.inject.Inject

@HiltAndroidApp
class StressSenseApplication : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    @Inject
    lateinit var stressPredictionDao: StressPredictionDao

    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        setupRecurringWork()
        insertDummyData()
    }

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()

    private fun setupRecurringWork() {
        val repeatingRequest = PeriodicWorkRequestBuilder<StressWorker>(15, TimeUnit.MINUTES)
            .build()

        WorkManager.getInstance(applicationContext).enqueueUniquePeriodicWork(
            StressWorker.WORK_NAME,
            ExistingPeriodicWorkPolicy.KEEP,
            repeatingRequest
        )
    }

    private fun insertDummyData() {
        applicationScope.launch {
            val now = System.currentTimeMillis()
            val predictions = listOf(
                StressPrediction(timestamp = now - TimeUnit.HOURS.toMillis(20), stressScore = 0.0f), // low
                StressPrediction(timestamp = now - TimeUnit.HOURS.toMillis(16), stressScore = 1.0f), // medium
                StressPrediction(timestamp = now - TimeUnit.HOURS.toMillis(12), stressScore = 2.0f), // high
                StressPrediction(timestamp = now - TimeUnit.HOURS.toMillis(8), stressScore = 1.0f),  // medium
                StressPrediction(timestamp = now - TimeUnit.HOURS.toMillis(4), stressScore = 0.0f),  // low
                StressPrediction(timestamp = now, stressScore = 2.0f) // high
            )
            predictions.forEach { stressPredictionDao.insertPrediction(it) }
        }
    }
}