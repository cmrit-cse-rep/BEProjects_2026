package com.example.smart_ev.Auth;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.example.smart_ev.API.RetrofitClient;
import com.example.smart_ev.Modals.LoginModal;
import com.example.smart_ev.R;
import com.example.smart_ev.SharedPreferenceManager.SharedPref;
import com.example.smart_ev.User.Home;
import com.google.android.material.textfield.TextInputEditText;

import java.util.Objects;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class Login extends AppCompatActivity {
    TextInputEditText phone, password;
    Button userSignIn;
    TextView newAccount;
    SharedPref pref;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);
        phone = findViewById(R.id.phone);
        password = findViewById(R.id.password);
        userSignIn = findViewById(R.id.userSignIn);
        newAccount = findViewById(R.id.register_now);
        newAccount.setOnClickListener(v -> startActivity(new Intent(Login.this, Registration.class)));
        userSignIn.setOnClickListener(v -> loginUser());
        pref = new SharedPref(getApplicationContext());
    }

    public void onStart() {
        super.onStart();
        if(pref.isLoggedIn())
        {
            Intent intent = new Intent(Login.this, Home.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK| Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
        }
    }

    private void loginUser() {
        String user_phone = Objects.requireNonNull(this.phone.getText()).toString();
        String user_password = Objects.requireNonNull(this.password.getText()).toString();
        if (validate(user_phone, user_password)) {
            Call<LoginModal> call = RetrofitClient.getInstance().getApi().login(user_phone, user_password);
            call.enqueue(new Callback<LoginModal>() {
                @Override
                public void onResponse(@NonNull Call<LoginModal> call, @NonNull Response<LoginModal> response) {
                    LoginModal loginModal = response.body();
                    assert loginModal != null;
                    if (loginModal.getStatus().equals("OK")) {
                        Toast.makeText(Login.this, loginModal.getMessage(), Toast.LENGTH_SHORT).show();
                        pref.saveUser(loginModal.getData());
                        Intent intent = new Intent(Login.this, Home.class);
                        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                        startActivity(intent);
                    } else {
                        Toast.makeText(Login.this, loginModal.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(@NonNull Call<LoginModal> call, @NonNull Throwable t) {

                }
            });
        }
    }
    private boolean validate(String user_phone, String user_password) {
        if (user_phone.isEmpty()) {
            Toast.makeText(Login.this, "Contact is required...", Toast.LENGTH_SHORT).show();
            return false;
        } else if (user_phone.length() != 10) {
            Toast.makeText(Login.this, "Invalid contact...", Toast.LENGTH_SHORT).show();
            return false;
        }

        if (user_password.isEmpty()) {
            Toast.makeText(Login.this, "Password is required...", Toast.LENGTH_SHORT).show();
            return false;
        } else if (user_password.length() < 3 || user_password.length() > 10) {
            Toast.makeText(Login.this, "Invalid password", Toast.LENGTH_SHORT).show();
            return false;
        }
        return true;
    }

}