package com.example.sos;

import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

public class FullScreenAlertActivity extends AppCompatActivity {

    private ImageView dangerIcon;
    private TextView dangerMessage;
    private Button openAppButton;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        // --- Always show over lockscreen and wake the device ---
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) km.requestDismissKeyguard(this, null);
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                            | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            );
        }

        super.onCreate(savedInstanceState);
        setContentView(R.layout.sos_notification);

        // --- Ignore this alert if it's from myself (to prevent sender playback) ---
        SharedPreferences prefs = getSharedPreferences("FCM", MODE_PRIVATE);
        String myToken = prefs.getString("fcm_token", null);
        String targetToken = null;

        if (getIntent() != null && getIntent().getExtras() != null) {
            targetToken = getIntent().getStringExtra("targetToken");
        }

        // If this device's token matches the alert target, ignore showing UI
        if (myToken != null && myToken.equals(targetToken)) {
            finish();
            return;
        }

        // --- Bind UI views ---
        dangerIcon = findViewById(R.id.dangerIcon);
        dangerMessage = findViewById(R.id.dangerMessage);
        openAppButton = findViewById(R.id.openAppButton);

        // --- Extract and display message text ---
        String msg = getIntent().getStringExtra("body");
        if (msg == null || msg.isEmpty()) msg = getIntent().getStringExtra("title");
        if (msg != null && !msg.isEmpty()) dangerMessage.setText(msg);

        // --- Button opens EmergencyAlertActivity ---
        openAppButton.setOnClickListener(v -> {
            Intent i = new Intent(FullScreenAlertActivity.this, EmergencyAlertActivity.class);

            // Pass through any extra info (lat/lng/phone/title/body/etc.)
            if (getIntent() != null && getIntent().getExtras() != null) {
                i.putExtras(getIntent().getExtras());
            }

            // Make EmergencyAlertActivity the only activity in task stack
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(i);
            finish();
        });
    }

    // Handle case where activity reused by the system with new intent
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);

        // Update displayed message if new data comes in
        String msg = intent.getStringExtra("body");
        if (msg == null || msg.isEmpty()) msg = intent.getStringExtra("title");
        if (msg != null && !msg.isEmpty() && dangerMessage != null) {
            dangerMessage.setText(msg);
        }
    }
}
