package com.example.sos;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import com.google.firebase.firestore.FirebaseFirestore;

import java.util.Map;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "FCM_Service";
    private static final String CHANNEL_ID = "sos_channel";
    private static final int NOTIFICATION_ID = 999;

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        Log.d(TAG, "✓ New FCM Token Generated: " + token);

        // Save locally
        getSharedPreferences("FCM", Context.MODE_PRIVATE)
                .edit()
                .putString("fcm_token", token)
                .putString("token_timestamp", System.currentTimeMillis() + "")
                .apply();

        // --- ADDED: Immediately update Firestore if user is logged in ---
        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
        if (user != null) {
            FirebaseFirestore.getInstance().collection("users")
                    .document(user.getUid())
                    .update("fcm_token", token)
                    .addOnSuccessListener(aVoid -> Log.d(TAG, "✓ FCM token synced with Firestore"))
                    .addOnFailureListener(e -> Log.e(TAG, "× Failed to sync FCM token with Firestore", e));
        }
        // --------------------------------------------------------------

        sendTokenToServer(token); // if you want to sync with your own backend too
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        Log.d(TAG, "Message received from: " + remoteMessage.getFrom());

        String title = "SOS ALERT";
        String message = "Help Needed! Emergency Alert.";
        String sosStatus = null;

        if (remoteMessage.getNotification() != null) {
            title = remoteMessage.getNotification().getTitle();
            message = remoteMessage.getNotification().getBody();
            Log.d(TAG, "Notification received - Title: " + title + ", Body: " + message);
        }

        if (remoteMessage.getData().size() > 0) {
            Map<String, String> data = remoteMessage.getData();

            if (data.containsKey("title")) {
                title = data.get("title");
            }
            if (data.containsKey("message")) {
                message = data.get("message");
            }
            if (data.containsKey("sos_status")) {
                sosStatus = data.get("sos_status");
            }
            if (data.containsKey("location")) {
                String location = data.get("location");
                message = message + "\nLocation: " + location;
            }

            Log.d(TAG, "Data payload received: " + data.toString());
        }

        showNotification(title, message, sosStatus);
        if ("activated".equals(sosStatus)) {
            Log.w(TAG, "🚨 EMERGENCY ALERT RECEIVED - SOS IS ACTIVE!");
        } else if ("deactivated".equals(sosStatus)) {
            Log.i(TAG, "✓ Safe notification received - SOS deactivated");
        }
    }

    private void showNotification(String title, String message, String sosStatus) {
        createNotificationChannel();

        Intent intent = new Intent(this, EmergencyAlertActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("notification_source", "fcm");
        intent.putExtra("sos_status", sosStatus);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                (int) System.currentTimeMillis(),
                intent,
                PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentTitle(title)
                .setContentText(message)
                .setAutoCancel(true)
                .setSound(soundUri)
                .setVibrate(new long[]{0, 500, 250, 500})
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent)
                .setLights(0xFFFF0000, 1000, 1000);

        if (message.length() > 50) {
            builder.setStyle(new NotificationCompat.BigTextStyle().bigText(message));
        }

        NotificationManagerCompat.from(this).notify(NOTIFICATION_ID, builder.build());
        Log.d(TAG, "✓ Notification displayed: " + title);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "SOS Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Emergency SOS notifications from contacts");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 500, 250, 500});
            channel.enableLights(true);
            channel.setLightColor(0xFFFF0000);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
                Log.d(TAG, "✓ Notification channel created");
            }
        }
    }

    private void sendTokenToServer(String token) {
        Log.d(TAG, "TODO: Send token to backend - " + token);
        // Implement HTTP call if needed
    }
}
