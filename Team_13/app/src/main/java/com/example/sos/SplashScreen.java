package com.example.sos;

import androidx.appcompat.app.AppCompatActivity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;

public class SplashScreen extends AppCompatActivity {

    private static final String TAG = "SplashScreen";
    private static final String PREFS_NAME = "SOSPrefs";
    private static final String KEY_USER_NAME = "user_name";
    private static final String KEY_USER_PHONE = "user_phone";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash_screen);

        Log.d(TAG, "SplashScreen opened");

        new Handler().postDelayed(() -> {
            try {
                SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
                String savedPhone = prefs.getString(KEY_USER_PHONE, null);
                String savedName = prefs.getString(KEY_USER_NAME, null);

                if (savedPhone != null || savedName != null) {
                    Log.d(TAG, "User already logged in (prefs). Redirecting to MainActivity.");
                    Intent mainIntent = new Intent(SplashScreen.this, MainActivity.class);
                    mainIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(mainIntent);
                } else {
                    Log.d(TAG, "No user found in prefs - redirecting to LoginActivity");
                    Intent loginIntent = new Intent(SplashScreen.this, LoginActivity.class);
                    loginIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(loginIntent);
                }
                finish();
            } catch (Exception e) {
                Log.e(TAG, "Error in SplashScreen: ", e);
                finish();
            }
        }, 1500); // 1500ms delay
    }
}
