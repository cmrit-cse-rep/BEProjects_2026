# Image Classification Flow - Where It Happens

## 📍 Overview

Image classification in this project happens in **multiple stages** across different files. Here's the complete flow:

---

## 🔄 Classification Pipeline

### **1. Entry Point: API Endpoint**
**File**: `landslide-backend/app.py`  
**Function**: `image_predict()` (Line 416-442)

```python
@app.post("/image/predict")
def image_predict():
    # Receives uploaded image file
    # Extracts features
    # Runs ML and heuristic predictions
    # Fuses results
    # Returns classification
```

**What happens here:**
- Receives image file from HTTP POST request
- Opens and validates the image
- Triggers the classification pipeline

---

### **2. Feature Extraction**
**File**: `landslide-backend/model/image_features.py`  
**Function**: `extract_image_features()` (Line 15-131)

```python
def extract_image_features(img: Image.Image) -> List[float]:
    # Extracts 18 features from the image:
    # - RGB means and standard deviations
    # - Edge density
    # - HSV values
    # - Texture features (Laplacian variance, gradients)
    # - Color fractions (green, blue, brown)
    # Returns: List of 18 float values
```

**What happens here:**
- Resizes image to 256x256
- Extracts color statistics (RGB, HSV)
- Computes edge detection
- Calculates texture features (gradients, Laplacian)
- Analyzes color fractions (vegetation, sky, soil)
- Returns feature vector for classification

---

### **3. Machine Learning Classification**
**File**: `landslide-backend/app.py`  
**Function**: `ml_image_predict()` (Line 305-339)

```python
def ml_image_predict(features: List[float]) -> Optional[Dict[str, Any]]:
    # Loads trained ML model (image_model.joblib)
    # Predicts using scikit-learn model
    # Returns: {"label": "Landslide" or "NoLandslide", "probability": 0.0-1.0}
```

**What happens here:**
- Loads pre-trained model from `models/image_model.joblib`
- Uses scikit-learn's `predict_proba()` method
- Classifies as "Landslide" or "NoLandslide"
- Returns probability/confidence score
- Determines risk level (Low/Medium/High)

**Model Location**: `landslide-backend/models/image_model.joblib`

---

### **4. Heuristic-Based Classification**
**File**: `landslide-backend/app.py`  
**Function**: `heuristic_image_predict()` (Line 192-302)

```python
def heuristic_image_predict(features: List[float], sensitivity: str = "normal", mode: str = "standard") -> Dict[str, Any]:
    # Rule-based classification using feature thresholds
    # Analyzes:
    #   - Brown color (soil/rock indicators)
    #   - Edge density (terrain texture)
    #   - Vegetation/sky penalties
    #   - Texture strength
    # Returns: {"label": "Landslide" or "NoLandslide", "probability": 0.0-1.0}
```

**What happens here:**
- Analyzes extracted features using rule-based logic
- Calculates brown score (soil/rock color)
- Evaluates texture indicators (edges, gradients)
- Applies vegetation/sky penalties (reduces false positives)
- Adjusts thresholds based on sensitivity and mode
- Returns classification and probability

**Key Logic:**
- High brown color + high texture → Higher landslide probability
- High green (vegetation) → Lower probability
- High blue (sky) → Lower probability
- Dynamic threshold based on evidence strength

---

### **5. Result Fusion**
**File**: `landslide-backend/app.py`  
**Function**: `fuse_image_results()` (Line 342-413)

```python
def fuse_image_results(ml_result, heur_result, sensitivity="normal") -> Dict[str, Any]:
    # Combines ML and heuristic predictions
    # Uses conservative fusion to reduce false positives
    # Returns final classification
```

**What happens here:**
- **Case 1**: If ML is very confident (≥0.95) → Trust ML
- **Case 2**: If both agree on "Landslide" → Average probabilities
- **Case 3**: If they disagree → Use conservative approach (prefer "NoLandslide" unless very strong evidence)
- **Case 4**: High sensitivity mode → Favor recall (fewer misses)

**Fusion Rules:**
- ML confidence ≥ 0.95 → Use ML result
- Both agree → Average probabilities
- Disagreement → Conservative default (prefer NoLandslide)
- High sensitivity → Relax thresholds for better recall

---

## 📊 Complete Flow Diagram

```
User uploads image
    ↓
POST /image/predict (app.py:416)
    ↓
extract_image_features() (image_features.py:15)
    ↓
    ├─→ ml_image_predict() (app.py:305)
    │   └─→ Uses image_model.joblib
    │   └─→ Returns: {"label": "Landslide"/"NoLandslide", "probability": 0.0-1.0}
    │
    └─→ heuristic_image_predict() (app.py:192)
        └─→ Rule-based analysis
        └─→ Returns: {"label": "Landslide"/"NoLandslide", "probability": 0.0-1.0}
    ↓
fuse_image_results() (app.py:342)
    ↓
Final classification result
    ↓
Return JSON response to user
```

---

## 🎯 Key Classification Points

### **Primary Classification Functions:**

1. **`ml_image_predict()`** (Line 305)
   - **Location**: `landslide-backend/app.py`
   - **Type**: Machine Learning (supervised)
   - **Model**: Trained scikit-learn classifier
   - **Input**: 18 feature vector
   - **Output**: Classification + probability

2. **`heuristic_image_predict()`** (Line 192)
   - **Location**: `landslide-backend/app.py`
   - **Type**: Rule-based (heuristic)
   - **Logic**: Feature threshold analysis
   - **Input**: 18 feature vector
   - **Output**: Classification + probability

3. **`fuse_image_results()`** (Line 342)
   - **Location**: `landslide-backend/app.py`
   - **Type**: Ensemble/Fusion
   - **Purpose**: Combines ML + heuristic
   - **Output**: Final classification

---

## 🔍 Feature Extraction Details

**File**: `landslide-backend/model/image_features.py`

The 18 features extracted are:
1. Mean RGB values (3 features)
2. Standard deviation RGB (3 features)
3. Edge density
4. Mean Saturation, Value (2 features)
5. Grayscale entropy
6. Laplacian variance (texture)
7. Diagonal edge ratio
8. Gradient magnitude mean/std (2 features)
9. Color fractions: green, blue, brown, brown_hue (4 features)

---

## 📁 File Locations Summary

| Component | File | Function | Line |
|-----------|------|----------|------|
| **API Endpoint** | `app.py` | `image_predict()` | 416 |
| **Feature Extraction** | `image_features.py` | `extract_image_features()` | 15 |
| **ML Classification** | `app.py` | `ml_image_predict()` | 305 |
| **Heuristic Classification** | `app.py` | `heuristic_image_predict()` | 192 |
| **Result Fusion** | `app.py` | `fuse_image_results()` | 342 |
| **Trained Model** | `models/image_model.joblib` | - | - |

---

## 💡 How to Test Classification

1. **Via API**:
   ```bash
   curl -X POST -F "file=@image.jpg" http://localhost:5000/image/predict
   ```

2. **Via Web Interface**:
   - Go to `/` endpoint
   - Upload image in "By Image" section
   - Click "Predict"

3. **With Parameters**:
   ```bash
   curl -X POST -F "file=@image.jpg" -F "sensitivity=high" -F "mode=satellite" http://localhost:5000/image/predict
   ```

---

## 🎓 Summary

**Image classification happens in 3 main places:**

1. **`ml_image_predict()`** - Machine learning model prediction
2. **`heuristic_image_predict()`** - Rule-based classification
3. **`fuse_image_results()`** - Combines both for final result

All orchestrated by **`image_predict()`** API endpoint, which receives the image, extracts features, runs both classifiers, fuses results, and returns the final classification.

