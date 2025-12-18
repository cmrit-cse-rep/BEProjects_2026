package com.example.smart_ev.User;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.text.TextUtils;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.example.smart_ev.API.RetrofitClient;
import com.example.smart_ev.Auth.Login;
import com.example.smart_ev.Modals.RegistrationModal;
import com.example.smart_ev.R;
import com.example.smart_ev.SharedPreferenceManager.SharedPref;
import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.android.material.textfield.TextInputEditText;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class Home extends AppCompatActivity {
    FloatingActionButton floatingActionButton;
    BottomSheetDialog bottomSheetDialog;

    TextInputEditText company, model, reg, chassi, engine, battery;
    Button save, stations;

    SharedPref pref;
    TextView toolbar;
    ImageView logout;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);
        floatingActionButton = findViewById(R.id.floatingSellRequest);
        stations = findViewById(R.id.show_station);
        pref = new SharedPref(getApplicationContext());
        toolbar = findViewById(R.id.toolbar);
        toolbar.setText("Stations");
        logout = findViewById(R.id.logout);
        logout.setOnClickListener(v->logoutNow());
        stations.setOnClickListener(v->startActivity(new Intent(Home.this, Stations.class)));
        floatingActionButton.setOnClickListener(v -> {
            createDailog();
            save.setOnClickListener(v1->save_vehical());
        });
    }

    private void logoutNow() {
        pref.userLogOut();
        Toast.makeText(Home.this, "Logout successfully...", Toast.LENGTH_SHORT).show();
        Intent intent = new Intent(Home.this, Login.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK| Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
    }

    private void save_vehical() {
        String company_name = company.getText().toString();
        String model_num = model.getText().toString();
        String reg_num = reg.getText().toString();
        String chassi_num = chassi.getText().toString();
        String engine_num = engine.getText().toString();
        String battery_cap = battery.getText().toString();
        if (validate(company_name, model_num, reg_num, chassi_num, engine_num, battery_cap))
        {
            String user_id = pref.getUser().getId()+"";
            Call<RegistrationModal> call = RetrofitClient.getInstance().getApi().save_vehical(user_id, company_name, model_num, reg_num, chassi_num, engine_num, battery_cap);
            call.enqueue(new Callback<RegistrationModal>() {
                @Override
                public void onResponse(Call<RegistrationModal> call, Response<RegistrationModal> response) {
                    bottomSheetDialog.dismiss();
                    RegistrationModal registrationModal = response.body();
                    if (response.isSuccessful())
                    {
                        Toast.makeText(Home.this, registrationModal.getMessage() , Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<RegistrationModal> call, Throwable t) {
                    Toast.makeText(Home.this, t.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    private boolean validate(String companyName, String modelNum, String regNum, String chassiNum, String engineNum, String batteryCap) {
        if (companyName.isEmpty()){
            Toast.makeText(Home.this, "Company name is required...", Toast.LENGTH_SHORT).show();
            return  false;
        }
        if (modelNum.isEmpty()){
            Toast.makeText(Home.this, "Model number is required...", Toast.LENGTH_SHORT).show();
            return  false;
        }
        if (regNum.isEmpty()){
            Toast.makeText(Home.this, "Reg number is required...", Toast.LENGTH_SHORT).show();
            return  false;
        }
        if (chassiNum.isEmpty()){
            Toast.makeText(Home.this, "Chassi number required...", Toast.LENGTH_SHORT).show();
            return  false;
        }
        if (engineNum.isEmpty()){
            Toast.makeText(Home.this, "Engine number required...", Toast.LENGTH_SHORT).show();
            return  false;
        }
        if (batteryCap.isEmpty()){
            Toast.makeText(Home.this, "Battery capacity required...", Toast.LENGTH_SHORT).show();
            return  false;
        }
        return true;
    }

    private void createDailog() {
        bottomSheetDialog = new BottomSheetDialog(Home.this);
        bottomSheetDialog.setContentView(R.layout.vehical_details_dailog);
        company = bottomSheetDialog.findViewById(R.id.company_name);
        model = bottomSheetDialog.findViewById(R.id.model_no);
        reg = bottomSheetDialog.findViewById(R.id.reg_no);
        chassi = bottomSheetDialog.findViewById(R.id.chassis_number);
        engine = bottomSheetDialog.findViewById(R.id.engine_number);
        battery = bottomSheetDialog.findViewById(R.id.battery_capacity);
        save = bottomSheetDialog.findViewById(R.id.save_vehical);
        bottomSheetDialog.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        bottomSheetDialog.show();
    }
}