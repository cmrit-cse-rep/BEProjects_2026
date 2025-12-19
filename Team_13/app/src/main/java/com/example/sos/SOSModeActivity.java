package com.example.sos;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Bundle;
import android.os.Looper;
import android.os.Handler;
import android.telephony.SmsManager;
import android.util.Log;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationCallback;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import java.util.ArrayList;

public class SOSModeActivity extends AppCompatActivity {

    private static final String TAG = "SOSModeActivity_SAFE";
    private static final int PERM_REQUEST_CODE = 1001;
    private TextInputEditText passwordEdit;
    private MaterialButton deactivateButton;
    private boolean isRecordingServiceStarted = false;
    private FusedLocationProviderClient fusedLocationClient;
    private static final String PREFS_NAME = "SOSPrefs";
    private static final String KEY_SOS_PASSWORD = "sos_password";
    private static final String KEY_USER_NAME = "user_name";
    private static final String KEY_USER_PHONE = "user_phone";
    private LocationCallback liveLocationCallback;
    private boolean isFirstLocationSent = false;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            setContentView(R.layout.activity_sos_mode);
            passwordEdit = findViewById(R.id.passwordEdit);
            deactivateButton = findViewById(R.id.deactivateButton);
            fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
            deactivateButton.setOnClickListener(v -> {
                try {
                    String input = passwordEdit.getText() == null ? "" : passwordEdit.getText().toString().trim();
                    SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
                    String savedPassword = prefs.getString(KEY_SOS_PASSWORD, "Safe");
                    if (input.equals(savedPassword)) {
                        sendSMSDeactivation();
                        if (liveLocationCallback != null) fusedLocationClient.removeLocationUpdates(liveLocationCallback);
                        stopRecordingService();
                        Toast.makeText(this, "SOS Deactivated", Toast.LENGTH_SHORT).show();
                        finish();
                    } else {
                        passwordEdit.setError("Incorrect password");
                    }
                } catch (Exception ex) {
                    Log.e(TAG, "Error in deactivate click", ex);
                    Toast.makeText(this, "Error: " + ex.getClass().getSimpleName(), Toast.LENGTH_LONG).show();
                }
            });
            if (!hasLocationAndSmsPermissions()) {
                ActivityCompat.requestPermissions(this,
                        new String[]{ Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.SEND_SMS },
                        PERM_REQUEST_CODE);
            } else {
                sendSosImmediately();
            }
            if (!hasRecordingPermissions()) {
                ActivityCompat.requestPermissions(this,
                        new String[]{ Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO },
                        PERM_REQUEST_CODE + 1);
            } else {
                startRecordingServiceSafely();
            }
        } catch (Exception e) {
            Log.e(TAG, "Fatal error in onCreate", e);
            Toast.makeText(this, "Startup error: " + e.getClass().getSimpleName() + " (see Logcat)", Toast.LENGTH_LONG).show();
        }
    }

    private boolean hasLocationAndSmsPermissions() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                && ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasRecordingPermissions() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
                && ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    private void startRecordingServiceSafely() {
        if (isRecordingServiceStarted) return;
        try {
            Intent serviceIntent = new Intent(this, SOSRecordingService.class);
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
            isRecordingServiceStarted = true;
            Log.d(TAG, "Recording service started (safe)");
        } catch (Exception e) {
            Log.w(TAG, "Unable to start recording service", e);
        }
    }

    private void stopRecordingService() {
        try {
            if (!isRecordingServiceStarted) return;
            Intent serviceIntent = new Intent(this, SOSRecordingService.class);
            stopService(serviceIntent);
            isRecordingServiceStarted = false;
        } catch (Exception e) {
            Log.w(TAG, "Error stopping recording service", e);
        }
    }

    private void sendSosImmediately() {
        try {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                fusedLocationClient.getLastLocation()
                        .addOnSuccessListener(location -> {
                            requestCurrentLocation();
                        })
                        .addOnFailureListener(e -> {
                            requestCurrentLocation();
                        });

            } else {
                Log.w(TAG, "Location permission not granted");
                sendSMSToEmergencyContact(null);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in sendSosImmediately", e);
            sendSMSToEmergencyContact(null);
        }
    }

    private void requestCurrentLocation() {
        try {
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "Cannot request location - permission not granted");
                sendSMSToEmergencyContact(null);
                return;
            }
            LocationRequest locationRequest = LocationRequest.create();
            locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
            locationRequest.setInterval(5000);
            locationRequest.setFastestInterval(2000);
            liveLocationCallback = new LocationCallback() {
                @Override
                public void onLocationResult(LocationResult locationResult) {
                    if (locationResult != null && !locationResult.getLocations().isEmpty()) {
                        Location location = locationResult.getLocations().get(0);
                        Log.d(TAG, "Got location update: " + location.getLatitude() + "," + location.getLongitude());
                        sendSMSToEmergencyContact(location);
                    } else {
                        Log.w(TAG, "Location result is empty");
                        sendSMSToEmergencyContact(null);
                    }
                }
            };
            fusedLocationClient.requestLocationUpdates(locationRequest, liveLocationCallback, Looper.getMainLooper());
            Log.d(TAG, "Requested location updates");
        } catch (Exception e) {
            Log.e(TAG, "Error requesting current location", e);
            sendSMSToEmergencyContact(null);
        }
    }

    private void sendSMSToEmergencyContact(Location location) {
        try {
            DatabaseHelper helper = new DatabaseHelper(this);
            ArrayList<ContactModel> contacts = helper.fetchData();

            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
            String userName = prefs.getString(KEY_USER_NAME, "Someone");

            for (ContactModel contact : contacts) {
                if (contact.getNumber() == null || contact.getNumber().trim().isEmpty())
                    continue;

                if (location != null) {
                    double lat = location.getLatitude();
                    double lon = location.getLongitude();

                    // SMS 1: Send emergency alert only once
                    if (!isFirstLocationSent) {
                        String msg1 = "EMERGENCY! " + userName + " needs help.";
                        sendSmsSafe(contact.getNumber(), msg1);
                    }

                    // SMS 2: Send live location continuously (Google Maps link)
                    String msg2 = "Google Maps: https://www.google.com/maps?q=" + lat + "," + lon;
                    sendSmsSafe(contact.getNumber(), msg2);
                }
                else {
                    // Fallback only if no location
                    String msg = "EMERGENCY! " + userName + " needs help. Location unavailable.";
                    sendSmsSafe(contact.getNumber(), msg);
                }
            }
            if (!isFirstLocationSent) {
                startRecordingServiceSafely();
                runOnUiThread(() -> Toast.makeText(this, "SOS sent.", Toast.LENGTH_SHORT).show());
                isFirstLocationSent = true;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error sending SMS to emergency contacts", e);
        }
    }



    private void sendSMSDeactivation() {
        try {
            DatabaseHelper helper = new DatabaseHelper(this);
            ArrayList<ContactModel> contacts = helper.fetchData();
            if (contacts == null || contacts.isEmpty()) {
                Log.w(TAG, "No emergency contacts configured; skipping deactivation SMS");
                return;
            }
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
            String userName = prefs.getString(KEY_USER_NAME, "Someone");
            String userPhone = prefs.getString(KEY_USER_PHONE, "");
            String message = "✅ SOS Deactivated. " + userName + " (" + userPhone + ") is now safe.";
            for (ContactModel contact : contacts) {
                if (contact.getNumber() != null && !contact.getNumber().trim().isEmpty()) {
                    sendSmsSafe(contact.getNumber(), message);
                    Log.d(TAG, "Deactivation SMS sent to: " + contact.getName());
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Error sending deactivation SMS", e);
        }
    }

    private void sendSmsSafe(String phoneNumber, String message) {
        try {
            Log.d(TAG, "  → Checking SMS permission...");
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
                Log.e(TAG, "  → ❌ SEND_SMS permission missing!");
                runOnUiThread(() -> Toast.makeText(this, "SMS permission missing", Toast.LENGTH_SHORT).show());
                return;
            }
            Log.d(TAG, "  → Permission OK, sending to: " + phoneNumber);
            SmsManager smsManager = SmsManager.getDefault();
            if (message != null && message.length() > 160) {
                Log.d(TAG, "  → Message > 160 chars, splitting...");
                for (String part : smsManager.divideMessage(message)) {
                    smsManager.sendTextMessage(phoneNumber, null, part, null, null);
                    Log.d(TAG, "  → Sent part: " + part.substring(0, Math.min(30, part.length())));
                }
            } else {
                smsManager.sendTextMessage(phoneNumber, null, message, null, null);
                Log.d(TAG, "  → ✅ SMS sent!");
            }
        } catch (Exception e) {
            Log.e(TAG, "  → ❌ Failed to send SMS", e);
            e.printStackTrace();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        try {
            boolean locationGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
            boolean smsGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED;
            boolean camGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
            boolean micGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
            if (locationGranted && smsGranted) {
                sendSosImmediately();
            }
            if (camGranted && micGranted) {
                startRecordingServiceSafely();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error handling permission result", e);
        }
    }
}
