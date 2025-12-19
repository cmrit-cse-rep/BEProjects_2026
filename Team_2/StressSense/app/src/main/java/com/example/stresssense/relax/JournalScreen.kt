package com.example.stresssense.relax

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun JournalScreen(
    modifier: Modifier = Modifier,
    viewModel: JournalViewModel = hiltViewModel()
) {
    var noteText by remember { mutableStateOf("") }
    var selectedMood by remember { mutableStateOf("😊") }
    val entries by viewModel.journalEntries.collectAsState()

    val moods = listOf("😊", "😢", "😡", "😰", "😴", "😌", "🤔", "😎")

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Journal your feelings",
            style = MaterialTheme.typography.headlineSmall
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "How are you feeling right now?",
            style = MaterialTheme.typography.bodyMedium
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Mood selector
        androidx.compose.foundation.layout.Row(
            modifier = Modifier.fillMaxWidth(),
        ) {
            moods.forEach { mood ->
                OutlinedButton(
                    onClick = { selectedMood = mood },
                    modifier = Modifier
                        .padding(end = 8.dp)
                        .weight(1f),
                    enabled = selectedMood != mood
                ) {
                    Text(text = mood)
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = noteText,
            onValueChange = { noteText = it },
            label = { Text("Write a short note") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 3
        )

        Spacer(modifier = Modifier.height(12.dp))

        Button(
            onClick = {
                viewModel.addJournalEntry(selectedMood, noteText.trim())
                noteText = ""
            },
            enabled = noteText.isNotBlank() || selectedMood.isNotBlank(),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Save entry")
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Previous entries",
            style = MaterialTheme.typography.titleMedium
        )

        Spacer(modifier = Modifier.height(8.dp))

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 16.dp)
        ) {
            items(entries) { entry ->
                JournalEntryCard(entry = entry)
            }
        }
    }
}

@Composable
private fun JournalEntryCard(entry: com.example.stresssense.data.local.JournalEntry) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Mood: ${entry.mood}",
                style = MaterialTheme.typography.titleMedium
            )
            if (entry.note.isNotBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = entry.note,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = formatTimestamp(entry.timestamp),
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}

private fun formatTimestamp(timestamp: Long): String {
    val date = Date(timestamp)
    val formatter = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
    return formatter.format(date)
}
