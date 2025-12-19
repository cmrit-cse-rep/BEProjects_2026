package com.example.stresssense.relax

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

@Composable
fun RelaxScreen(modifier: Modifier = Modifier) {
    // Directly show the breathing exercise for a focused relaxation experience
    BreathingExerciseScreen(modifier = modifier.fillMaxSize())
}
