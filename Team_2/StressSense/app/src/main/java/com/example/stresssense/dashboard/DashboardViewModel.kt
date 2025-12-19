package com.example.stresssense.dashboard

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.telephony.SmsManager
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.stresssense.data.local.StressPrediction
import com.example.stresssense.data.local.StressPredictionDao
import com.example.stresssense.data.local.TrustedContactDao
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val stressPredictionDao: StressPredictionDao,
    @ApplicationContext private val context: Context,
    private val trustedContactDao: TrustedContactDao
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    private val fullPredictionHistory = MutableStateFlow<List<StressPrediction>>(emptyList())

    private val dayFormat = SimpleDateFormat("EEE", Locale.getDefault())
    private val dateFormat = SimpleDateFormat("d MMM", Locale.getDefault())
    private val timestampFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())

    init {
        viewModelScope.launch {
            stressPredictionDao.getPredictionsSince(0).collect { history ->
                val sortedHistory = history.sortedByDescending { it.timestamp }
                fullPredictionHistory.value = sortedHistory
                processPredictionsIntoUiState(sortedHistory)
            }
        }
    }

    fun loadDataForDateRange(startMillis: Long, endMillis: Long) {
        val adjustedEndMillis = endMillis + TimeUnit.DAYS.toMillis(1) - 1
        val filteredData = fullPredictionHistory.value.filter {
            it.timestamp in startMillis..adjustedEndMillis
        }
        Log.i("VM_DateRange", "Filtering data from ${timestampFormat.format(Date(startMillis))} to ${timestampFormat.format(Date(adjustedEndMillis))}. Found ${filteredData.size} points.")
        processPredictionsIntoUiState(filteredData)
    }

    private fun processPredictionsIntoUiState(predictions: List<StressPrediction>) {
        if (predictions.isEmpty()) {
            _uiState.update {
                it.copy(
                    weeklyStressData = emptyList(),
                    monthlyStressData = emptyList(),
                    currentStressLevel = 0f,
                    currentStressLevelText = "Low",
                    currentStressLevelNormalized = 0f
                )
            }
            return
        }

        val sortedAscending = predictions.sortedBy { it.timestamp }
        val now = System.currentTimeMillis()

        val weekly = sortedAscending.filter { it.timestamp >= now - TimeUnit.DAYS.toMillis(7) }
        val monthly = sortedAscending.filter { it.timestamp >= now - TimeUnit.DAYS.toMillis(30) }

        val currentStressScore = sortedAscending.lastOrNull()?.stressScore ?: 0f

        _uiState.update {
            it.copy(
                currentStressLevel = currentStressScore,
                currentStressLevelText = getStressLevelText(currentStressScore),
                currentStressLevelNormalized = currentStressScore / 2.0f, // Normalize 0-2 scale to 0-1 for the gauge
                weeklyStressData = mapToGraphPoints(weekly, isWeekly = true),
                monthlyStressData = mapToGraphPoints(monthly, isWeekly = false)
            )
        }
    }

    private fun getStressLevelText(score: Float): String {
        return when {
            score >= 2.0f -> "High"
            score >= 1.0f -> "Medium"
            else -> "Low"
        }
    }

    private fun mapToGraphPoints(predictions: List<StressPrediction>, isWeekly: Boolean): List<GraphPoint> {
        if (predictions.isEmpty()) return emptyList()
        val formatter = if (isWeekly) dayFormat else dateFormat

        return predictions.map {
            // Normalize the score for the graph (0-2 scale to 0-1)
            GraphPoint(it.stressScore / 2.0f, formatter.format(Date(it.timestamp)))
        }
    }
}
