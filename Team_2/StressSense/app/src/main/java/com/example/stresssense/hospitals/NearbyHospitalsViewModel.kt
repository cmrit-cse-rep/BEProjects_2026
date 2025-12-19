package com.example.stresssense.hospitals

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.lifecycle.ViewModel
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

@HiltViewModel
class NearbyHospitalsViewModel @Inject constructor(
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val fusedLocationClient: FusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(context)

    @SuppressLint("MissingPermission")
    suspend fun findHospitals() {
        try {
            // Fetch current location
            val location = fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null).await()
            val lat = location?.latitude ?: 0.0
            val lon = location?.longitude ?: 0.0

            // Create the map intent
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("geo:$lat,$lon?q=hospitals")).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            
            // Start the activity
            context.startActivity(intent)
        } catch (e: Exception) {
            // Handle exceptions, e.g., location services are disabled
            e.printStackTrace()
            // You could expose an error state to the UI here
        }
    }
}