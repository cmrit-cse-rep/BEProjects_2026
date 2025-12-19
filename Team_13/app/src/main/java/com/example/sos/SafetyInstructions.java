package com.example.sos;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.view.MenuItem;

import com.google.android.material.appbar.MaterialToolbar;

public class SafetyInstructions extends AppCompatActivity {
    MaterialToolbar appBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_safety_instructions);

        appBar = findViewById(R.id.toolbar);
        setSupportActionBar(appBar);

        // Set hamburger click listener to open MenuActivity
        if (appBar != null) {
            appBar.setNavigationOnClickListener(v -> {
                Intent intent = new Intent(SafetyInstructions.this, MenuActivity.class);
                startActivity(intent);
            });
        }
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            onBackPressed();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
