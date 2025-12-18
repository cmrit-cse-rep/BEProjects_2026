package com.example.smart_ev.Auth;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.util.Patterns;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.example.smart_ev.API.RetrofitClient;
import com.example.smart_ev.Modals.RegistrationModal;
import com.example.smart_ev.R;
import com.google.android.material.textfield.TextInputEditText;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class Registration extends AppCompatActivity {
    TextInputEditText name, contact, email, password, address, username;
    Button saveBtn;
    TextView login_now;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_registration);
        name = findViewById(R.id.user_name);
        contact = findViewById(R.id.user_phone);
        email = findViewById(R.id.user_email);
        password = findViewById(R.id.user_password);
        address = findViewById(R.id.user_address);
        saveBtn = findViewById(R.id.user_register);
        login_now = findViewById(R.id.login_now);
        login_now.setOnClickListener(v-> startActivity(new Intent(Registration.this, Login.class)));
        saveBtn.setOnClickListener(v->saveToServer());
    }

    private void saveToServer() {
        String name1 = name.getText().toString();
        String contact1 = contact.getText().toString();
        String email1 = email.getText().toString();
        String password1 = password.getText().toString();
        String address1 = address.getText().toString();
        if (validate(name1, contact1, email1, password1, address1)){
            Call<RegistrationModal> call = RetrofitClient.getInstance().getApi().save_user(name1, contact1, email1, password1, address1);
            call.enqueue(new Callback<RegistrationModal>() {
                @Override
                public void onResponse(Call<RegistrationModal> call, Response<RegistrationModal> response) {
                    RegistrationModal registrationModal = response.body();
                    assert registrationModal != null;
                    if (registrationModal.getStatus().equals("OK"))
                    {
                        Toast.makeText(Registration.this, registrationModal.getMessage(), Toast.LENGTH_SHORT).show();
                        startActivity(new Intent(Registration.this, Login.class));
                    }else{
                        Toast.makeText(Registration.this, registrationModal.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<RegistrationModal> call, Throwable t) {
                    Toast.makeText(Registration.this, t.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    private boolean validate(String name1, String contact1, String email1, String password1, String address1) {
        if (name1.isEmpty()){
            Toast.makeText(this, "Name is required", Toast.LENGTH_SHORT).show();
            return false;
        } else if (name1.length() < 3) {
            Toast.makeText(this, "Invalid name", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (contact1.isEmpty()){
            Toast.makeText(this, "Contact is required", Toast.LENGTH_SHORT).show();
            return false;
        } else if (contact1.length() != 10) {
            Toast.makeText(this, "Invalid contact", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (email1.isEmpty()){
            Toast.makeText(this, "Email is required", Toast.LENGTH_SHORT).show();
            return false;
        } else if (!Patterns.EMAIL_ADDRESS.matcher(email1).matches()) {
            Toast.makeText(this, "Invalid email", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (password1.isEmpty()){
            Toast.makeText(this, "Password is required", Toast.LENGTH_SHORT).show();
            return false;
        } else if (password1.length() < 3 || password1.length() > 10) {
            Toast.makeText(this, "Invalid password", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (address1.isEmpty()){
            Toast.makeText(this, "Password is required", Toast.LENGTH_SHORT).show();
            return false;
        }
        return true;
    }


}