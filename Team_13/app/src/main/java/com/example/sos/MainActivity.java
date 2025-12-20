package com.example.sos;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.ServiceConnection;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "MainActivity";
    private static final int REQUEST_ALL_PERMS = 2000;
    private static final String[] CORE_PERMS = new String[] {
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.SEND_SMS,
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
    };

    private ImageButton hamburgerButton;
    private TextView greetingText;
    private View sosButton;

    private static final String PREFS_NAME = "SOSPrefs";
    private static final String KEY_USER_NAME = "user_name";
    private static final String KEY_USER_PHONE = "user_phone";
    private static final String KEY_SOS_PASSWORD = "sos_password";

    private AudioCaptureService audioService;
    private boolean isServiceBound = false;
    private BroadcastReceiver countdownReceiver;
    private AlertDialog currentDialog;
    private TextView currentTimerText;
    private LocalBroadcastManager localBroadcastManager;

    private ServiceConnection serviceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            Log.d(TAG, "Service connected");
            AudioCaptureService.CountdownBinder binder = (AudioCaptureService.CountdownBinder) service;
            audioService = binder.getService();
            isServiceBound = true;

            if (audioService.isCountdownActive()) {
                long remaining = audioService.getRemainingSeconds();
                Log.d(TAG, "Countdown already active with " + remaining + " seconds remaining");
                showSOSPopupDialog((int) remaining);
            }
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            Log.d(TAG, "Service disconnected");
            audioService = null;
            isServiceBound = false;
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String savedPhone = prefs.getString(KEY_USER_PHONE, null);
        String savedName = prefs.getString(KEY_USER_NAME, null);
        if (savedPhone == null && savedName == null) {
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return;
        }

        setContentView(R.layout.activity_main);

        localBroadcastManager = LocalBroadcastManager.getInstance(this);

        ensureAllRuntimePermissions();

        hamburgerButton = findViewById(R.id.hamburgerButton);
        greetingText = findViewById(R.id.greetingText);
        sosButton = findViewById(R.id.sosButton);

        setupListeners();
        updateGreeting();

        Intent serviceIntent = new Intent(this, AudioCaptureService.class);
        bindService(serviceIntent, serviceConnection, Context.BIND_AUTO_CREATE);

        registerCountdownReceiver();

        handleWakeWordIntent(getIntent());
    }

    private void registerCountdownReceiver() {
        countdownReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();

                if ("COUNTDOWN_STARTED".equals(action)) {
                    Log.d(TAG, "Received COUNTDOWN_STARTED broadcast");
                    String detectedPhrase = intent.getStringExtra("detected_phrase");
                    String wakeWord = intent.getStringExtra("wake_word");

                    if (currentDialog == null || !currentDialog.isShowing()) {
                        showSOSPopupDialog(10);
                    }

                } else if ("COUNTDOWN_TICK".equals(action)) {
                    long secondsRemaining = intent.getLongExtra("seconds_remaining", 0);
                    Log.d(TAG, "Countdown tick: " + secondsRemaining);

                    if (currentTimerText != null) {
                        currentTimerText.setText(String.valueOf(secondsRemaining));
                    }

                } else if ("COUNTDOWN_CANCELLED".equals(action)) {
                    Log.d(TAG, "Received COUNTDOWN_CANCELLED broadcast");

                    if (currentDialog != null && currentDialog.isShowing()) {
                        currentDialog.dismiss();
                        currentDialog = null;
                    }

                    Toast.makeText(MainActivity.this, "SOS Cancelled", Toast.LENGTH_SHORT).show();

                } else if ("SOS_TRIGGERED".equals(action)) {
                    Log.d(TAG, "Received SOS_TRIGGERED broadcast");

                    if (currentDialog != null && currentDialog.isShowing()) {
                        currentDialog.dismiss();
                        currentDialog = null;
                    }
                }
            }
        };

        // Register with LocalBroadcastManager - no flags needed!
        IntentFilter filter = new IntentFilter();
        filter.addAction("COUNTDOWN_STARTED");
        filter.addAction("COUNTDOWN_TICK");
        filter.addAction("COUNTDOWN_CANCELLED");
        filter.addAction("SOS_TRIGGERED");

        localBroadcastManager.registerReceiver(countdownReceiver, filter);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleWakeWordIntent(intent);
    }

    private void handleWakeWordIntent(Intent intent) {
        if (intent != null && intent.getBooleanExtra("wake_word_triggered", false)) {
            String detectedPhrase = intent.getStringExtra("detected_phrase");

            SharedPreferences sosPrefs = getSharedPreferences("SOS_APP", MODE_PRIVATE);
            String wakeWord = sosPrefs.getString("safe_word", "help");

            Log.i(TAG, "🚨 Wake word triggered! Detected: '" + detectedPhrase + "'");

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                setShowWhenLocked(true);
                setTurnScreenOn(true);
                getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            } else {
                getWindow().addFlags(
                        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                );
            }

            android.app.KeyguardManager keyguardManager =
                    (android.app.KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (keyguardManager != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                keyguardManager.requestDismissKeyguard(this, null);
            }

            Toast.makeText(this, "🎤 Wake word '" + wakeWord + "' detected!", Toast.LENGTH_LONG).show();

            if (ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS)
                    != PackageManager.PERMISSION_GRANTED
                    || ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                    != PackageManager.PERMISSION_GRANTED) {

                ActivityCompat.requestPermissions(this,
                        new String[]{ Manifest.permission.SEND_SMS, Manifest.permission.ACCESS_FINE_LOCATION },
                        REQUEST_ALL_PERMS);
                getIntent().putExtra("pending_wake_word_sos", true);
                return;
            }

            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                intent.removeExtra("wake_word_triggered");

                if (isServiceBound && audioService != null && audioService.isCountdownActive()) {
                    long remaining = audioService.getRemainingSeconds();
                    showSOSPopupDialog((int) remaining);
                } else {
                    showSOSPopupDialog(10);
                }
            }, 300);
        }
    }

    private void setupListeners() {
        if (hamburgerButton != null) {
            hamburgerButton.setOnClickListener(view -> {
                Intent menuIntent = new Intent(MainActivity.this, MenuActivity.class);
                startActivity(menuIntent);
                overridePendingTransition(R.anim.menu_enter_left, R.anim.no_animation);
            });
        }

        if (sosButton != null) {
            sosButton.setClickable(true);
            sosButton.bringToFront();
            sosButton.invalidate();

            sosButton.setOnClickListener(v -> {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS)
                        != PackageManager.PERMISSION_GRANTED
                        || ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                        != PackageManager.PERMISSION_GRANTED) {

                    ActivityCompat.requestPermissions(this,
                            new String[]{ Manifest.permission.SEND_SMS, Manifest.permission.ACCESS_FINE_LOCATION },
                            REQUEST_ALL_PERMS);
                    return;
                }

                // Use the bound service method directly to start the countdown.
                if (isServiceBound && audioService != null) {
                    audioService.startCountdown(10); // Add this method if not present!
                }

                showSOSPopupDialog(10);
            });

        }
    }

    private void showSOSPopupDialog(int startSeconds) {
        if (currentDialog != null && currentDialog.isShowing()) {
            Log.d(TAG, "Dialog already showing");
            return;
        }

        Log.d(TAG, "═══════════════════════════════");
        Log.d(TAG, "showSOSPopupDialog() called with " + startSeconds + " seconds");
        Log.d(TAG, "═══════════════════════════════");

        View popupView = getLayoutInflater().inflate(R.layout.sos_popup, null);

        currentTimerText = popupView.findViewById(R.id.timerText);
        TextInputEditText passwordEdit = popupView.findViewById(R.id.passwordEdit);
        MaterialButton deactivateButton = popupView.findViewById(R.id.deactivateButton);

        currentTimerText.setText(String.valueOf(startSeconds));

        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setView(popupView);
        builder.setCancelable(false);

        currentDialog = builder.create();

        passwordEdit.postDelayed(() -> {
            passwordEdit.requestFocus();
            android.view.inputmethod.InputMethodManager imm =
                    (android.view.inputmethod.InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
            if (imm != null) {
                imm.showSoftInput(passwordEdit, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT);
            }
        }, 100);

        deactivateButton.setOnClickListener(v -> {
            String input = passwordEdit.getText() == null ? "" : passwordEdit.getText().toString().trim();
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
            String savedPassword = prefs.getString(KEY_SOS_PASSWORD, "Safe");

            if (input.equals(savedPassword)) {
                Log.d(TAG, "✓✓✓ CORRECT PASSWORD - CANCELLING ✓✓✓");

                if (isServiceBound && audioService != null) {
                    audioService.cancelCountdown();
                } else {
                    Intent cancelIntent = new Intent(this, AudioCaptureService.class);
                    cancelIntent.putExtra("cancel_countdown", true);
                    startService(cancelIntent);
                }

                if (currentDialog != null && currentDialog.isShowing()) {
                    currentDialog.dismiss();
                    currentDialog = null;
                }

                getWindow().clearFlags(
                        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                );

                Toast.makeText(MainActivity.this, "SOS Cancelled", Toast.LENGTH_SHORT).show();

            } else {
                Log.w(TAG, "✗✗✗ INCORRECT PASSWORD ✗✗✗");
                passwordEdit.setError("Incorrect password");
                passwordEdit.setText("");
                passwordEdit.requestFocus();
                Toast.makeText(MainActivity.this, "Wrong password - try again", Toast.LENGTH_SHORT).show();
            }
        });

        currentDialog.show();
        Log.d(TAG, "Dialog shown and synced with background countdown");
    }

    private void ensureAllRuntimePermissions() {
        List<String> needed = new ArrayList<>();
        for (String p : CORE_PERMS) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                needed.add(p);
            }
        }
        if (Build.VERSION.SDK_INT >= 33 &&
                ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                        != PackageManager.PERMISSION_GRANTED) {
            needed.add(Manifest.permission.POST_NOTIFICATIONS);
        }
        if (!needed.isEmpty()) {
            ActivityCompat.requestPermissions(this, needed.toArray(new String[0]), REQUEST_ALL_PERMS);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        updateGreeting();
        if (sosButton != null) {
            sosButton.bringToFront();
            sosButton.invalidate();
        }

        if (isServiceBound && audioService != null && audioService.isCountdownActive()) {
            if (currentDialog == null || !currentDialog.isShowing()) {
                long remaining = audioService.getRemainingSeconds();
                showSOSPopupDialog((int) remaining);
            }
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        if (countdownReceiver != null) {
            try {
                localBroadcastManager.unregisterReceiver(countdownReceiver);
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering receiver", e);
            }
        }

        if (isServiceBound) {
            unbindService(serviceConnection);
            isServiceBound = false;
        }
    }

    private void updateGreeting() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String userName = prefs.getString(KEY_USER_NAME, null);
        String userPhone = prefs.getString(KEY_USER_PHONE, null);
        String greeting = "Hi " + (userName != null ? userName : (userPhone != null ? userPhone : "User"));
        if (greetingText != null) {
            greetingText.setText(greeting);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == REQUEST_ALL_PERMS) {
            boolean smsGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED;
            boolean locGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;

            if (smsGranted && locGranted) {
                if (getIntent().getBooleanExtra("pending_wake_word_sos", false)) {
                    getIntent().removeExtra("pending_wake_word_sos");
                    new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                        showSOSPopupDialog(10);
                    }, 300);
                } else {
                    showSOSPopupDialog(10);
                }
            } else {
                Toast.makeText(this, "Cannot start SOS without required permissions", Toast.LENGTH_LONG).show();
            }
        }
    }
}
