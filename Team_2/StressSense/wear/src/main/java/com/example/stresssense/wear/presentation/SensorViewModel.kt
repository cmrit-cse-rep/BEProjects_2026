package com.example.stresssense.wear.presentation

import androidx.lifecycle.ViewModel
import com.google.android.gms.wearable.DataClient
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.example.stresssense.wear.service.SensorDataService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@HiltViewModel
class SensorViewModel @Inject constructor() : ViewModel(), DataClient.OnDataChangedListener {

    private val _heartRate = MutableStateFlow(0f)
    val heartRate: StateFlow<Float> = _heartRate

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        dataEvents.forEach { event ->
            if (event.type == DataEvent.TYPE_CHANGED) {
                if (event.dataItem.uri.path == SensorDataService.SENSOR_DATA_PATH) {
                    val dataMapItem = DataMapItem.fromDataItem(event.dataItem)
                    // Data is now batched (FloatArray). We display the latest value (last in array).
                    val heartRates = dataMapItem.dataMap.getFloatArray(SensorDataService.KEY_HEART_RATES)
                    if (heartRates != null && heartRates.isNotEmpty()) {
                        _heartRate.value = heartRates.last()
                    }
                }
            }
        }
    }
}