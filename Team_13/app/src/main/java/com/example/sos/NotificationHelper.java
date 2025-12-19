package com.example.sos;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import androidx.core.app.NotificationCompat;

public class NotificationHelper {

    private static final String TAG = "NotificationHelper";

    // ⚠️ Use a versioned channel ID so Android can’t “remember” old low-importance settings.
    public static final String URGENT_CHANNEL_ID = "urgent_alerts_bypass_v2";
    public static final String URGENT_CHANNEL_NAME = "Urgent Alerts (Bypass DND)";

    /**
     * Create/upgrade a channel that:
     * - Is HIGH importance
     * - Uses ALARM sound
     * - Bypasses DND (requires user to grant Notification Policy Access)
     * Call once at app start (e.g., MainActivity.onCreate).
     */
    public static void createDNDBypassChannel(Context context) {
        Log.d(TAG, "Creating/ensuring DND-bypass channel…");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            // Use the default alarm tone
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmUri == null) {
                // Fallback to notification if alarm missing
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }

            NotificationChannel existing = nm.getNotificationChannel(URGENT_CHANNEL_ID);

            // If the existing channel is weak (low importance / no bypass / wrong sound), drop & recreate.
            boolean recreate = false;
            if (existing != null) {
                int imp = existing.getImportance();
                boolean bypass = false;
                try { bypass = existing.canBypassDnd(); } catch (Throwable ignored) {}
                // NOTE: Android stores the sound inside the channel, but it’s not trivial to compare URIs consistently.
                // If importance < HIGH or cannot bypass → recreate.
                if (imp < NotificationManager.IMPORTANCE_HIGH || !bypass) {
                    Log.w(TAG, "Existing channel is weak (imp=" + imp + ", bypass=" + bypass + "). Recreating.");
                    nm.deleteNotificationChannel(URGENT_CHANNEL_ID);
                    recreate = true;
                }
            }

            if (existing == null || recreate) {
                NotificationChannel channel = new NotificationChannel(
                        URGENT_CHANNEL_ID,
                        URGENT_CHANNEL_NAME,
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Emergency alerts that use alarm sound and can bypass Do Not Disturb.");
                channel.enableVibration(true);
                channel.setVibrationPattern(new long[]{0, 600, 300, 600});
                channel.enableLights(true);
                channel.setLightColor(0xFFFF0000);
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

                // Ask to bypass DND (works only if user has granted Notification Policy Access)
                try { channel.setBypassDnd(true); } catch (Throwable ignored) {}

                AudioAttributes attrs = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)              // 👈 treat like an alarm
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build();
                channel.setSound(alarmUri, attrs);

                nm.createNotificationChannel(channel);
                Log.d(TAG, "✓ Channel created: " + URGENT_CHANNEL_ID);
            } else {
                Log.d(TAG, "Channel already OK: " + URGENT_CHANNEL_ID);
            }
        }
    }

    /** Does the app have permission to bypass DND? (User must grant in settings) */
    public static boolean hasNotificationPolicyAccess(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            boolean granted = nm != null && nm.isNotificationPolicyAccessGranted();
            Log.d(TAG, "Notification Policy Access granted: " + granted);
            return granted;
        }
        return true; // pre-M has no DND policy gate
    }

    /** Open the settings screen where the user can grant DND bypass to your app. */
    public static void openNotificationPolicySettings(Context context) {
        Log.d(TAG, "Opening Notification Policy Access settings");
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
    }

    /**
     * Send an urgent notification that uses the DND-bypass channel.
     * NOTE: On Android O+, sound/vibration are defined by the channel (not per-notification).
     * We still set a sound on pre-O as a fallback.
     */
    public static void sendDNDBypassNotification(Context context, int notificationId,
                                                 String title, String message) {
        Log.d(TAG, "Sending DND-bypass notification: " + title);

        Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);

        NotificationCompat.Builder b = new NotificationCompat.Builder(context, URGENT_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM) // 👈 treated as alarm
                .setAutoCancel(true)
                .setOngoing(false)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);

        // Pre-O: set sound/vibration on the builder (channels don’t exist)
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            b.setSound(alarmUri);
            b.setVibrate(new long[]{0, 600, 300, 600});
        }

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.notify(notificationId, b.build());
            Log.d(TAG, "✓ Urgent notification posted (id=" + notificationId + ")");
        }
    }

    public static void sendFCMNotification(Context context, String title, String message) {
        Log.d(TAG, "sendFCMNotification → channel=" + URGENT_CHANNEL_ID);
        sendDNDBypassNotification(context, 999, title, message);
    }

    public static void sendSOSFCMAlert(Context context, String title, String locationUrl) {
        Log.d(TAG, "sendSOSFCMAlert → channel=" + URGENT_CHANNEL_ID);
        String message = "Emergency assistance needed.\nLocation: " + locationUrl;
        sendDNDBypassNotification(context, 1000, title, message);
    }
}
