package com.example.sos;

import androidx.appcompat.app.AppCompatActivity;
import android.content.SharedPreferences;
import android.content.Intent;
import android.os.Bundle;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.button.MaterialButton;
import com.google.firebase.firestore.FirebaseFirestore;

public class AccountActivity extends AppCompatActivity {
    MaterialToolbar appBar;
    private TextInputEditText sosPasswordEdit, nameEdit, phoneEdit;
    private MaterialButton saveSosPasswordButton, saveNameButton;
    private ImageButton hamburgerButton;
    private TextView toolbarTitle;

    private static final String PREFS_NAME = "SOSPrefs";
    private static final String KEY_SOS_PASSWORD = "sos_password";
    private static final String KEY_USER_NAME = "user_name";
    private static final String KEY_USER_PHONE = "user_phone";

    private FirebaseFirestore db;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_account);

        appBar = findViewById(R.id.toolbar);
        setSupportActionBar(appBar);
        toolbarTitle = findViewById(R.id.toolbarTitle);

        hamburgerButton = findViewById(R.id.hamburgerButton);
        hamburgerButton.setOnClickListener(v ->
                startActivity(new Intent(AccountActivity.this, MenuActivity.class))
        );

        nameEdit = findViewById(R.id.nameEdit);
        phoneEdit = findViewById(R.id.phoneEdit); // newly added
        saveNameButton = findViewById(R.id.saveNameButton);
        sosPasswordEdit = findViewById(R.id.sosPasswordEdit);
        saveSosPasswordButton = findViewById(R.id.saveSosPasswordButton);

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        // Populate fields from login
        nameEdit.setText(prefs.getString(KEY_USER_NAME, ""));
        phoneEdit.setText(prefs.getString(KEY_USER_PHONE, ""));
        sosPasswordEdit.setText(prefs.getString(KEY_SOS_PASSWORD, ""));

        db = FirebaseFirestore.getInstance();

        saveNameButton.setOnClickListener(v -> {
            String name = nameEdit.getText() == null ? "" : nameEdit.getText().toString().trim();
            if (!name.isEmpty()) {
                prefs.edit().putString(KEY_USER_NAME, name).apply();
                Toast.makeText(AccountActivity.this, "Name saved!", Toast.LENGTH_SHORT).show();
                // Update Firestore too (if you keep Firestore). Using phone as document id as before.
                String phone = prefs.getString(KEY_USER_PHONE, "");
                if (!phone.isEmpty()) {
                    db.collection("users").document(phone)
                            .update("name", name)
                            .addOnSuccessListener(aVoid -> Toast.makeText(AccountActivity.this, "Name updated in cloud!", Toast.LENGTH_SHORT).show())
                            .addOnFailureListener(e -> Toast.makeText(AccountActivity.this, "Cloud update failed", Toast.LENGTH_SHORT).show());
                }
            } else {
                nameEdit.setError("Please enter your name");
            }
        });

        saveSosPasswordButton.setOnClickListener(v -> {
            String password = sosPasswordEdit.getText() == null ? "" : sosPasswordEdit.getText().toString().trim();
            if (!password.isEmpty()) {
                prefs.edit().putString(KEY_SOS_PASSWORD, password).apply();
                Toast.makeText(AccountActivity.this, "Password saved!", Toast.LENGTH_SHORT).show();
            } else {
                sosPasswordEdit.setError("Please enter a password");
            }
        });
    }
}
