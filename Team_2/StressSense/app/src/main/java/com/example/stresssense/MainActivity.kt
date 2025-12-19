package com.example.stresssense

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.LocalHospital
import androidx.compose.material.icons.filled.Spa
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.stresssense.auth.LoginScreen
import com.example.stresssense.data.UserPreferencesRepository
import com.example.stresssense.dashboard.DashboardScreen
import com.example.stresssense.hospitals.NearbyHospitalsScreen
import com.example.stresssense.relax.RelaxScreen
import com.example.stresssense.sos.SosScreen
import com.example.stresssense.ui.theme.StressSenseTheme
import dagger.hilt.android.AndroidEntryPoint
import dagger.hilt.android.lifecycle.HiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject
import androidx.hilt.navigation.compose.hiltViewModel

sealed class Screen(val route: String, val label: String, val icon: ImageVector) {
    object Dashboard : Screen("dashboard", "Dashboard", Icons.Default.Dashboard)
    object Sos : Screen("sos", "SOS", Icons.Default.Warning)
    object Hospitals : Screen("hospitals", "Hospitals", Icons.Default.LocalHospital)
    object Relax : Screen("relax", "Relax", Icons.Default.Spa)
}

val items = listOf(
    Screen.Dashboard,
    Screen.Sos,
    Screen.Hospitals,
    Screen.Relax,
)

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            StressSenseTheme {
                val sessionViewModel: SessionViewModel = hiltViewModel()
                val userPrefs by sessionViewModel.userPreferences.collectAsState()

                if (!userPrefs.isLoggedIn) {
                    LoginScreen(onLoginSuccess = { /* state flow will update automatically */ })
                } else {
                    val navController = rememberNavController()
                    Scaffold(
                        bottomBar = {
                            NavigationBar {
                                val navBackStackEntry by navController.currentBackStackEntryAsState()
                                val currentDestination = navBackStackEntry?.destination
                                items.forEach { screen ->
                                    NavigationBarItem(
                                        icon = { Icon(screen.icon, contentDescription = null) },
                                        label = { Text(screen.label) },
                                        selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true,
                                        onClick = {
                                            navController.navigate(screen.route) {
                                                popUpTo(navController.graph.findStartDestination().id) {
                                                    saveState = true
                                                }
                                                launchSingleTop = true
                                                restoreState = true
                                            }
                                        }
                                    )
                                }
                            }
                        }
                    ) { innerPadding ->
                        NavHost(
                            navController = navController,
                            startDestination = Screen.Dashboard.route,
                            modifier = Modifier.padding(innerPadding)
                        ) {
                            composable(Screen.Dashboard.route) { DashboardScreen() }
                            composable(Screen.Sos.route) { SosScreen() }
                            composable(Screen.Hospitals.route) { NearbyHospitalsScreen() }
                            composable(Screen.Relax.route) { RelaxScreen() }
                        }
                    }
                }
            }
        }
    }
}

@HiltViewModel
class SessionViewModel @Inject constructor(
    userPreferencesRepository: UserPreferencesRepository
) : ViewModel() {
    val userPreferences: StateFlow<com.example.stresssense.data.UserPreferences> =
        userPreferencesRepository.userPreferences
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), com.example.stresssense.data.UserPreferences())
}
