package com.example.sos;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.GravityCompat;
import androidx.drawerlayout.widget.DrawerLayout;

public class MenuActivity extends AppCompatActivity {
    private static final String TAG = "MenuActivity";

    private DrawerLayout drawerLayout;
    private ImageButton backArrow;
    private LinearLayout homeRow, accountRow, voiceProfileRow, emergencyContactRow, safetyInstructionsRow, userGuideRow;

    // Hold the pending navigation target while drawer closes
    private Class<?> pendingTarget = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_menu);

        drawerLayout = findViewById(R.id.drawerLayout);
        backArrow = findViewById(R.id.backArrow);
        homeRow = findViewById(R.id.homeRow);
        accountRow = findViewById(R.id.accountRow);
        voiceProfileRow = findViewById(R.id.voiceProfileRow);
        emergencyContactRow = findViewById(R.id.emergencyContactRow);
        safetyInstructionsRow = findViewById(R.id.safetyInstructionsRow);
        userGuideRow = findViewById(R.id.userGuideRow);

        // Open drawer on entry
        drawerLayout.openDrawer(GravityCompat.START);

        backArrow.setOnClickListener(v -> {
            finish();
            overridePendingTransition(R.anim.no_animation, R.anim.menu_exit_left);
        });

        // Attach click handlers that request navigation via close -> listener -> startActivity
        homeRow.setOnClickListener(v -> requestNavigate(MainActivity.class));
        accountRow.setOnClickListener(v -> requestNavigate(AccountActivity.class));
        voiceProfileRow.setOnClickListener(v -> requestNavigate(VoiceProfile.class));
        emergencyContactRow.setOnClickListener(v -> requestNavigate(EmergencyContactActivity.class));
        safetyInstructionsRow.setOnClickListener(v -> requestNavigate(SafetyInstructions.class));
        userGuideRow.setOnClickListener(v -> requestNavigate(UserGuideActivity.class));

        // Drawer listener: when closed, start the pending target (if any)
        drawerLayout.addDrawerListener(new DrawerLayout.SimpleDrawerListener() {
            @Override
            public void onDrawerClosed(android.view.View drawerView) {
                super.onDrawerClosed(drawerView);
                if (pendingTarget != null) {
                    Log.d(TAG, "Drawer closed — navigating to " + pendingTarget.getSimpleName());
                    try {
                        Intent intent = new Intent(MenuActivity.this, pendingTarget);
                        startActivity(intent);
                        overridePendingTransition(R.anim.menu_enter_left, R.anim.no_animation);
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to start activity " + pendingTarget.getSimpleName(), e);
                        Toast.makeText(MenuActivity.this, "Cannot open "+ pendingTarget.getSimpleName(), Toast.LENGTH_SHORT).show();
                    } finally {
                        pendingTarget = null;
                        finish(); // close menu activity after starting target
                    }
                } else {
                    // No pending navigation -> just finish (back arrow scenario)
                    // finish(); // commented out to allow user to keep menu open if needed
                }
            }
        });
    }

    /**
     * Request navigation to `cls`. This closes the drawer and sets a pending target
     * so we start the activity once the drawer fully closes.
     */
    private void requestNavigate(Class<?> cls) {
        // Basic sanity checks
        if (cls == null) return;
        pendingTarget = cls;

        // Close drawer; the DrawerListener will pick up pendingTarget in onDrawerClosed
        if (drawerLayout.isDrawerOpen(GravityCompat.START)) {
            drawerLayout.closeDrawer(GravityCompat.START);
        } else {
            // If for some reason drawer isn't open, start immediately
            try {
                Intent intent = new Intent(MenuActivity.this, cls);
                startActivity(intent);
                overridePendingTransition(R.anim.menu_enter_left, R.anim.no_animation);
                finish();
            } catch (Exception e) {
                Log.e(TAG, "Immediate navigation failed to " + cls.getSimpleName(), e);
                Toast.makeText(this, "Cannot open " + cls.getSimpleName(), Toast.LENGTH_SHORT).show();
            }
            pendingTarget = null;
        }
    }
}
