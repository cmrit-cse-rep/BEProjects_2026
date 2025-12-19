## StressSense – Android & Wear OS

StressSense is a multi-module project consisting of an **Android phone app** and a **Wear OS companion app**.  
The phone app provides stress monitoring, a wellness dashboard, relaxation tools, hospital lookup, journaling, and a **mobile-number OTP login + SOS emergency alerts**.  
The Wear app continuously collects sensor data (HR/motion placeholder + steps placeholder) and streams it to the phone via the Wearable Data Layer.

---

## 1. Modules Overview

- **`app` (phone)**  
  - Modern Compose dashboard (`ModernDashboardScreen`) based on real `StressPrediction` data from Room.  
  - Relax tools (breathing, grounding, journaling).  
  - Nearby hospitals screen.  
  - SOS screen with **trusted contacts** and emergency messaging.  
  - **OTP mobile-number login** (Firebase Phone Auth).  
  - Persistent user data via Room + DataStore.

- **`wear` (Wear OS)**  
  - Standalone Wear OS app (`com.example.stresssense.wear`).  
  - Foreground service `SensorDataService` for accelerometer + placeholder HR/steps.  
  - Sends sensor payloads over the Wearable Data Layer to the phone (`/sensor_data` path).  
  - Simple Compose UI to request permissions and start the foreground service.

---

## 2. Requirements

- **Android Studio** Hedgehog or newer.
- **JDK 11** (project uses `JavaVersion.VERSION_11`).
- **Android SDK**:
  - `compileSdk` / `targetSdk` = **36**
  - `minSdk`:
    - Phone: **26**
    - Wear: **30**
- **Firebase project** for phone-number login:
  - Enabled **Phone Authentication** in Firebase Authentication.
  - `google-services.json` for the phone app.

---

## 3. Project Setup

### 3.1. Clone & Open

1. Clone the repo to your machine.
2. Open the **project root** (the directory containing `settings.gradle.kts`) in Android Studio.
3. Let Gradle sync and download dependencies.

### 3.2. Firebase Configuration (Phone App)

1. Go to the Firebase console and create a project if you don’t have one.
2. Add an **Android app**:
   - **Package Name**: `com.example.stresssense`
3. Download the generated **`google-services.json`**.
4. Place it at:
   - `app/google-services.json`
5. Confirm:
   - The root `build.gradle.kts` applies `com.google.gms.google-services` at the top level.  
   - The `app/build.gradle.kts` plugin block includes:
     - `id("com.google.gms.google-services")`

### 3.3. Build

From the project root:

```bash
./gradlew :app:assembleDebug
./gradlew :wear:assembleDebug
```

Both modules should now compile successfully.

---

## 4. Phone App – Features & Flows

### 4.1. Login – Mobile Number + OTP

- **Entry point**: `MainActivity` (`com.example.stresssense.MainActivity`).
- On launch, the app uses `SessionViewModel` + `UserPreferencesRepository` to decide:
  - If `isLoggedIn == false` → show **`LoginScreen`** (mobile OTP flow).
  - If `isLoggedIn == true` → show the main tabbed UI (Dashboard / SOS / Hospitals / Relax).

**Key classes:**

- `auth/LoginViewModel.kt`
  - Manages `LoginUiState` (`name`, `phoneNumber`, `otpCode`, `isOtpSent`, `isLoading`, `errorMessage`).
  - Uses `FirebaseAuth` + `PhoneAuthProvider` to:
    - Send OTP to the entered phone number.
    - Verify OTP and sign in.
  - On successful sign-in:
    - Calls `UserPreferencesRepository.setUserLoggedIn(name, phoneNumber)` to **persist**:
      - `is_logged_in = true`
      - `phone_number = <user_number>`
      - `user_name = <user_name_or_default>`

- `auth/LoginScreen.kt`
  - Simple Compose UI:
    - TextField for **Name**.
    - TextField for **Mobile number (with country code)**.
    - **Send OTP** button → triggers `LoginViewModel.sendOtp(...)`.
    - Conditional **OTP input** + **Verify & Continue** button.
  - Reacts to `LoginEvent.LoginSuccess` and switches to the main app via `SessionViewModel` state.

- `data/UserPreferencesRepository.kt`
  - Backed by **Preferences DataStore** (`user_prefs`).
  - Exposes `Flow<UserPreferences>` with:
    - `isLoggedIn`
    - `phoneNumber`
    - `userName`
  - Ensures **persistence across app restarts**.

### 4.2. Dashboard – Real Stress Data Only

- **Screen**: `dashboard/ModernDashboardScreen.kt`
- **ViewModel**: `dashboard/DashboardViewModel.kt`
- Data source: `StressPredictionDao` + `StressSenseDatabase`.
- Uses:
  - `getPredictionsSince(0)` to stream all predictions.
  - Maps database rows to `GraphPoint` lists for weekly/monthly charts.
  - **No demo/mock generators** – only uses stored predictions.

**Note**: All “Generate Demo Data” UI and data-paths were removed from:

- `ModernDashboardScreen`  
- `DashboardViewModel`  
- `JournalScreen`  
- Comments in `StressPredictionDao`

### 4.3. SOS – Emergency Alerts

- **Screen**: `sos/SosScreen.kt`
- **ViewModel**: `sos/SosViewModel.kt`
- **Manager**: `sos/SosManager.kt`
- **Data**: `TrustedContact` entity + `TrustedContactDao`.

**Emergency contacts:**

- `TrustedContact` (Room entity in `trusted_contacts` table) contains:
  - `name`
  - `phoneNumber`
- `SosScreen`:
  - Lets the user **pick phone numbers** from contacts and save as trusted contacts.
  - Shows a **list** of saved contacts with delete buttons.
  - Provides:
    - A large **TRIGGER SOS** button.
    - A configurable **“Emergency message”** field.

**Alert sending logic:**

- When SOS is triggered and there’s at least one contact:
  - `SosScreen` calls `SosViewModel.triggerSos(message)`.
  - `SosViewModel` delegates to `SosManager.sendSosMessages(message)`.

`SosManager`:

- Injected with:
  - `Context`
  - `TrustedContactDao`
  - `UserPreferencesRepository`
- Validates `SEND_SMS` and `ACCESS_FINE_LOCATION` permissions (as a final safeguard).
- Fetches:
  - All trusted contacts.
  - User name + phone from `UserPreferencesRepository`.
  - Best-effort last location via `FusedLocationProviderClient`.
- Builds an **alert SMS** for each contact:
  - **User name**.
  - **Emergency message** (user-entered text).
  - **Timestamp**.
  - Optional **Google Maps link** if location is available.
- Sends via `SmsManager.sendTextMessage`.
- **No hardcoded demo values**; purely uses persisted contacts & user data.

### 4.4. Data Persistence

- **Local DB**: `StressSenseDatabase` (Room)
  - Entities: `SensorData`, `StressPrediction`, `TrustedContact`, `JournalEntry`.
  - DAOs: `SensorDataDao`, `StressPredictionDao`, `TrustedContactDao`, `JournalEntryDao`.
- **Preferences**: `UserPreferencesRepository` (DataStore)
  - Stores login state and real user identity (name + phone).

---

## 5. Wear OS App – Features & Flows

### 5.1. App Structure

- Application class: `wear/WearApplication.kt` (`@HiltAndroidApp`).
- Manifest package/namespace: `com.example.stresssense.wear`.
- Entry Activity (manifest): `.wear.presentation.MainActivity`
  - FQCN: `com.example.stresssense.wear.presentation.MainActivity`
  - UI theme: `com.example.stresssense.wear.presentation.theme.StressSenseTheme`.
- Foreground Service: `.wear.service.SensorDataService`
  - FQCN: `com.example.stresssense.wear.service.SensorDataService`.

### 5.2. Permissions & Manifest

`wear/src/main/AndroidManifest.xml` includes:

- `WAKE_LOCK`
- `FOREGROUND_SERVICE`
- `BODY_SENSORS`
- `ACTIVITY_RECOGNITION`
- `FOREGROUND_SERVICE_HEALTH`
- `<uses-feature android:name="android.hardware.type.watch" />`
- Foreground service registered with `android:foregroundServiceType="health"`.

### 5.3. Wear Main Activity

`com.example.stresssense.wear.presentation.MainActivity`:

- On `onCreate`, sets Compose content:

  - Wraps UI in `StressSenseTheme`.
  - Shows `SensorActivationScreen`.

`SensorActivationScreen`:

- Requests **BODY_SENSORS** and **ACTIVITY_RECOGNITION** dynamically using Accompanist Permissions.
- Once permissions are granted:
  - Shows “Permissions granted!” message.
  - Provides **Start Service** button.
    - Calls `context.startForegroundService(Intent(context, SensorDataService::class.java))`.
- If permissions are not granted:
  - Prompts user and offers **Request Permissions** button.

### 5.4. Wear Sensor Service

`com.example.stresssense.wear.service.SensorDataService`:

- Foreground service that:
  - Initializes:
    - `PassiveMonitoringClient` from Health Services (placeholder; HR/steps logic minimized to avoid API conflicts).
    - `SensorManager` + accelerometer.
  - Creates a **notification channel** and starts itself in the foreground.
  - Registers an accelerometer listener and captures `latestMotion` as a `MutableStateFlow<FloatArray>`.
  - Runs a **transmission loop** (`TRANSMISSION_INTERVAL_MS = 15s`):
    - Builds a `PutDataMapRequest` at `/sensor_data` with:
      - `KEY_HEART_RATE` – current HR value (placeholder; default 0.0 unless populated).
      - `KEY_STEPS` – current steps (placeholder; 0L by default).
      - `KEY_MOTION` – last accelerometer vector.
      - `timestamp` – current millis.
    - Sends it via `Wearable.getDataClient(this).putDataItem(...).await()`.

- On destroy:
  - Cancels coroutine job.
  - Unregisters sensor listener.

> Note: Direct usage of evolving Health Services APIs (e.g., `getCapabilities`, `getDailyStats`) has been **simplified** to maintain compatibility and compile cleanly. The structure is ready for re-enabling richer HR/steps integration once API versions are locked in.

---

## 6. Running & Pairing

### 6.1. Phone App

1. Build and install debug APK:

   ```bash
   ./gradlew :app:installDebug
   ```

2. Launch on a device/emulator with:
   - SMS capability (for SOS & Firebase phone auth).
   - Location permissions (for SOS location link).

3. Flow:
   - Enter name + phone number on the login screen.
   - Complete OTP verification.
   - Explore Dashboard / SOS / Hospitals / Relax tabs.
   - Add trusted contacts in **SOS**, then trigger an SOS with a custom message.

### 6.2. Wear App

1. Build and install debug APK:

   ```bash
   ./gradlew :wear:installDebug
   ```

2. Use a **Wear OS 3+ device or emulator**.
3. Launch the Wear app:
   - Grant health-related permissions when requested.
   - Tap **Start Service** to begin streaming sensor data.

4. Ensure the phone and watch are **paired** and that the phone app’s `WearableDataListenerService` can receive `/sensor_data` updates.

---

## 7. Notes on Removed Demo / Mock Data

- All **“Generate Demo Data”** buttons and related random data generators have been removed from:
  - Dashboard UI & ViewModel.
  - Journal screen.
  - DAO comments were updated to reflect **real data usage only**.
- No hardcoded demo/sample/mock/test data is generated at runtime.
- All data used by the app now originates from:
  - Actual sensor streams (phone + wear).
  - User inputs (journal, contacts, login info).
  - Persisted state in Room / DataStore.

---

## 8. Troubleshooting

- **Firebase phone auth not working**:
  - Ensure the phone number format includes country code (e.g., `+1...`).
  - Verify that Phone Authentication is enabled in Firebase.
  - Check that `google-services.json` is in `app/` and matches package `com.example.stresssense`.

- **SOS SMS not sent**:
  - Confirm `SEND_SMS` permission is granted on the phone.
  - Ensure at least one trusted contact exists in the SOS screen.

- **Wear app not sending data**:
  - Confirm permissions (BODY_SENSORS, ACTIVITY_RECOGNITION) are granted on the watch.
  - Check that the foreground service notification is visible on Wear.
  - Verify watch–phone pairing and that the phone app is installed and running.


