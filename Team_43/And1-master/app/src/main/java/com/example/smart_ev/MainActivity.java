package com.example.smart_ev;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.ImageView;
import android.widget.TextView;

import com.example.smart_ev.Auth.Login;

public class MainActivity extends AppCompatActivity {
    ImageView logo;
    Animation top, bottom;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        top = AnimationUtils.loadAnimation(this, R.anim.top_animation);
        bottom = AnimationUtils.loadAnimation(this, R.anim.bottom_animation);
        logo = findViewById(R.id.logo_image);
        logo.setAnimation(top);

        new Handler().postDelayed(() ->
        {
            startActivity(new Intent(MainActivity.this, Login.class));
            finish();
        }, 2500);
    }
}