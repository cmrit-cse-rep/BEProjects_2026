package com.example.stresssense.relax

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

data class GroundingStep(val number: String, val instruction: String)

private val groundingSteps = listOf(
    GroundingStep("5", "Look around and name five things you can see."),
    GroundingStep("4", "Pay attention to four things you can touch and notice their texture."),
    GroundingStep("3", "Identify three different sounds you can hear."),
    GroundingStep("2", "Notice two things you can smell."),
    GroundingStep("1", "Focus on one thing you can taste or imagine a comforting taste."),
)

@Composable
fun GroundingExerciseScreen(modifier: Modifier = Modifier) {
    var currentStepIndex by remember { mutableIntStateOf(0) }

    Column(
        modifier = modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        if (currentStepIndex < groundingSteps.size) {
            val step = groundingSteps[currentStepIndex]
            Text(
                text = "${step.number}-senses exercise",
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = step.instruction,
                style = MaterialTheme.typography.bodyLarge
            )
            Spacer(modifier = Modifier.height(32.dp))
            Button(onClick = { currentStepIndex++ }) {
                Text("Next")
            }
        } else {
            Text(
                text = "Exercise complete",
                style = MaterialTheme.typography.headlineMedium
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = { currentStepIndex = 0 }) {
                Text("Restart")
            }
        }
    }
}
