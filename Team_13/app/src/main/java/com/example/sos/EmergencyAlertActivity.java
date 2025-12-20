package com.example.sos;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.material.button.MaterialButton;

public class EmergencyAlertActivity extends AppCompatActivity implements OnMapReadyCallback {

    private GoogleMap mMap;
    private LatLng dangerLocation;
    private String dangerPhoneNumber;

    private MaterialButton openGoogleMapsButton, callPersonButton, callCopsButton, callAmbulanceButton;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_emergency_alert);

        // ---- Read extras (support both naming styles and String/Double types) ----
        Double lat = readDoubleExtraFlexible("lat", "latitude");
        Double lng = readDoubleExtraFlexible("lng", "longitude");
        if (lat != null && lng != null && !(lat == 0.0 && lng == 0.0)) {
            dangerLocation = new LatLng(lat, lng);
        }

        // phone can arrive as "personPhone" or "phone"
        dangerPhoneNumber = getStringExtraFlexible("personPhone", "phone");

        // ---- Set up Google Map fragment in your FrameLayout (id: mapContainer) ----
        SupportMapFragment mapFragment = SupportMapFragment.newInstance();
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.mapContainer, mapFragment)
                .commit();
        mapFragment.getMapAsync(this);

        // ---- Bind buttons ----
        openGoogleMapsButton = findViewById(R.id.openGoogleMapsButton);
        callPersonButton     = findViewById(R.id.callPersonButton);
        callCopsButton       = findViewById(R.id.callCopsButton);
        callAmbulanceButton  = findViewById(R.id.callAmbulanceButton);

        // ---- Button actions ----

        // Open in Google Maps (prefer app, fallback to any map handler)
        openGoogleMapsButton.setOnClickListener(v -> {
            if (dangerLocation == null) {
                Toast.makeText(this, "Location not available", Toast.LENGTH_SHORT).show();
                return;
            }
            String label = "Person in Danger";
            String query = dangerLocation.latitude + "," + dangerLocation.longitude + "(" + label + ")";
            String geoUri = "geo:" + dangerLocation.latitude + "," + dangerLocation.longitude + "?q=" + Uri.encode(query);

            Intent maps = new Intent(Intent.ACTION_VIEW, Uri.parse(geoUri));
            maps.setPackage("com.google.android.apps.maps"); // prefer Google Maps if installed
            try {
                startActivity(maps);
            } catch (ActivityNotFoundException e) {
                // fallback to any maps-capable app
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(geoUri)));
            }
        });

        // Call Person (ACTION_DIAL so no CALL_PHONE permission needed)
        callPersonButton.setOnClickListener(v -> {
            if (dangerPhoneNumber != null && !dangerPhoneNumber.isEmpty()) {
                Intent dial = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + dangerPhoneNumber));
                startActivity(dial);
            } else {
                Toast.makeText(this, "Phone number unavailable", Toast.LENGTH_SHORT).show();
            }
        });

        // Call Cops (India: 100) — your XML currently has this disabled; enable in XML when ready
        callCopsButton.setOnClickListener(v -> {
            Intent dial = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:100"));
            startActivity(dial);
        });

        // Call Ambulance (India: 108) — your XML currently has this disabled; enable in XML when ready
        callAmbulanceButton.setOnClickListener(v -> {
            Intent dial = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:108"));
            startActivity(dial);
        });
    }

    // ---- Google Map callback ----
    @Override
    public void onMapReady(GoogleMap googleMap) {
        mMap = googleMap;

        if (dangerLocation != null) {
            mMap.addMarker(new MarkerOptions()
                    .position(dangerLocation)
                    .title("Person in Danger"));
            mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(dangerLocation, 15f));
        }
    }

    // ---- Helpers to read extras flexibly ----
    private @Nullable Double readDoubleExtraFlexible(String primaryKey, String alternateKey) {
        // Try double extras first
        if (getIntent().hasExtra(primaryKey)) {
            Object v = getIntent().getExtras().get(primaryKey);
            Double d = coerceToDouble(v);
            if (d != null) return d;
        }
        if (getIntent().hasExtra(alternateKey)) {
            Object v = getIntent().getExtras().get(alternateKey);
            Double d = coerceToDouble(v);
            if (d != null) return d;
        }
        // Also try string versions (e.g., FCM string data)
        String s1 = getIntent().getStringExtra(primaryKey);
        if (s1 != null) {
            try { return Double.parseDouble(s1); } catch (Exception ignored) {}
        }
        String s2 = getIntent().getStringExtra(alternateKey);
        if (s2 != null) {
            try { return Double.parseDouble(s2); } catch (Exception ignored) {}
        }
        return null;
    }

    private @Nullable String getStringExtraFlexible(String primaryKey, String alternateKey) {
        String v = getIntent().getStringExtra(primaryKey);
        if (v != null && !v.isEmpty()) return v;
        v = getIntent().getStringExtra(alternateKey);
        if (v != null && !v.isEmpty()) return v;
        return null;
    }

    private @Nullable Double coerceToDouble(Object v) {
        if (v instanceof Double) return (Double) v;
        if (v instanceof Float)  return ((Float) v).doubleValue();
        if (v instanceof Integer) return ((Integer) v).doubleValue();
        if (v instanceof Long)    return ((Long) v).doubleValue();
        if (v instanceof String) {
            try { return Double.parseDouble((String) v); } catch (Exception ignored) {}
        }
        return null;
    }
}
