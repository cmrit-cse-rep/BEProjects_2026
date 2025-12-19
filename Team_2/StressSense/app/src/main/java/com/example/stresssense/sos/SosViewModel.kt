package com.example.stresssense.sos

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.stresssense.data.UserPreferencesRepository
import com.example.stresssense.data.local.TrustedContact
import com.example.stresssense.data.local.TrustedContactDao
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

@HiltViewModel
class SosViewModel @Inject constructor(
    private val contactDao: TrustedContactDao,
    private val sosManager: SosManager,
    private val userPreferencesRepository: UserPreferencesRepository
) : ViewModel() {

    val contacts: StateFlow<List<TrustedContact>> = contactDao.getAllContacts()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val userPhoneNumber: StateFlow<String> = userPreferencesRepository.userPreferences
        .map { it.phoneNumber }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "")

    fun addContact(name: String, number: String) {
        viewModelScope.launch {
            contactDao.insertContact(TrustedContact(name = name, phoneNumber = number))
        }
    }

    fun deleteContact(contact: TrustedContact) {
        viewModelScope.launch {
            contactDao.deleteContact(contact)
        }
    }

    suspend fun triggerSos(message: String) {
        sosManager.sendSosMessages(message)
    }
}