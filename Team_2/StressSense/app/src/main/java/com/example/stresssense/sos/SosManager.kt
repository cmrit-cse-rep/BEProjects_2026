package com.example.stresssense.sos

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.telephony.SmsManager
import androidx.core.content.ContextCompat
import com.example.stresssense.data.UserPreferencesRepository
import com.example.stresssense.data.local.TrustedContactDao
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SosManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val trustedContactDao: TrustedContactDao,
    private val userPreferencesRepository: UserPreferencesRepository
) {
    private val fusedLocationClient: FusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(context)

    @SuppressLint("MissingPermission")
    suspend fun sendSosMessages(emergencyMessage: String) {
        if (!hasSmsPermission() || !hasLocationPermission()) {
            // This should be checked before calling, but as a safeguard.
            return
        }

        val contacts = trustedContactDao.getAllContacts().first()
        if (contacts.isEmpty()) return

        val userPrefs = userPreferencesRepository.userPreferences.firstOrNull()
        val name = userPrefs?.userName?.takeIf { it.isNotBlank() } ?: "Unknown user"

        val timestamp = java.text.SimpleDateFormat(
            "yyyy-MM-dd HH:mm:ss",
            java.util.Locale.getDefault()
        ).format(java.util.Date())

        val location: Location? = try {
            fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null).await()
        } catch (e: Exception) {
            null
        }

        val baseMessage = buildString {
            append("Emergency alert from ").append(name).append(". ")
            append(emergencyMessage)
            append(" Time: ").append(timestamp).append(". ")
        }

        val message = if (location != null) {
            baseMessage + "Location: https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}"
        } else {
            baseMessage + "Location could not be determined."
        }

        val smsManager = context.getSystemService(SmsManager::class.java)
        contacts.forEach { contact ->
            smsManager.sendTextMessage(contact.phoneNumber, null, message, null, null)
        }
    }

    private fun hasSmsPermission(): Boolean {
        return ContextCompat.checkSelfPermission(context, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED
    }

    private fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
    }
}