package com.example.sos;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.content.Intent;
import android.widget.ImageButton;
import android.widget.TextView;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.button.MaterialButton;

public class VoiceProfile extends AppCompatActivity {
    MaterialToolbar appBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_voice_profile);

        appBar = findViewById(R.id.toolbar);
        setSupportActionBar(appBar);

        // Explicitly set hamburger button click listener since it's a custom ImageButton inside toolbar
        ImageButton hamburgerButton = findViewById(R.id.hamburgerButton);
        hamburgerButton.setOnClickListener(v -> {
            startActivity(new Intent(VoiceProfile.this, MenuActivity.class));
        });

        MaterialButton createVoiceProfileButton = findViewById(R.id.createVoiceProfileButton);
        createVoiceProfileButton.setOnClickListener(v -> {
            Intent intent = new Intent(VoiceProfile.this, CreateVoiceProfileActivity.class);
            startActivity(intent);
        });
    }
}
