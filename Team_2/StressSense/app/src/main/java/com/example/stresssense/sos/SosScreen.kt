package com.example.stresssense.sos

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.ContactsContract
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import kotlinx.coroutines.launch

@Composable
fun SosScreen(
    viewModel: SosViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val contacts by viewModel.contacts.collectAsState()
    val userPhone by viewModel.userPhoneNumber.collectAsState()
    val coroutineScope = rememberCoroutineScope()
    var emergencyMessage by remember { mutableStateOf("I need help. Please contact me immediately.") }

    // Check SMS permission
    val hasSmsPermission = remember {
        mutableStateOf(ContextCompat.checkSelfPermission(context, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED)
    }
    val smsPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasSmsPermission.value = isGranted
        if (!isGranted) {
            Toast.makeText(context, "SMS permission required for SOS", Toast.LENGTH_SHORT).show()
        }
    }

    // Pulsing animation for SOS button
    val infiniteTransition = rememberInfiniteTransition(label = "sos-pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    // Launcher to pick a contact from the system
    val contactPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val contactUri: Uri? = result.data?.data
            contactUri?.let { uri ->
                val projection = arrayOf(
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                    ContactsContract.CommonDataKinds.Phone.NUMBER
                )
                context.contentResolver.query(uri, projection, null, null, null)?.use { cursor ->
                    if (cursor.moveToFirst()) {
                        val nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
                        val numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
                        val name = if (nameIndex >= 0) cursor.getString(nameIndex) else "Unknown"
                        val number = if (numberIndex >= 0) cursor.getString(numberIndex) else ""
                        if (number.isNotEmpty()) {
                            viewModel.addContact(name, number)
                            Toast.makeText(context, "Added $name", Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8F9FA))
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(16.dp))

        // Header
        Text(
            "Emergency SOS",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF1A1A2E)
        )
        Spacer(Modifier.height(8.dp))
        
        // User's registered phone
        if (userPhone.isNotBlank()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFE8F5E9))
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Phone, contentDescription = null, tint = Color(0xFF388E3C), modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(8.dp))
                    Column {
                        Text("Registered Number", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                        Text(userPhone, fontWeight = FontWeight.SemiBold, color = Color(0xFF388E3C))
                    }
                }
            }
            Spacer(Modifier.height(16.dp))
        }

        Text(
            "Alert will be sent from your registered number",
            style = MaterialTheme.typography.bodySmall,
            color = Color.Gray,
            textAlign = TextAlign.Center
        )

        Spacer(Modifier.height(24.dp))

        // Big SOS Button with Gradient
        Box(
            modifier = Modifier
                .size(180.dp)
                .scale(scale)
                .clip(CircleShape)
                .background(
                    brush = Brush.radialGradient(
                        colors = listOf(Color(0xFFFF5252), Color(0xFFD50000))
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            Button(
                onClick = {
                    if (contacts.isEmpty()) {
                        Toast.makeText(context, "Add emergency contacts first!", Toast.LENGTH_SHORT).show()
                    } else {
                        coroutineScope.launch {
                            viewModel.triggerSos(emergencyMessage)
                            Toast.makeText(context, "SOS sent to ${contacts.size} contacts!", Toast.LENGTH_SHORT).show()
                        }
                    }
                },
                modifier = Modifier.size(160.dp),
                shape = CircleShape,
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                contentPadding = PaddingValues(0.dp)
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.Warning,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(Modifier.height(8.dp))
                    Text("SOS", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        }

        Spacer(Modifier.height(24.dp))

        // Message Field
        OutlinedTextField(
            value = emergencyMessage,
            onValueChange = { emergencyMessage = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Emergency Message") },
            shape = RoundedCornerShape(16.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Color(0xFFD50000),
                unfocusedBorderColor = Color.LightGray
            )
        )

        Spacer(Modifier.height(24.dp))

        // Contacts Section
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Trusted Contacts (${contacts.size})", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
            FilledTonalButton(
                onClick = {
                    val intent = Intent(Intent.ACTION_PICK, ContactsContract.CommonDataKinds.Phone.CONTENT_URI)
                    contactPickerLauncher.launch(intent)
                },
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.PersonAdd, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Add")
            }
        }

        Spacer(Modifier.height(12.dp))

        // List of Contacts
        LazyColumn(modifier = Modifier.fillMaxWidth().weight(1f)) {
            items(contacts) { contact ->
                Card(
                    modifier = Modifier
                        .padding(vertical = 6.dp)
                        .fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .padding(16.dp)
                            .fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(contact.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Text(contact.phoneNumber, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                        }
                        IconButton(onClick = { viewModel.deleteContact(contact) }) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color(0xFFD50000))
                        }
                    }
                }
            }
        }
    }
}