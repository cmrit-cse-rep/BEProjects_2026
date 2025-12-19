package com.example.sos;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ComponentName;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognitionService;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import java.util.ArrayList;
import java.util.List;

public class AudioCaptureService extends Service {
    private SpeechRecognizer speechRecognizer;
    private Intent recognizerIntent;
    private static final String TAG = "AudioCaptureService";
    private boolean isListening = false;
    private boolean shouldContinueListening = true;
    private boolean isProcessing = false;
    private boolean hasReceivedCallback = false;

    private static final String PREFS_NAME = "SOS_APP";
    private static final String SAFE_WORD_KEY = "safe_word";
    private static final String COUNTDOWN_PREFS = "SOS_COUNTDOWN";
    private static final String KEY_COUNTDOWN_ACTIVE = "countdown_active";
    private static final String KEY_COUNTDOWN_START_TIME = "countdown_start_time";
    private static final String KEY_COUNTDOWN_END_TIME = "countdown_end_time";

    private String safeWord = "help";

    private static final String CHANNEL_ID = "audio_capture_channel";
    private static final int NOTIFICATION_ID = 1;

    private Handler handler = new Handler(Looper.getMainLooper());

    private static final long RESTART_DELAY_MS = 2000;
    private static final long ERROR_RESTART_DELAY_MS = 3000;
    private static final long READY_TIMEOUT_MS = 10000;

    private static final long MAX_RESTART_ATTEMPTS = 50;
    private int consecutiveRestartCount = 0;
    private static final long WATCHDOG_INTERVAL_MS = 15000;
    private Runnable watchdogRunnable;
    private long lastActivityTime = 0;

    // Background countdown timer
    private CountDownTimer backgroundCountdownTimer;
    private boolean isCountdownActive = false;

    // LocalBroadcastManager for reliable communication
    private LocalBroadcastManager localBroadcastManager;

    @Override
    public void onCreate() {
        super.onCreate();

        localBroadcastManager = LocalBroadcastManager.getInstance(this);

        createNotificationChannel();
        reloadWakeWord();

        Notification notification = createNotification("Initializing voice detection...");
        startForeground(NOTIFICATION_ID, notification);

        if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            Log.e(TAG, "No microphone permission");
            stopSelf();
            return;
        }

        Log.d(TAG, "═══════════════════════════════════════");
        Log.d(TAG, "Voice Detection Service Starting");
        Log.d(TAG, "Wake word: '" + safeWord + "'");
        Log.d(TAG, "═══════════════════════════════════════");

        ComponentName recognitionService = findRecognitionService();

        handler.postDelayed(() -> {
            initializeSpeechRecognizer(recognitionService);
            if (speechRecognizer != null) {
                handler.postDelayed(this::startListening, 1000);
            }
        }, 500);

        lastActivityTime = System.currentTimeMillis();
        watchdogRunnable = new Runnable() {
            @Override
            public void run() {
                long timeSinceLastActivity = System.currentTimeMillis() - lastActivityTime;

                if (timeSinceLastActivity > 30000 && !isListening && shouldContinueListening && !isCountdownActive) {
                    Log.w(TAG, "⚠️ Watchdog: No activity for 30s, restarting recognition");
                    consecutiveRestartCount = 0;
                    initializeSpeechRecognizer(recognitionService);
                    if (speechRecognizer != null) {
                        handler.postDelayed(() -> startListening(), 1000);
                    }
                }

                if (shouldContinueListening) {
                    handler.postDelayed(this, WATCHDOG_INTERVAL_MS);
                }
            }
        };
        handler.postDelayed(watchdogRunnable, WATCHDOG_INTERVAL_MS);

        checkAndResumeCountdown();
    }

    private void checkAndResumeCountdown() {
        SharedPreferences prefs = getSharedPreferences(COUNTDOWN_PREFS, MODE_PRIVATE);
        boolean countdownActive = prefs.getBoolean(KEY_COUNTDOWN_ACTIVE, false);
        long endTime = prefs.getLong(KEY_COUNTDOWN_END_TIME, 0);

        if (countdownActive && endTime > System.currentTimeMillis()) {
            long remainingMs = endTime - System.currentTimeMillis();
            Log.d(TAG, "Resuming countdown with " + (remainingMs / 1000) + " seconds remaining");
            startBackgroundCountdown(remainingMs);
        } else if (countdownActive) {
            Log.w(TAG, "Countdown expired during service restart - triggering SOS now");
            clearCountdownState();
            triggerSOSMode();
        }
    }

    private void reloadWakeWord() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String newWakeWord = prefs.getString(SAFE_WORD_KEY, "help");
        if (!newWakeWord.equals(safeWord)) {
            Log.d(TAG, "Wake word changed from '" + safeWord + "' to '" + newWakeWord + "'");
            safeWord = newWakeWord;
        }
    }

    private ComponentName findRecognitionService() {
        try {
            PackageManager pm = getPackageManager();
            Intent serviceIntent = new Intent(RecognitionService.SERVICE_INTERFACE);
            List<ResolveInfo> services = pm.queryIntentServices(serviceIntent, 0);

            Log.d(TAG, "Found " + services.size() + " speech recognition service(s)");
            for (ResolveInfo service : services) {
                ServiceInfo serviceInfo = service.serviceInfo;
                String pkgName = serviceInfo.packageName;
                String className = serviceInfo.name;
                Log.d(TAG, "  ✓ " + pkgName + " / " + className);

                if (services.size() > 0) {
                    ComponentName component = new ComponentName(pkgName, className);
                    Log.d(TAG, "Using: " + component);
                    return component;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error finding services", e);
        }

        Log.d(TAG, "Using default system service");
        return null;
    }

    private void initializeSpeechRecognizer(ComponentName serviceComponent) {
        try {
            if (speechRecognizer != null) {
                try {
                    speechRecognizer.destroy();
                } catch (Exception e) {
                    Log.w(TAG, "Error destroying old recognizer", e);
                }
                speechRecognizer = null;
            }

            Log.d(TAG, "Creating SpeechRecognizer...");

            if (serviceComponent != null) {
                try {
                    speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this, serviceComponent);
                } catch (Exception e) {
                    Log.w(TAG, "Failed with specific component", e);
                    speechRecognizer = null;
                }
            }

            if (speechRecognizer == null) {
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
            }

            if (speechRecognizer == null) {
                Log.e(TAG, "❌ Failed to create SpeechRecognizer");
                updateNotification("Error: Speech recognition unavailable");
                stopSelf();
                return;
            }

            Log.d(TAG, "✓ SpeechRecognizer created");

            speechRecognizer.setRecognitionListener(new RecognitionListener() {
                @Override
                public void onReadyForSpeech(Bundle params) {
                    lastActivityTime = System.currentTimeMillis();
                    consecutiveRestartCount = 0;

                    Log.d(TAG, "✅ Ready - Listening for: '" + safeWord + "'");
                    hasReceivedCallback = true;
                    isListening = true;
                    isProcessing = false;
                    updateNotification("🎤 Listening for '" + safeWord + "'...");
                }

                @Override
                public void onBeginningOfSpeech() {
                    lastActivityTime = System.currentTimeMillis();
                    Log.d(TAG, "🔊 Speech detected");
                    hasReceivedCallback = true;
                    isProcessing = true;
                }

                @Override
                public void onRmsChanged(float rmsdB) {}

                @Override
                public void onBufferReceived(byte[] buffer) {}

                @Override
                public void onEndOfSpeech() {
                    Log.d(TAG, "⏹ Speech ended");
                    isListening = false;
                }

                @Override
                public void onError(int error) {
                    lastActivityTime = System.currentTimeMillis();
                    hasReceivedCallback = true;
                    isListening = false;
                    isProcessing = false;
                    String errorMsg = getErrorText(error);
                    Log.e(TAG, "❌ Error " + error + ": " + errorMsg);

                    if (error == SpeechRecognizer.ERROR_CLIENT) {
                        return;
                    }

                    if (consecutiveRestartCount >= MAX_RESTART_ATTEMPTS) {
                        Log.e(TAG, "⚠️ Max restart attempts reached. Stopping service.");
                        updateNotification("Voice detection stopped (too many restarts)");
                        stopSelf();
                        return;
                    }

                    if (error == SpeechRecognizer.ERROR_NO_MATCH ||
                            error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                        if (shouldContinueListening && !isCountdownActive) {
                            consecutiveRestartCount++;
                            handler.postDelayed(() -> {
                                if (shouldContinueListening && !isListening && !isCountdownActive) {
                                    startListening();
                                }
                            }, RESTART_DELAY_MS);
                        }
                        return;
                    }

                    if (shouldContinueListening && !isCountdownActive) {
                        consecutiveRestartCount++;
                        handler.postDelayed(() -> {
                            if (shouldContinueListening && !isListening && !isCountdownActive) {
                                reloadWakeWord();
                                initializeSpeechRecognizer(serviceComponent);
                                if (speechRecognizer != null) {
                                    startListening();
                                }
                            }
                        }, ERROR_RESTART_DELAY_MS);
                    }
                }

                @Override
                public void onResults(Bundle results) {
                    lastActivityTime = System.currentTimeMillis();
                    consecutiveRestartCount = 0;
                    hasReceivedCallback = true;
                    isListening = false;
                    isProcessing = false;
                    ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);

                    reloadWakeWord();

                    if (matches != null && !matches.isEmpty()) {
                        Log.d(TAG, "📝 Recognized " + matches.size() + " result(s):");
                        for (int i = 0; i < matches.size(); i++) {
                            String result = matches.get(i);
                            Log.d(TAG, "  [" + i + "] '" + result + "'");
                            if (result.toLowerCase().contains(safeWord.toLowerCase())) {
                                Log.d(TAG, "  ⭐⭐⭐ WAKE WORD MATCH! ⭐⭐⭐");
                                safeWordDetected(result);
                                return;
                            }
                        }
                    }

                    if (shouldContinueListening && !isCountdownActive) {
                        handler.postDelayed(() -> {
                            if (shouldContinueListening && !isListening && !isCountdownActive) {
                                startListening();
                            }
                        }, RESTART_DELAY_MS);
                    }
                }

                @Override
                public void onPartialResults(Bundle partialResults) {
                    hasReceivedCallback = true;
                    ArrayList<String> matches = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);

                    reloadWakeWord();

                    if (matches != null && !matches.isEmpty()) {
                        String partial = matches.get(0);
                        Log.d(TAG, "🔤 Partial: '" + partial + "'");
                        if (partial.toLowerCase().contains(safeWord.toLowerCase())) {
                            Log.d(TAG, "  ⭐ PARTIAL MATCH!");
                            safeWordDetected(partial);
                        }
                    }
                }

                @Override
                public void onEvent(int eventType, Bundle params) {}
            });

            recognizerIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                    RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            recognizerIntent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getPackageName());
            recognizerIntent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
            recognizerIntent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);

            Log.d(TAG, "✓ Recognizer configured");

        } catch (Exception e) {
            Log.e(TAG, "❌ Exception initializing", e);
        }
    }

    private void startListening() {
        if (speechRecognizer == null || isListening || isProcessing || isCountdownActive) {
            return;
        }

        try {
            Log.d(TAG, "🎙 Starting listener for '" + safeWord + "'...");

            hasReceivedCallback = false;
            updateNotification("Activating microphone...");

            speechRecognizer.startListening(recognizerIntent);
            isListening = true;

            handler.postDelayed(() -> {
                if (!hasReceivedCallback) {
                    Log.e(TAG, "⚠️ No response from speech service");
                    updateNotification("⚠️ Service not responding");

                    try {
                        speechRecognizer.cancel();
                    } catch (Exception e) {
                        Log.e(TAG, "Error canceling", e);
                    }
                    isListening = false;
                }
            }, READY_TIMEOUT_MS);

        } catch (Exception e) {
            Log.e(TAG, "❌ Exception starting", e);
            isListening = false;
        }
    }

    private void safeWordDetected(String detectedPhrase) {
        if (isCountdownActive) {
            Log.d(TAG, "Countdown already active, ignoring detection");
            return;
        }

        Log.i(TAG, "═══════════════════════════════════════");
        Log.i(TAG, "🚨 WAKE WORD DETECTED!");
        Log.i(TAG, "Detected: '" + detectedPhrase + "'");
        Log.i(TAG, "Wake word: '" + safeWord + "'");
        Log.i(TAG, "═══════════════════════════════════════");

        try {
            if (speechRecognizer != null) {
                speechRecognizer.cancel();
            }
            isListening = false;
        } catch (Exception e) {
            Log.e(TAG, "Error stopping recognizer", e);
        }

        startBackgroundCountdown(10000);

        // Use LocalBroadcastManager
        Intent broadcastIntent = new Intent("COUNTDOWN_STARTED");
        broadcastIntent.putExtra("detected_phrase", detectedPhrase);
        broadcastIntent.putExtra("wake_word", safeWord);
        localBroadcastManager.sendBroadcast(broadcastIntent);

        try {
            Intent intent = new Intent(this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK |
                    Intent.FLAG_ACTIVITY_CLEAR_TOP |
                    Intent.FLAG_ACTIVITY_SINGLE_TOP);
            intent.putExtra("wake_word_triggered", true);
            intent.putExtra("detected_phrase", detectedPhrase);
            startActivity(intent);
            Log.d(TAG, "✓ MainActivity launched");
        } catch (Exception e) {
            Log.e(TAG, "❌ Error launching MainActivity", e);
        }
    }

    private void startBackgroundCountdown(long durationMs) {
        isCountdownActive = true;

        long startTime = System.currentTimeMillis();
        long endTime = startTime + durationMs;

        SharedPreferences prefs = getSharedPreferences(COUNTDOWN_PREFS, MODE_PRIVATE);
        prefs.edit()
                .putBoolean(KEY_COUNTDOWN_ACTIVE, true)
                .putLong(KEY_COUNTDOWN_START_TIME, startTime)
                .putLong(KEY_COUNTDOWN_END_TIME, endTime)
                .apply();

        Log.d(TAG, "🕐 Starting background countdown: " + (durationMs / 1000) + " seconds");
        updateNotification("🚨 SOS Countdown: " + (durationMs / 1000) + "s");

        backgroundCountdownTimer = new CountDownTimer(durationMs, 1000) {
            @Override
            public void onTick(long millisUntilFinished) {
                long secondsRemaining = millisUntilFinished / 1000;
                Log.d(TAG, "⏱ Countdown: " + secondsRemaining + " seconds");
                updateNotification("🚨 SOS Countdown: " + secondsRemaining + "s");

                Intent tickIntent = new Intent("COUNTDOWN_TICK");
                tickIntent.putExtra("seconds_remaining", secondsRemaining);
                localBroadcastManager.sendBroadcast(tickIntent);
            }

            @Override
            public void onFinish() {
                Log.i(TAG, "⏰ COUNTDOWN FINISHED - TRIGGERING SOS MODE");
                clearCountdownState();
                triggerSOSMode();
            }
        };

        backgroundCountdownTimer.start();
    }
    public void startCountdown(int seconds) {
        if (isCountdownActive) return;
        startBackgroundCountdown(seconds * 1000L);
    }


    public void cancelCountdown() {
        Log.d(TAG, "✓ Countdown cancelled by user");

        if (backgroundCountdownTimer != null) {
            backgroundCountdownTimer.cancel();
            backgroundCountdownTimer = null;
        }

        isCountdownActive = false;
        clearCountdownState();

        updateNotification("✓ SOS Cancelled - Listening for '" + safeWord + "'...");

        Intent cancelIntent = new Intent("COUNTDOWN_CANCELLED");
        localBroadcastManager.sendBroadcast(cancelIntent);

        handler.postDelayed(() -> {
            if (shouldContinueListening && !isListening) {
                ComponentName recognitionService = findRecognitionService();
                initializeSpeechRecognizer(recognitionService);
                if (speechRecognizer != null) {
                    startListening();
                }
            }
        }, 2000);
    }

    private void clearCountdownState() {
        SharedPreferences prefs = getSharedPreferences(COUNTDOWN_PREFS, MODE_PRIVATE);
        prefs.edit()
                .putBoolean(KEY_COUNTDOWN_ACTIVE, false)
                .remove(KEY_COUNTDOWN_START_TIME)
                .remove(KEY_COUNTDOWN_END_TIME)
                .apply();

        isCountdownActive = false;
    }

    private void triggerSOSMode() {
        updateNotification("🚨 Activating SOS Mode...");

        Intent sosIntent = new Intent("SOS_TRIGGERED");
        localBroadcastManager.sendBroadcast(sosIntent);

        try {
            Intent intent = new Intent(this, SOSModeActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(intent);
            Log.d(TAG, "✓ SOSModeActivity launched");
        } catch (Exception e) {
            Log.e(TAG, "❌ Error launching SOSModeActivity", e);
        }

        handler.postDelayed(() -> {
            isCountdownActive = false;
            if (shouldContinueListening && !isListening) {
                updateNotification("Listening for '" + safeWord + "'...");
                ComponentName recognitionService = findRecognitionService();
                initializeSpeechRecognizer(recognitionService);
                if (speechRecognizer != null) {
                    startListening();
                }
            }
        }, 5000);
    }

    private String getErrorText(int errorCode) {
        switch (errorCode) {
            case SpeechRecognizer.ERROR_AUDIO: return "Audio error";
            case SpeechRecognizer.ERROR_CLIENT: return "Client error";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "No permissions";
            case SpeechRecognizer.ERROR_NETWORK: return "Network error";
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "Network timeout";
            case SpeechRecognizer.ERROR_NO_MATCH: return "No match";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: return "Busy";
            case SpeechRecognizer.ERROR_SERVER: return "Server error";
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "No speech";
            default: return "Error " + errorCode;
        }
    }

    private Notification createNotification(String text) {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0,
                notificationIntent, PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("SOS Voice Detection")
                .setContentText(text)
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build();
    }

    private void updateNotification(String text) {
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, createNotification(text));
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Voice Detection",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return new CountdownBinder();
    }

    public class CountdownBinder extends android.os.Binder {
        public AudioCaptureService getService() {
            return AudioCaptureService.this;
        }
    }

    public boolean isCountdownActive() {
        return isCountdownActive;
    }

    public long getRemainingSeconds() {
        if (!isCountdownActive) return 0;

        SharedPreferences prefs = getSharedPreferences(COUNTDOWN_PREFS, MODE_PRIVATE);
        long endTime = prefs.getLong(KEY_COUNTDOWN_END_TIME, 0);
        long remaining = endTime - System.currentTimeMillis();

        return Math.max(0, remaining / 1000);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Service destroyed");
        shouldContinueListening = false;

        if (backgroundCountdownTimer != null) {
            backgroundCountdownTimer.cancel();
        }

        handler.removeCallbacksAndMessages(null);

        if (speechRecognizer != null) {
            try {
                speechRecognizer.destroy();
            } catch (Exception e) {
                Log.e(TAG, "Error destroying", e);
            }
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "onStartCommand called");

        if (intent != null && intent.getBooleanExtra("cancel_countdown", false)) {
            cancelCountdown();
            return START_STICKY;
        }

        if (flags == START_FLAG_REDELIVERY || flags == START_FLAG_RETRY) {
            Log.d(TAG, "Service restarted by system, reinitializing...");
            shouldContinueListening = true;
            consecutiveRestartCount = 0;

            handler.postDelayed(() -> {
                checkAndResumeCountdown();

                if (!isCountdownActive) {
                    initializeSpeechRecognizer(findRecognitionService());
                    if (speechRecognizer != null) {
                        handler.postDelayed(this::startListening, 1000);
                    }
                }
            }, 1000);
        }

        return START_STICKY;
    }
}
