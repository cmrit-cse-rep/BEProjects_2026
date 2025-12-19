package com.example.sos;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

public class LoginActivity extends AppCompatActivity {

    private EditText editTextName, editTextPhone;
    private Button btnRegister;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        editTextName = findViewById(R.id.editTextName);
        editTextPhone = findViewById(R.id.editTextPhone);
        btnRegister = findViewById(R.id.btnRegister);

        btnRegister.setOnClickListener(v -> {
            String name = editTextName.getText().toString().trim();
            String phone = editTextPhone.getText().toString().trim();

            if (name.isEmpty()) {
                Toast.makeText(this, "Please enter your name", Toast.LENGTH_SHORT).show();
                return;
            }
            if (phone.isEmpty()) {
                Toast.makeText(this, "Please enter your phone number", Toast.LENGTH_SHORT).show();
                return;
            }

            // Basic normalization (India example). Adjust/remove as needed.
            if (!phone.startsWith("+")) {
                if (phone.length() == 10) phone = "+91" + phone;
                else if (phone.length() == 12 && phone.startsWith("91")) phone = "+" + phone;
            }

            // Very simple phone validation (tweak to your needs)
            if (phone.length() < 10) {
                Toast.makeText(this, "Enter a valid phone number", Toast.LENGTH_SHORT).show();
                return;
            }

            // Save locally (useful for greeting / quick access)
            getSharedPreferences("SOSPrefs", MODE_PRIVATE).edit()
                    .putString("user_name", name)
                    .putString("user_phone", phone)
                    .apply();

            // Launch main/home screen
            Intent intent = new Intent(LoginActivity.this, MainActivity.class);
            // clear back stack so user can't go back to login with back button
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            finish();
        });
    }
}
