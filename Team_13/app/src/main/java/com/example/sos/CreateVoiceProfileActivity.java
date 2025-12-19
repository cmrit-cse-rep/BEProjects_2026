package com.example.sos;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.android.material.textfield.TextInputEditText;

public class CreateVoiceProfileActivity extends AppCompatActivity {

    private static final String TAG = "CreateVoiceProfile";
    private static final int REQUEST_RECORD_AUDIO = 200;

    private TextInputEditText wakewordInput;
    private Button btnStartEnrollment;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_create_voice_profile);

        wakewordInput = findViewById(R.id.wakewordInput);
        btnStartEnrollment = findViewById(R.id.btnStartEnrollment);

        // Load existing wake word if any
        SharedPreferences prefs = getSharedPreferences("SOS_APP", Context.MODE_PRIVATE);
        String existingWakeWord = prefs.getString("safe_word", "help");
        wakewordInput.setText(existingWakeWord);

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.RECORD_AUDIO},
                    REQUEST_RECORD_AUDIO);
        }

        btnStartEnrollment.setOnClickListener(v -> {
            String wakeWord = wakewordInput.getText() != null ?
                    wakewordInput.getText().toString().trim() : "";

            if (wakeWord.isEmpty()) {
                Toast.makeText(this, "Please enter a wake word", Toast.LENGTH_SHORT).show();
                wakewordInput.setError("Wake word cannot be empty");
                return;
            }

            if (wakeWord.length() < 2) {
                Toast.makeText(this, "Wake word too short (minimum 2 characters)", Toast.LENGTH_SHORT).show();
                wakewordInput.setError("Too short");
                return;
            }

            // Save the wake word
            prefs.edit().putString("safe_word", wakeWord).apply();

            Log.d(TAG, "Wake word saved: '" + wakeWord + "'");
            Toast.makeText(this, "Wake word '" + wakeWord + "' set!", Toast.LENGTH_SHORT).show();

            // Start the voice detection service
            Log.d(TAG, "Starting AudioCaptureService...");
            Intent serviceIntent = new Intent(this, AudioCaptureService.class);
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }

            Toast.makeText(this, "Voice detection started!\nSay '" + wakeWord + "' to trigger.", Toast.LENGTH_LONG).show();

            finish();
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_RECORD_AUDIO &&
                (grantResults.length == 0 || grantResults[0] != PackageManager.PERMISSION_GRANTED)) {
            Toast.makeText(this, "Microphone permission is required for voice detection.", Toast.LENGTH_LONG).show();
            finish();
        }
    }
}
