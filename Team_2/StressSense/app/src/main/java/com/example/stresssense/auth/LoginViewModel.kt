package com.example.stresssense.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.stresssense.data.UserPreferencesRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(
    val name: String = "",
    val phoneNumber: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

sealed class LoginEvent {
    object LoginSuccess : LoginEvent()
    data class Error(val message: String) : LoginEvent()
}

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val userPreferencesRepository: UserPreferencesRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    private val _events = Channel<LoginEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    fun onNameChanged(value: String) {
        _uiState.value = _uiState.value.copy(name = value, errorMessage = null)
    }

    fun onPhoneChanged(value: String) {
        // Filter to only allow digits
        val digits = value.filter { it.isDigit() }
        _uiState.value = _uiState.value.copy(phoneNumber = digits, errorMessage = null)
    }

    fun continueWithoutLogin() {
        val state = _uiState.value
        if (state.name.isBlank()) {
            _uiState.value = state.copy(errorMessage = "Please enter your name")
            return
        }
        if (state.phoneNumber.length < 10) {
            _uiState.value = state.copy(errorMessage = "Please enter a valid 10-digit phone number")
            return
        }
        _uiState.value = state.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            userPreferencesRepository.setUserLoggedIn(
                name = state.name,
                phoneNumber = state.phoneNumber
            )
            _events.send(LoginEvent.LoginSuccess)
            _uiState.value = _uiState.value.copy(isLoading = false)
        }
    }
}
