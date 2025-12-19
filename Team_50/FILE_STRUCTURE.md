# 📁 ML API File Structure

Complete file structure of the `ml_api` directory.

```
ml_api/
│
├── 📄 Main Application Files
│   ├── app_attention.py          # Main Flask API (Attention-Enhanced LSTM) ⭐ PRIMARY
│   ├── app_enhanced.py           # Enhanced Flask API (alternative)
│   ├── app.py                    # Basic Flask API (legacy)
│
├── 🧠 Model Training Scripts
│   ├── train_attention_lstm.py   # Train Attention-Enhanced LSTM models
│   ├── train_lstm_enhanced.py    # Train Enhanced LSTM models
│   ├── train_lstm.py             # Train basic LSTM models
│   ├── train_xgb_enhanced.py     # Train Enhanced XGBoost models
│   ├── train_xgb.py              # Train basic XGBoost models
│
├── 🧪 Testing & Demo Scripts
│   ├── test_attention_api.py      # Test Attention-Enhanced API
│   ├── test_enhanced_api.py      # Test Enhanced API
│   ├── test_enhanced_deployment.py  # Test deployment
│   ├── test_api.py               # Test basic API
│   ├── final_attention_test.py   # Final attention model tests
│   ├── demo_attention_models.py  # Demo attention models
│   ├── batch_predict.py          # Batch prediction script
│
├── 🤖 Machine Learning Models
│   │
│   ├── Attention-Enhanced LSTM Models (Primary - Used by app_attention.py)
│   │   ├── lstm_attention_davangere_Cotton.keras
│   │   ├── lstm_attention_davangere_Cotton_scaler.pkl
│   │   ├── lstm_attention_davangere_Maize.keras
│   │   ├── lstm_attention_davangere_Maize_scaler.pkl
│   │   ├── lstm_attention_davangere_Ragi.keras
│   │   ├── lstm_attention_davangere_Ragi_scaler.pkl
│   │   ├── lstm_attention_davangere_Rice.keras
│   │   ├── lstm_attention_davangere_Rice_scaler.pkl
│   │   ├── lstm_attention_davangere_Tomato.keras
│   │   ├── lstm_attention_davangere_Tomato_scaler.pkl
│   │   ├── lstm_attention_gangavathi_Maize.keras
│   │   ├── lstm_attention_gangavathi_Maize_scaler.pkl
│   │   ├── lstm_attention_gangavathi_Rice.keras
│   │   ├── lstm_attention_gangavathi_Rice_scaler.pkl
│   │   ├── lstm_attention_HBhalli_Maize.keras
│   │   ├── lstm_attention_HBhalli_Maize_scaler.pkl
│   │   ├── lstm_attention_HBhalli_Ragi.keras
│   │   ├── lstm_attention_HBhalli_Ragi_scaler.pkl
│   │   ├── lstm_attention_hospet_Rice.keras
│   │   ├── lstm_attention_hospet_Rice_scaler.pkl
│   │   ├── lstm_attention_hospet_Tomato.keras
│   │   └── lstm_attention_hospet_Tomato_scaler.pkl
│   │
│   ├── Enhanced LSTM Models
│   │   ├── lstm_enhanced_davangere_Cotton.keras
│   │   ├── lstm_enhanced_davangere_Cotton_scaler.pkl
│   │   ├── lstm_enhanced_davangere_Maize.keras
│   │   ├── lstm_enhanced_davangere_Maize_scaler.pkl
│   │   ├── lstm_enhanced_davangere_Ragi.keras
│   │   ├── lstm_enhanced_davangere_Ragi_scaler.pkl
│   │   ├── lstm_enhanced_davangere_Rice.keras
│   │   ├── lstm_enhanced_davangere_Rice_scaler.pkl
│   │   ├── lstm_enhanced_davangere_Tomato.keras
│   │   ├── lstm_enhanced_davangere_Tomato_scaler.pkl
│   │   ├── lstm_enhanced_gangavathi_Maize.keras
│   │   ├── lstm_enhanced_gangavathi_Maize_scaler.pkl
│   │   ├── lstm_enhanced_gangavathi_Rice.keras
│   │   ├── lstm_enhanced_gangavathi_Rice_scaler.pkl
│   │   ├── lstm_enhanced_HBhalli_Maize.keras
│   │   ├── lstm_enhanced_HBhalli_Maize_scaler.pkl
│   │   ├── lstm_enhanced_HBhalli_Ragi.keras
│   │   ├── lstm_enhanced_HBhalli_Ragi_scaler.pkl
│   │   ├── lstm_enhanced_hospet_Rice.keras
│   │   ├── lstm_enhanced_hospet_Rice_scaler.pkl
│   │   ├── lstm_enhanced_hospet_Tomato.keras
│   │   └── lstm_enhanced_hospet_Tomato_scaler.pkl
│   │
│   ├── Basic LSTM Models
│   │   ├── lstm_davangere_Cotton.keras
│   │   ├── lstm_davangere_Cotton_scaler.pkl
│   │   ├── lstm_davangere_Maize.keras
│   │   ├── lstm_davangere_Maize_scaler.pkl
│   │   ├── lstm_davangere_Ragi.keras
│   │   ├── lstm_davangere_Ragi_scaler.pkl
│   │   ├── lstm_davangere_Rice.keras
│   │   ├── lstm_davangere_Rice_scaler.pkl
│   │   ├── lstm_davangere_Tomato.keras
│   │   ├── lstm_davangere_Tomato_scaler.pkl
│   │   ├── lstm_gangavathi_Cotton.keras
│   │   ├── lstm_gangavathi_Cotton_scaler.pkl
│   │   ├── lstm_gangavathi_Maize.keras
│   │   ├── lstm_gangavathi_Maize_scaler.pkl
│   │   ├── lstm_gangavathi_Rice.keras
│   │   ├── lstm_gangavathi_Rice_scaler.pkl
│   │   ├── lstm_HBhalli_Maize.keras
│   │   ├── lstm_HBhalli_Maize_scaler.pkl
│   │   ├── lstm_HBhalli_Ragi.keras
│   │   ├── lstm_HBhalli_Ragi_scaler.pkl
│   │   ├── lstm_hospet_Tomato.keras
│   │   └── lstm_hospet_Tomato_scaler.pkl
│   │
│   └── Crop Recommendation Models
│       ├── ensemble_crop_recommendation.pkl    # Ensemble model for crop recommendations
│       ├── ensemble_scaler.pkl                  # Scaler for ensemble model
│       ├── feature_selector.pkl                 # Feature selector
│       ├── selected_features.pkl                # Selected features
│       ├── xgb_crop_recommendation.pkl          # XGBoost crop recommendation
│       ├── xgb_enhanced_crop_recommendation.pkl # Enhanced XGBoost
│       ├── xgb_le_crop.pkl                      # Label encoder for crops
│       └── xgb_le_market.pkl                    # Label encoder for markets
│
├── 🚀 Deployment Files
│   ├── oci-deploy.sh              # Oracle Cloud deployment script ⭐
│   ├── build.sh                   # Build script
│   ├── Dockerfile                 # Docker configuration
│   ├── Procfile                   # Process file (for Heroku/Render)
│   ├── render.yaml                # Render.com configuration
│   ├── requirements.txt           # Python dependencies ⭐
│   └── runtime.txt                # Python runtime version
│
├── 📚 Documentation
│   ├── STEP_BY_STEP_DEPLOYMENT.md # Step-by-step deployment guide
│   ├── OCI_DEPLOYMENT.md          # Oracle Cloud deployment guide
│   ├── OCI_QUICK_START.md         # OCI quick start guide
│   ├── DEPLOYMENT.md              # General deployment guide
│   └── FILE_STRUCTURE.md          # This file
│
├── 📊 Output Files
│   ├── predictions.csv            # Batch prediction results (CSV)
│   └── predictions.json           # Batch prediction results (JSON)
│
└── 📦 Directories
    ├── __pycache__/               # Python cache files
    └── venv/                     # Virtual environment (local development)
```

---

## 📋 File Categories

### ⭐ Primary Files (For Deployment)

These are the essential files needed for deployment:

1. **`app_attention.py`** - Main Flask API application (currently used)
2. **`requirements.txt`** - Python package dependencies
3. **`oci-deploy.sh`** - Deployment script for Oracle Cloud
4. **All `.keras` and `*_scaler.pkl` files** - Trained ML models

### 🎯 Model Files by Type

#### Attention-Enhanced LSTM (Primary)
- **Format**: `.keras` (model) + `_scaler.pkl` (scaler)
- **Markets**: davangere, gangavathi, HBhalli, hospet
- **Crops**: Cotton, Maize, Ragi, Rice, Tomato
- **Used by**: `app_attention.py`

#### Enhanced LSTM
- **Format**: `.keras` (model) + `_scaler.pkl` (scaler)
- **Used by**: `app_enhanced.py`

#### Basic LSTM
- **Format**: `.keras` (model) + `_scaler.pkl` (scaler)
- **Used by**: `app.py` (legacy)

#### Crop Recommendation Models
- **Format**: `.pkl` files
- **Models**: Ensemble, XGBoost variants
- **Used for**: Crop recommendation feature

### 🔧 Configuration Files

- **`requirements.txt`** - Python dependencies (Flask, TensorFlow, etc.)
- **`runtime.txt`** - Python version specification
- **`Dockerfile`** - Container configuration
- **`Procfile`** - Process configuration for PaaS
- **`render.yaml`** - Render.com deployment config

### 📝 Scripts

- **Training**: `train_*.py` - Scripts to train different model types
- **Testing**: `test_*.py` - API and model testing scripts
- **Deployment**: `oci-deploy.sh`, `build.sh` - Deployment automation

---

## 🎯 Key Files for Deployment

When deploying to Oracle Cloud, you need:

1. ✅ `app_attention.py` - Main API
2. ✅ `requirements.txt` - Dependencies
3. ✅ `oci-deploy.sh` - Deployment script
4. ✅ All model files (`.keras` and `*_scaler.pkl`)
5. ✅ Crop recommendation models (`.pkl` files)

The `oci-deploy.sh` script handles:
- Installing Python 3.10
- Installing dependencies from `requirements.txt`
- Setting up systemd service
- Starting the Flask API

---

## 📊 Model Count Summary

- **Attention-Enhanced LSTM**: 18 models (9 markets×crops × 2 files each)
- **Enhanced LSTM**: 18 models
- **Basic LSTM**: 18 models
- **Crop Recommendation**: 8 models
- **Total Model Files**: ~62 files

---

## 🔍 File Naming Convention

### LSTM Models
```
lstm_{type}_{market}_{crop}.keras
lstm_{type}_{market}_{crop}_scaler.pkl
```

Where:
- `{type}` = `attention`, `enhanced`, or empty (basic)
- `{market}` = `davangere`, `gangavathi`, `HBhalli`, `hospet`
- `{crop}` = `Cotton`, `Maize`, `Ragi`, `Rice`, `Tomato`

### Example
- `lstm_attention_davangere_Rice.keras` - Attention LSTM for Rice in Davangere
- `lstm_attention_davangere_Rice_scaler.pkl` - Scaler for the above model

---

## 📦 Dependencies

See `requirements.txt` for complete list. Main dependencies include:
- Flask (web framework)
- TensorFlow/Keras (ML models)
- NumPy, Pandas (data processing)
- scikit-learn (preprocessing)

---

**Last Updated**: Based on current project structure

