package com.example.stresssense.dashboard

import android.content.Context
import android.content.Intent
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import android.widget.Toast
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bedtime
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.DirectionsRun
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DateRangePicker
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDateRangePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.stresssense.ui.theme.BgColor
import com.example.stresssense.ui.theme.CardBg
import com.example.stresssense.ui.theme.PrimaryBlue
import com.example.stresssense.ui.theme.PrimaryPurple
import com.example.stresssense.ui.theme.StressMed
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun DashboardScreen(viewModel: DashboardViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    
    // Dynamic greeting based on time of day
    val greeting = remember {
        val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
        when {
            hour < 12 -> "Good Morning!"
            hour < 17 -> "Good Afternoon!"
            else -> "Good Evening!"
        }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(BgColor)
            .padding(horizontal = 20.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Spacer(Modifier.height(24.dp))
        Text(greeting, style = MaterialTheme.typography.bodyLarge, color = Color.Gray)
        Text("Your Wellness Dashboard", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(24.dp))

        ModernStressGauge(stressLevel = uiState.currentStressLevel)
        Spacer(Modifier.height(24.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            StatCard(
                modifier = Modifier.weight(1f), 
                icon = Icons.Default.DirectionsRun, 
                title = "Steps", 
                value = if (uiState.todaySteps > 0) uiState.todaySteps.toString() else "--",
                color = PrimaryBlue
            )
            StatCard(
                modifier = Modifier.weight(1f), 
                icon = Icons.Default.Bedtime, 
                title = "Sleep", 
                value = uiState.todaySleep,
                color = PrimaryPurple
            )
        }
        Spacer(Modifier.height(24.dp))

        ModernGraphCard(
            weeklyData = uiState.weeklyStressData,
            monthlyData = uiState.monthlyStressData,
            onShareClick = { sharePdfReport(context, uiState.monthlyStressData) },
            onDateSelected = { start, end ->
                viewModel.loadDataForDateRange(start, end)
            }
        )

        Spacer(Modifier.height(24.dp))
        InsightCard(stressLevel = uiState.currentStressLevel)
        Spacer(Modifier.height(80.dp))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ModernGraphCard(
    weeklyData: List<GraphPoint>,
    monthlyData: List<GraphPoint>,
    onShareClick: () -> Unit,
    onDateSelected: (Long, Long) -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val data = if (selectedTab == 0) weeklyData else monthlyData

    var showDateRangePicker by remember { mutableStateOf(false) }
    val dateRangePickerState = rememberDateRangePickerState()

    if (showDateRangePicker) {
        DatePickerDialog(
            onDismissRequest = { showDateRangePicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDateRangePicker = false
                        dateRangePickerState.selectedStartDateMillis?.let { start ->
                            dateRangePickerState.selectedEndDateMillis?.let { end ->
                                onDateSelected(start, end)
                            }
                        }
                    },
                    enabled = dateRangePickerState.selectedEndDateMillis != null
                ) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { showDateRangePicker = false }) { Text("Cancel") }
            }
        ) {
            DateRangePicker(state = dateRangePickerState)
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = CardBg),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier.background(BgColor, RoundedCornerShape(12.dp)).padding(4.dp)
                ) {
                    TabButtonSmall("Weekly", selectedTab == 0) { selectedTab = 0 }
                    TabButtonSmall("Monthly", selectedTab == 1) { selectedTab = 1 }
                }

                Row {
                    IconButton(onClick = { showDateRangePicker = true }) {
                        Icon(Icons.Default.CalendarMonth, contentDescription = "Select Range", tint = PrimaryBlue)
                    }
                    IconButton(onClick = onShareClick) {
                        Icon(Icons.Default.Share, contentDescription = "Share Report", tint = PrimaryBlue)
                    }
                }
            }

            Spacer(Modifier.height(20.dp))

            if (data.size >= 2) {
                val textPaint = remember {
                    Paint().apply {
                        color = android.graphics.Color.GRAY
                        textSize = 32f
                        textAlign = Paint.Align.CENTER
                    }
                }

                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(150.dp)
                ) {
                    val width = size.width
                    val height = size.height - 40f
                    val spacing = width / (data.size - 1)

                    val path = Path().apply {
                        moveTo(0f, height * (1 - data[0].value))
                        for (i in 1 until data.size) {
                            lineTo(i * spacing, height * (1 - data[i].value))
                        }
                    }

                    val fillPath = Path().apply {
                        addPath(path)
                        lineTo(width, height)
                        lineTo(0f, height)
                        close()
                    }

                    drawPath(
                        path = fillPath,
                        brush = Brush.verticalGradient(
                            colors = listOf(PrimaryBlue.copy(alpha = 0.3f), Color.Transparent),
                            endY = height
                        )
                    )
                    drawPath(path = path, color = PrimaryBlue, style = Stroke(width = 6f, cap = StrokeCap.Round))

                    drawIntoCanvas { canvas ->
                        data.forEachIndexed { index, point ->
                            val shouldShowLabel = if (data.size > 10) index % 5 == 0 else true
                            if (shouldShowLabel) {
                                canvas.nativeCanvas.drawText(point.label, index * spacing, size.height, textPaint)
                            }
                        }
                    }
                }
            } else {
                Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                    Text("Not enough data to show trends (Need 2+ points)", color = Color.Gray)
                }
            }
        }
    }
}

@Composable
fun ModernStressGauge(stressLevel: Float) {
    // stressLevel comes in as 0.0 -> 2.0 (from model). 
    // We want to visualize it 0->100% roughly. 
    // Let's assume the passed value here is the RAW score (0-2+).
    // The UI State passes `currentStressLevel` which is raw score.
    // However, DashboardUiState logic in VM calculates "normalized" too.
    // Let's rely on the passed parameter being the raw score and normalize here for display.
    
    val normalized = (stressLevel / 2.0f).coerceIn(0f, 1f)
    
    val stressColor = when {
        stressLevel >= 2.0f -> com.example.stresssense.ui.theme.StressHigh // You might need to import this or just use Red
        stressLevel >= 1.0f -> StressMed
        else -> com.example.stresssense.ui.theme.StressLow // or Green/Blue
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = CardBg),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
    ) {
        Row(
            modifier = Modifier.padding(24.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(Modifier.weight(1.5f)) {
                Text("Current Stress", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text("Based on your recent biodata", style = MaterialTheme.typography.bodyMedium, color = Color.Gray)
            }

            Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                Canvas(modifier = Modifier.size(100.dp)) {
                    drawArc(
                        color = BgColor,
                        startAngle = -225f,
                        sweepAngle = 270f,
                        useCenter = false,
                        style = Stroke(width = 30f, cap = StrokeCap.Round)
                    )
                    drawArc(
                        color = stressColor,
                        startAngle = -225f,
                        sweepAngle = 270f * normalized,
                        useCenter = false,
                        style = Stroke(width = 30f, cap = StrokeCap.Round)
                    )
                }
                Text("${(normalized * 100).toInt()}%", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun StatCard(modifier: Modifier = Modifier, icon: ImageVector, title: String, value: String, color: Color) {
    Card(
        modifier = modifier.height(150.dp),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = CardBg)
    ) {
        Column(
            Modifier
                .padding(20.dp)
                .fillMaxHeight(),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = title, tint = color, modifier = Modifier.size(24.dp))
            }
            Column {
                Text(title, style = MaterialTheme.typography.bodyLarge, color = Color.Gray)
                Text(value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun TabButtonSmall(text: String, isSelected: Boolean, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(
            containerColor = if (isSelected) PrimaryBlue else BgColor,
            contentColor = if (isSelected) Color.White else Color.Gray
        ),
        shape = RoundedCornerShape(12.dp),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
        modifier = Modifier.height(40.dp)
    ) {
        Text(text, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun InsightCard(stressLevel: Float) {
    val (title, message, bgColor, iconTint) = remember(stressLevel) {
        when {
            stressLevel >= 1.5f -> Quad(
                "High Stress Alert",
                "Your stress is elevated. Consider taking a break or trying our breathing exercises.",
                Color(0xFFFFCDD2), // Light Red
                Color(0xFFD32F2F)
            )
            stressLevel >= 0.8f -> Quad(
                "Moderate Stress",
                "You're doing okay. A short walk or some music might help you relax.",
                Color(0xFFFFF9C4), // Light Yellow
                Color(0xFFF9A825)
            )
            else -> Quad(
                "You're Calm!",
                "Great job managing your stress today. Keep up the healthy habits!",
                Color(0xFFC8E6C9), // Light Green
                Color(0xFF388E3C)
            )
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = bgColor),
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Lightbulb, contentDescription = "Insight", tint = iconTint, modifier = Modifier.size(32.dp))
            Spacer(Modifier.width(16.dp))
            Column {
                Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Color.Black)
                Text(message, style = MaterialTheme.typography.bodyMedium, color = Color.DarkGray)
            }
        }
    }
}

// Helper class for multi-value return
private data class Quad<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)

private fun sharePdfReport(context: Context, data: List<GraphPoint>) {
    val formatter = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault())
    val fileName = "StressSense_Report_${formatter.format(Date())}.pdf"

    val document = PdfDocument()
    val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create()
    val page = document.startPage(pageInfo)
    val canvas = page.canvas

    val textPaint = Paint().apply { textSize = 20f; color = android.graphics.Color.BLACK }

    canvas.drawText("StressSense Wellness Report", 50f, 50f, textPaint)
    canvas.drawText("Date: ${SimpleDateFormat("dd MMMM yyyy", Locale.getDefault()).format(Date())}", 50f, 80f, textPaint)

    if (data.isNotEmpty()) {
        val avgStress = data.map { it.value }.average() * 100
        canvas.drawText("Average Stress: ${avgStress.toInt()}%", 50f, 110f, textPaint)
        canvas.drawText("Data points: ${data.size}", 50f, 140f, textPaint)
    }

    document.finishPage(page)

    val pdfFile = File(context.cacheDir, fileName)
    try {
        val outputStream = FileOutputStream(pdfFile)
        document.writeTo(outputStream)
        document.close()
        outputStream.close()
    } catch (e: Exception) {
        Toast.makeText(context, "Error saving PDF: ${e.message}", Toast.LENGTH_LONG).show()
        return
    }

    val fileUri: android.net.Uri = FileProvider.getUriForFile(
        context,
        "${context.packageName}.fileprovider",
        pdfFile
    )

    val shareIntent = Intent(Intent.ACTION_SEND).apply {
        type = "application/pdf"
        putExtra(Intent.EXTRA_STREAM, fileUri)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    context.startActivity(Intent.createChooser(shareIntent, "Share Wellness Report"))
}
