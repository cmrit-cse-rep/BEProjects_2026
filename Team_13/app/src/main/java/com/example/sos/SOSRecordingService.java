package com.example.sos;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.graphics.SurfaceTexture;
import android.hardware.Camera;
import android.media.CamcorderProfile;
import android.media.MediaRecorder;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import android.os.Environment;


import androidx.annotation.Nullable;
import androidx.core.app.ServiceCompat;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class SOSRecordingService extends Service {

    private static final String TAG = "SOSRecordingService";
    private static final String NOTIFICATION_CHANNEL_ID = "sos_recording_channel";
    private static final int NOTIFICATION_ID = 101;

    private MediaRecorder mediaRecorder;
    private File outputFile;
    private boolean isRecording = false;
    private Camera camera;
    private SurfaceTexture surfaceTexture;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Service onCreate");

        startForegroundWithNotification();

        // Start recording in background thread
        new Thread(this::initializeAndRecord).start();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "onStartCommand called");
        return START_STICKY;
    }

    /**
     * Create and display the foreground notification
     */
    private void startForegroundWithNotification() {
        Log.d(TAG, "Starting foreground with notification");

        // Create notification channel for Android O+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    NOTIFICATION_CHANNEL_ID,
                    "SOS Recording Service",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Recording video for SOS mode");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }

        // Build notification
        Notification notification = new Notification.Builder(this, NOTIFICATION_CHANNEL_ID)
                .setContentTitle("SOS Video Recording")
                .setContentText("SOS mode is active: Video recording in background")
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .setOngoing(true)
                .build();

        // Start foreground service with proper service type for Android 12+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                ServiceCompat.startForeground(this, NOTIFICATION_ID, notification,
                        android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA);
            } catch (Exception e) {
                Log.e(TAG, "Error starting foreground service with type", e);
                startForeground(NOTIFICATION_ID, notification);
            }
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    /**
     * Initialize and start audio + video recording
     * CRITICAL: Follow proper method call order for MediaRecorder
     */
    private void initializeAndRecord() {
        try {
            Log.d(TAG, "Initializing audio + video recording...");

            outputFile = getOutputMediaFile();
            if (outputFile == null) {
                Log.e(TAG, "Failed to create output file");
                stopSelf();
                return;
            }

            Log.d(TAG, "Output file: " + outputFile.getAbsolutePath());

            // Open back camera
            try {
                camera = Camera.open(0);
                Log.d(TAG, "Camera opened successfully");
            } catch (Exception e) {
                Log.e(TAG, "Failed to open camera, recording audio only", e);
                recordAudioOnly();
                return;
            }

            // Create dummy SurfaceTexture for camera preview (offscreen)
            surfaceTexture = new SurfaceTexture(100);
            camera.setPreviewTexture(surfaceTexture);
            camera.startPreview();
            Log.d(TAG, "Camera preview started");

            // Create MediaRecorder
            mediaRecorder = new MediaRecorder();

            // CRITICAL: setCamera MUST be called FIRST, immediately after instantiation
            camera.unlock();
            mediaRecorder.setCamera(camera);
            Log.d(TAG, "Camera set to MediaRecorder");

            // CRITICAL: Set audio and video sources AFTER setCamera
            mediaRecorder.setAudioSource(MediaRecorder.AudioSource.CAMCORDER);
            mediaRecorder.setVideoSource(MediaRecorder.VideoSource.CAMERA);
            Log.d(TAG, "Audio and video sources set");

            // Set output format using CamcorderProfile for best compatibility
            try {
                CamcorderProfile profile = CamcorderProfile.get(CamcorderProfile.QUALITY_HIGH);
                mediaRecorder.setProfile(profile);
                Log.d(TAG, "CamcorderProfile applied");
            } catch (Exception e) {
                Log.e(TAG, "Failed to set CamcorderProfile, setting manually", e);
                mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
                mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
                mediaRecorder.setVideoEncoder(MediaRecorder.VideoEncoder.H264);
                mediaRecorder.setVideoSize(1280, 720);
                mediaRecorder.setVideoFrameRate(30);
                mediaRecorder.setVideoEncodingBitRate(5000000);
                mediaRecorder.setAudioSamplingRate(44100);
                mediaRecorder.setAudioChannels(2);
                mediaRecorder.setAudioEncodingBitRate(128000);
            }

            // Set output file
            mediaRecorder.setOutputFile(outputFile.getAbsolutePath());
            Log.d(TAG, "Output file set: " + outputFile.getAbsolutePath());

            // DO NOT USE setPreviewDisplay() - it's not needed with SurfaceTexture

            // Set orientation hint
            mediaRecorder.setOrientationHint(90);

            // Prepare
            mediaRecorder.prepare();
            Log.d(TAG, "MediaRecorder prepared");

            // Start recording
            mediaRecorder.start();
            isRecording = true;
            Log.d(TAG, "✓ Video + Audio Recording STARTED successfully");

        } catch (Exception e) {
            Log.e(TAG, "Exception during video recording setup: " + e.getMessage(), e);
            cleanupVideoResources();
            recordAudioOnly();
        }
    }
    /**
     * Clean up video-related resources
     */
    private void cleanupVideoResources() {
        if (mediaRecorder != null) {
            try {
                if (isRecording) {
                    mediaRecorder.stop();
                    isRecording = false;
                }
                mediaRecorder.release();
                Log.d(TAG, "MediaRecorder released");
            } catch (Exception ex) {
                Log.e(TAG, "Error releasing mediaRecorder: " + ex.getMessage(), ex);
            }
            mediaRecorder = null;
        }

        if (camera != null) {
            try {
                camera.stopPreview();
                camera.lock();
                camera.release();
                Log.d(TAG, "Camera released");
            } catch (Exception ex) {
                Log.e(TAG, "Error releasing camera: " + ex.getMessage(), ex);
            }
            camera = null;
        }

        if (surfaceTexture != null) {
            try {
                surfaceTexture.release();
                Log.d(TAG, "SurfaceTexture released");
            } catch (Exception ex) {
                Log.e(TAG, "Error releasing surface texture: " + ex.getMessage(), ex);
            }
            surfaceTexture = null;
        }
    }

    /**
     * Fallback: Record audio only if video fails
     */
    private void recordAudioOnly() {
        try {
            Log.d(TAG, "Falling back to audio-only recording...");

            mediaRecorder = new MediaRecorder();
            mediaRecorder.setAudioSource(MediaRecorder.AudioSource.CAMCORDER);
            mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            mediaRecorder.setAudioSamplingRate(44100);
            mediaRecorder.setAudioChannels(2);
            mediaRecorder.setAudioEncodingBitRate(128000);

            mediaRecorder.setOutputFile(outputFile.getAbsolutePath());

            mediaRecorder.prepare();
            Log.d(TAG, "MediaRecorder prepared for audio only");

            mediaRecorder.start();
            isRecording = true;
            Log.d(TAG, "✓ Audio-only Recording STARTED");

        } catch (Exception e) {
            Log.e(TAG, "Even audio-only recording failed: " + e.getMessage(), e);
            cleanup();
            stopSelf();
        }
    }

    /**
     * Create output file in cache directory
     */
    private File getOutputMediaFile() {
        // Save to PUBLIC Downloads folder - ACCESSIBLE!
        File downloadsDir = Environment.getExternalStoragePublicDirectory(
                Environment.DIRECTORY_DOWNLOADS
        );

        File mediaStorageDir = new File(downloadsDir, "SOS_Recordings");

        Log.d(TAG, "Recording directory: " + mediaStorageDir.getAbsolutePath());

        if (!mediaStorageDir.exists()) {
            if (!mediaStorageDir.mkdirs()) {
                Log.e(TAG, "Failed to create directory");
                return null;
            }
        }

        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault())
                .format(new Date());
        String filename = "SOS_" + timeStamp + ".mp4";
        File file = new File(mediaStorageDir, filename);

        Log.d(TAG, "Output file path: " + file.getAbsolutePath());
        return file;
    }


    /**
     * Cleanup all resources
     */
    private void cleanup() {
        isRecording = false;
        cleanupVideoResources();

        if (outputFile != null && outputFile.exists()) {
            Log.d(TAG, "Recording saved to: " + outputFile.getAbsolutePath());
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Service onDestroy");

        if (isRecording) {
            cleanup();
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
