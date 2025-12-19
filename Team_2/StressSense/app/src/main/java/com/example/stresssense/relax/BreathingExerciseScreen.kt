package com.example.stresssense.relax

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

private enum class BreathingState(val label: String, val durationSeconds: Int, val color: Color) {
    Inhale("Inhale", 4, Color(0xFF4FC3F7)),  // Light Blue
    Hold("Hold", 4, Color(0xFF81C784)),       // Light Green
    Exhale("Exhale", 4, Color(0xFFFFB74D)),   // Amber
    Rest("Rest", 4, Color(0xFFCE93D8));       // Light Purple

    fun next(): BreathingState = when (this) {
        Inhale -> Hold
        Hold -> Exhale
        Exhale -> Rest
        Rest -> Inhale
    }
}

@Composable
fun BreathingExerciseScreen(modifier: Modifier = Modifier) {
    var breathingState by remember { mutableStateOf(BreathingState.Inhale) }
    var secondsLeft by remember { mutableIntStateOf(breathingState.durationSeconds) }

    // Timer that updates every second
    LaunchedEffect(Unit) {
        while (true) {
            delay(1_000)
            if (secondsLeft > 1) {
                secondsLeft--
            } else {
                breathingState = breathingState.next()
                secondsLeft = breathingState.durationSeconds
            }
        }
    }

    // Animate the circle scale based on breathing state
    val targetScale = when (breathingState) {
        BreathingState.Inhale -> 1.3f
        BreathingState.Hold -> 1.3f
        BreathingState.Exhale -> 0.6f
        BreathingState.Rest -> 0.6f
    }
    val scale by animateFloatAsState(
        targetValue = targetScale,
        animationSpec = tween(durationMillis = breathingState.durationSeconds * 1000, easing = EaseInOutCubic),
        label = "scale"
    )
    
    // Animate color
    val animatedColor by animateColorAsState(
        targetValue = breathingState.color,
        animationSpec = tween(500),
        label = "color"
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF121212)), // Dark mode background
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Animated breathing circle with glow
        Box(
            modifier = Modifier.size(280.dp),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val radius = (size.minDimension / 3f) * scale
                
                // Outer glow ring
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(animatedColor.copy(alpha = 0.4f), Color.Transparent),
                        radius = radius * 1.5f
                    ),
                    radius = radius * 1.5f,
                    center = Offset(x = size.width / 2f, y = size.height / 2f)
                )
                
                // Main circle
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(animatedColor, animatedColor.copy(alpha = 0.7f))
                    ),
                    radius = radius,
                    center = Offset(x = size.width / 2f, y = size.height / 2f)
                )
            }
            
            // Seconds countdown in center
            Text(
                text = secondsLeft.toString(),
                style = MaterialTheme.typography.displayLarge.copy(
                    fontWeight = FontWeight.Light,
                    fontSize = 56.sp
                ),
                color = Color.White
            )
        }

        Spacer(modifier = Modifier.height(40.dp))

        Text(
            text = breathingState.label,
            style = MaterialTheme.typography.headlineLarge.copy(
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 4.sp
            ),
            color = animatedColor
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "Follow the circle",
            style = MaterialTheme.typography.bodyMedium,
            color = Color.White.copy(alpha = 0.6f)
        )
    }
}
