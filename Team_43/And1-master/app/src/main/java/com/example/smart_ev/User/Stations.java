package com.example.smart_ev.User;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;

import com.example.smart_ev.API.RetrofitClient;
import com.example.smart_ev.Adapters.StationAdapters;
import com.example.smart_ev.Modals.Station;
import com.example.smart_ev.R;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;

public class Stations extends AppCompatActivity {

    RecyclerView recyclerView;

    StationAdapters stationAdapters;
    TextView toolbar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_stations);
        toolbar = findViewById(R.id.toolbar);
        toolbar.setText("Stations");
        
        recyclerView = findViewById(R.id.ev_stations);
        getStations();
    }

    private void getStations() {
        Call<List<Station>> call = RetrofitClient.getInstance().getApi().get_stations();
        call.enqueue(new Callback<List<Station>>() {
            @Override
            public void onResponse(Call<List<Station>> call, Response<List<Station>> response) {
                if (response.isSuccessful())
                {
                    recyclerView.setLayoutManager(new LinearLayoutManager(getApplicationContext()));
                    stationAdapters = new StationAdapters(response.body(), getApplicationContext());
                    recyclerView.setAdapter(stationAdapters);
                }
            }

            @Override
            public void onFailure(Call<List<Station>> call, Throwable t) {
                Toast.makeText(Stations.this, t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}