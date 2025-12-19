package com.example.stresssense.data

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.userDataStore by preferencesDataStore(name = "user_prefs")

data class UserPreferences(
    val isLoggedIn: Boolean = false,
    val phoneNumber: String = "",
    val userName: String = ""
)

@Singleton
class UserPreferencesRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {

    private object Keys {
        val IS_LOGGED_IN = booleanPreferencesKey("is_logged_in")
        val PHONE_NUMBER = stringPreferencesKey("phone_number")
        val USER_NAME = stringPreferencesKey("user_name")
    }

    val userPreferences: Flow<UserPreferences> = context.userDataStore.data.map { prefs ->
        UserPreferences(
            isLoggedIn = prefs[Keys.IS_LOGGED_IN] ?: false,
            phoneNumber = prefs[Keys.PHONE_NUMBER] ?: "",
            userName = prefs[Keys.USER_NAME] ?: ""
        )
    }

    suspend fun setUserLoggedIn(name: String, phoneNumber: String) {
        context.userDataStore.edit { prefs ->
            prefs[Keys.IS_LOGGED_IN] = true
            prefs[Keys.PHONE_NUMBER] = phoneNumber
            prefs[Keys.USER_NAME] = name
        }
    }
}


