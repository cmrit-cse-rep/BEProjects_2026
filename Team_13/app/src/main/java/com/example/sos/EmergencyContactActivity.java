package com.example.sos;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.Manifest;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.MenuItem;
import android.view.View;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.Toast;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.button.MaterialButton;
import com.google.firebase.messaging.FirebaseMessaging;

import java.util.ArrayList;

public class EmergencyContactActivity extends AppCompatActivity implements ContactRecyclerAdapter.OnContactDeleteListener {

    private static final String TAG = "EmergencyContactActivity";
    private static final int REQUEST_CALL_PHONE_PERMISSION = 1;

    RecyclerView contactRecyclerView;
    ArrayList<ContactModel> modelArrayList;
    ContactRecyclerAdapter adapter;
    DatabaseHelper helper;
    MaterialToolbar appBar;
    LinearLayout emptyStateLayout;
    MaterialButton addFirstContactButton;
    MaterialButton addNewContactButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_emergency_contacts);

        appBar = findViewById(R.id.toolbar);
        setSupportActionBar(appBar);

        ImageButton hamburgerButton = findViewById(R.id.hamburgerButton);
        hamburgerButton.setOnClickListener(v -> {
            Intent intent = new Intent(EmergencyContactActivity.this, MenuActivity.class);
            startActivity(intent);
        });

        contactRecyclerView = findViewById(R.id.contactRecylerView);
        contactRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        helper = new DatabaseHelper(this);
        modelArrayList = helper.fetchData();

        adapter = new ContactRecyclerAdapter(this, modelArrayList, this);
        contactRecyclerView.setAdapter(adapter);

        emptyStateLayout = findViewById(R.id.emptyStateLayout);
        addFirstContactButton = findViewById(R.id.addFirstContactButton);
        addNewContactButton = findViewById(R.id.addNewContactButton);

        addFirstContactButton.setOnClickListener(v -> {
            Intent intent = new Intent(EmergencyContactActivity.this, RegisterNumberActivity.class);
            startActivity(intent);
            finish();
        });

        addNewContactButton.setOnClickListener(v -> {
            Intent intent = new Intent(EmergencyContactActivity.this, RegisterNumberActivity.class);
            startActivity(intent);
            // Optionally do not finish here to allow return to this screen
        });

        updateEmptyState();
    }

    private void updateEmptyState() {
        if (modelArrayList.isEmpty()) {
            emptyStateLayout.setVisibility(View.VISIBLE);
            contactRecyclerView.setVisibility(View.GONE);
            addNewContactButton.setVisibility(View.GONE); // hide add new button if empty, only show add first button
        } else {
            emptyStateLayout.setVisibility(View.GONE);
            contactRecyclerView.setVisibility(View.VISIBLE);
            addNewContactButton.setVisibility(View.VISIBLE);
        }
    }

    @Override
    public void onContactDeleted() {
        updateEmptyState();
    }

    @Override
    protected void onResume() {
        super.onResume();
        modelArrayList.clear();
        modelArrayList.addAll(helper.fetchData());
        adapter.notifyDataSetChanged();
        updateEmptyState();

        // Update FCM tokens for all contacts
        updateAllContactFcmTokens();
    }

    /**
     * Update FCM tokens for all contacts
     * This ensures each contact has a valid FCM token stored
     */
    private void updateAllContactFcmTokens() {
        Log.d(TAG, "Updating FCM tokens for all contacts");

        // Get this device's FCM token
        FirebaseMessaging.getInstance().getToken()
                .addOnCompleteListener(task -> {
                    if (!task.isSuccessful()) {
                        Log.w(TAG, "Fetching FCM token failed", task.getException());
                        return;
                    }

                    String currentToken = task.getResult();
                    Log.d(TAG, "Current device FCM token: " + currentToken);

                    // Update each contact with the latest FCM token
                    for (ContactModel contact : modelArrayList) {
                        if (!currentToken.equals(contact.getFcmToken())) {
                            contact.setFcmToken(currentToken);
                            helper.updateFcmToken(contact.getId(), currentToken);
                            Log.d(TAG, "Updated FCM token for contact: " + contact.getName());
                        }
                    }
                });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_CALL_PHONE_PERMISSION) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, "Call permission granted", Toast.LENGTH_SHORT).show();
            } else {
                if (ActivityCompat.shouldShowRequestPermissionRationale(this, Manifest.permission.CALL_PHONE)) {
                    new AlertDialog.Builder(this).setTitle("Permission required").setMessage("We need permission for calling")
                            .setPositiveButton("CONFIRM", (dialog, which) -> ActivityCompat.requestPermissions(EmergencyContactActivity.this,
                                    new String[]{Manifest.permission.CALL_PHONE}, REQUEST_CALL_PHONE_PERMISSION))
                            .show();
                } else {
                    new AlertDialog.Builder(this).setTitle("Permission denied").setMessage("If you reject permission, you can't use this call service\n\n" +
                                    "Please turn on Phone permission at [Setting] > [Permission]")
                            .setPositiveButton("PROCEED", (dialog, which) -> openAppSettings())
                            .setNegativeButton("CLOSE", (dialog, which) -> {
                                Toast.makeText(EmergencyContactActivity.this, "Call permission denied", Toast.LENGTH_SHORT).show();
                                dialog.dismiss();
                            }).show();
                }
            }
        }
    }

    private void performPhoneCall(String phoneNumber) {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CALL_PHONE}, REQUEST_CALL_PHONE_PERMISSION);
        } else {
            Intent intent = new Intent(Intent.ACTION_CALL);
            intent.setData(Uri.parse(phoneNumber));
            startActivity(intent);
        }
    }

    private void openAppSettings() {
        Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setData(Uri.parse("package:" + getPackageName()));
        startActivity(intent);
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            onBackPressed(); // or finish();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
