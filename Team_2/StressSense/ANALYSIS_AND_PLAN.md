# StressSense Project Analysis & Implementation Plan

## 1. Existing Project Overview
The `StressSense` project is a distributed stress monitoring system consisting of a Wear OS application (data collector) and an Android Mobile application (data processor & UI). It currently establishes a basic data connection, collects limited sensor data (Heart Rate, Accelerometer), and contains a scaffold for On-Device Machine Learning (TensorFlow Lite).

### Architecture
*   **Watch App**: Collects raw sensor data using Android `SensorManager` and transmits it via Google Play Services Wearable Data Layer (`DataClient`).
*   **Mobile App**: Listens for data events (`WearableListenerService`), persists data to a local database (Room), and contains a utility class for TFLite inference (`StressPredictor`).

## 2. File-by-File Analysis

### Root & Configuration
*   **`build.gradle.kts` (Project)**: Standard setup.
*   **`app/build.gradle.kts`**:
    *   **Modules**: Hilt (DI), Room (DB), TFLite (ML), WorkManager, Wearable.
    *   **SDK**: Min 26, Target 36.
*   **`wear/build.gradle.kts`**:
    *   **Modules**: Health Services, Wearable, Hilt.
    *   **SDK**: Min 30, Target 36.

### Mobile App Module (`app`)
*   **`ml/StressPredictor.kt`**:
    *   **Status**: Implemented.
    *   **Function**: Wrapper for `stress_model.tflite`. Handles model loading and basic inference.
    *   **Gap**: No code currently calls this. Input shape is dynamic, but data preprocessing to match this shape is missing.
*   **`data/receiver/WearableDataListenerService.kt`**:
    *   **Status**: Partially Implemented.
    *   **Function**: Listens to `/sensor_data` path. Extracts `heart_rate`, `steps`, and `motion`.
    *   **Gap**: It looks for `steps` which is NOT sent by the watch. It handles single-point data, not batches/streams.
*   **`data/local/SensorDataDao.kt`** (Inferred): Database access object.

### Watch App Module (`wear`)
*   **`service/SensorDataService.kt`**:
    *   **Status**: Basic Implementation.
    *   **Function**: Uses `SensorManager` to get `TYPE_HEART_RATE` and `TYPE_ACCELEROMETER`.
    *   **Logic**: Updates `latestHeartRate` and `latestMotion` on change. A coroutine sends a snapshot of these values every 15 seconds.
    *   **Gap**:
        *   **Steps**: Not collected.
        *   **HRV/IBI**: Not collected.
        *   **Data Loss**: Any sensor change between the 15s interval is lost. Only the *last* value is sent.
        *   **Efficiency**: Frequent wake-ups for transmission.
        *   **Buffering**: No explicit offline buffering.

## 3. Identified Gaps

| Feature | Current State | Target State | Gap |
| :--- | :--- | :--- | :--- |
| **Sensor Data** | HR (Snapshot), Acceleration (Snapshot) | HR (Continuous), HRV/IBI, Acceleration (Continuous), Steps | Need continuous buffering and additional sensor types. |
| **Data Transfer** | Periodic Snapshot (15s) | Batch Sync (Buffer based) | Need to implement a buffer queue and send arrays of data instead of single floats. |
| **ML Inference** | `StressPredictor` class exists | End-to-end pipeline | Need a manager to pull data, preprocess (sliding window), and run reference. |
| **UI** | Unknown/Basic | Stress Gauge, Timeline, Alerts | Need to build visual components. |

## 4. Incremental Implementation Plan

### Phase 1: Watch Sensor & Data Layer Upgrade (Priority)
1.  **Refactor `SensorDataService`**:
    *   Switch to accumulating data in a `List<SensorReading>`.
    *   Implement "Batch Sending": Send a payload every `N` samples or `T` minutes.
    *   Add `Step Counter` support.
    *   Add `HRV/IBI` simulation (since raw IBI is limited on standard APIs) or attempt `HealthServices` implementation if supported.
2.  **Update Data Protocol**:
    *   Change `DataMap` to store `FloatArray` or `LongArray` for history, rather than single scalar values.

### Phase 2: Mobile Data Receiver
1.  **Update `WearableDataListenerService`**:
    *   Handle the new batched data format.
    *   Insert bulk data into Room DB (optimize with `@Insert` list).

### Phase 3: ML Integration
1.  **Preprocessing Logic**:
    *   Create a `StressInferenceWorker` (WorkManager).
    *   Query last N minutes of data from Room.
    *   Normalize and format into `FloatArray` for `StressPredictor`.
2.  **Rule-Based Fallback**:
    *   Implement basic HRV-based stress score if ML model is uncertain.

### Phase 4: UI Enhancements
1.  **Mobile**: Add Stress Gauge and Timeline (Compose).
2.  **Watch**: Add Live Indicator.

## 5. Data Flow Diagram

```mermaid
graph LR
    subgraph Watch
        S[Sensors] -->|Raw Data| B[Buffer]
        B -->|Batch (JSON/Bytes)| DL[Data Layer API]
    end
    
    subgraph Mobile
        DL -->|Receive Batch| LS[Listener Service]
        LS -->|Bulk Insert| DB[(Room DB)]
        DB -->|Query Window| PP[Preprocessing]
        PP -->|Tensor| ML[StressPredictor]
        ML -->|Score| UI[Dashboard UI]
    end
```

## 6. Battery & Privacy
*   **Battery**: Batching data sends (e.g., every 5 mins or when buffer is full) reduces radio usage significantly compared to every 15s.
*   **Privacy**: All data remains on-device (Room DB). No network calls to cloud.

