package com.example.stresssense.relax

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.stresssense.data.local.JournalEntry
import com.example.stresssense.data.local.JournalEntryDao
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class JournalViewModel @Inject constructor(
    private val journalEntryDao: JournalEntryDao
) : ViewModel() {

    /**
     * Stream of all journal entries ordered by most recent first.
     */
    val journalEntries: StateFlow<List<JournalEntry>> =
        journalEntryDao.getAllEntries()
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5_000),
                initialValue = emptyList()
            )

    /**
     * Insert a new journal entry if either mood or note is not blank.
     */
    fun addJournalEntry(mood: String, note: String) {
        viewModelScope.launch {
            if (mood.isNotBlank() || note.isNotBlank()) {
                val entry = JournalEntry(
                    timestamp = System.currentTimeMillis(),
                    mood = mood,
                    note = note
                )
                journalEntryDao.insert(entry)
            }
        }
    }
}
