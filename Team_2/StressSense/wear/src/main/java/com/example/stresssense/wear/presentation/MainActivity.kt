package com.example.stresssense.wear.presentation

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.Text
import androidx.compose.ui.text.style.TextAlign
import com.example.stresssense.wear.service.SensorDataService
import com.example.stresssense.wear.presentation.theme.StressSenseTheme
import com.google.android.gms.wearable.Wearable
import dagger.hilt.android.AndroidEntryPoint
import android.os.Build
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.ChipDefaults

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private val viewModel: SensorViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        setContent {
            StressSenseTheme {
                SensorActivationScreen(viewModel)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        Wearable.getDataClient(this).addListener(viewModel)
    }

    override fun onPause() {
        super.onPause()
        Wearable.getDataClient(this).removeListener(viewModel)
    }
}

@Composable
fun SensorActivationScreen(viewModel: SensorViewModel) {
    val context = LocalContext.current
    
    val requiredPermissions = remember {
        mutableListOf(
            Manifest.permission.BODY_SENSORS,
            Manifest.permission.ACTIVITY_RECOGNITION
        ).apply {
            if (Build.VERSION.SDK_INT >= 33) {
                add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    var areRequiredPermissionsGranted by remember { 
        mutableStateOf(checkPermissions(context, requiredPermissions)) // STRICT CHECK
    }
    
    var missingPermissions by remember {
        mutableStateOf(getMissingPermissions(context, requiredPermissions))
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { _ ->
        // On result, re-check essential permissions (STRICT)
        areRequiredPermissionsGranted = checkPermissions(context, requiredPermissions)
        missingPermissions = getMissingPermissions(context, requiredPermissions)
    }

    val heartRate by viewModel.heartRate.collectAsState()


    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        if (areRequiredPermissionsGranted) {
            Text(
                text = "Detecting BVP...",
                textAlign = TextAlign.Center,
                style = androidx.wear.compose.material.MaterialTheme.typography.title3
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "${heartRate.toInt()} BPM",
                textAlign = TextAlign.Center,
                style = androidx.wear.compose.material.MaterialTheme.typography.display2,
                color = androidx.wear.compose.material.MaterialTheme.colors.primary
            )
            Spacer(modifier = Modifier.height(16.dp))
            Chip(
                onClick = {
                    val intent = Intent(context, SensorDataService::class.java)
                    context.startForegroundService(intent)
                },
                label = { Text("Start Collection") },
                colors = ChipDefaults.primaryChipColors()
            )
        } else {
            Text(
                text = "Sensors needed.",
                textAlign = TextAlign.Center,
                style = androidx.wear.compose.material.MaterialTheme.typography.body1
            )
            if (missingPermissions.isNotEmpty()) {
                 Text(
                    text = "Missing: ${missingPermissions.joinToString { it.substringAfterLast(".") }}",
                    textAlign = TextAlign.Center,
                    style = androidx.wear.compose.material.MaterialTheme.typography.caption3,
                    color = androidx.wear.compose.material.MaterialTheme.colors.error
                )           
            }
            Spacer(modifier = Modifier.height(8.dp))
            Chip(
                onClick = { permissionLauncher.launch(requiredPermissions.toTypedArray()) },
                label = { Text("Grant Permissions") },
                colors = ChipDefaults.secondaryChipColors()
            )
        }
    }

    LaunchedEffect(Unit) {
        if (!areRequiredPermissionsGranted || missingPermissions.isNotEmpty()) {
            permissionLauncher.launch(requiredPermissions.toTypedArray())
        }
    }
}

private fun checkPermissions(context: Context, permissions: List<String>): Boolean {
    return permissions.all { permission ->
        ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
    }
}

private fun getMissingPermissions(context: Context, permissions: List<String>): List<String> {
    return permissions.filter { permission ->
        ContextCompat.checkSelfPermission(context, permission) != PackageManager.PERMISSION_GRANTED
    }
}
