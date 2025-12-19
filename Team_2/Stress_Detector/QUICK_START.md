# 🚀 Quick Start Guide - Stress Detector

## Prerequisites
- Python 3.10+ with virtual environment activated
- All dependencies installed (see requirements.txt)
- WESAD dataset in `WESAD/` folder

---

## ✅ Verify System is Ready

```bash
# Fast verification (2 seconds)
python quick_test.py
```

Expected output: `✅ ALL TESTS PASSED - SYSTEM READY!`

---

## 🏋️ Run Training

### Option 1: Test Mode (Recommended First Run)
```bash
# Train on 1 subject with 2 epochs (~5 minutes)
python run_training.py --test --subjects 1 --epochs 2
```

### Option 2: Full Production Training
```bash
# Train on all 16 subjects with 50 epochs (~8-12 hours)
python run_training.py
```

### Option 3: Specific Configuration
```bash
# Train on 5 subjects with 10 epochs (~30-40 minutes)
python run_training.py --subjects 5 --epochs 10
```

---

## 📊 View Results

After training completes:

```bash
# Check results
type results\Result.txt

# View training logs
type results\logs\main.log

# Check plots
dir results\plots\
```

### Expected Output Files
- `results/Result.txt` - Performance metrics (Accuracy, F1-Score, AUC)
- `results/plots/confusion_matrix.jpg` - Classification confusion matrix
- `results/plots/per_fold_result.png` - Individual fold performance
- `results/plots/performance_comparison.png` - Cross-fold comparison
- `models/teanet_fold_*.h5` - Trained model checkpoints

---

## 🔄 Available Commands

```bash
# Show help and all options
python main.py --help

# Test mode with custom settings
python main.py --test --subjects 2 --epochs 5 --batch-size 16

# Production mode (full LOSO cross-validation)
python main.py --subjects 16 --epochs 50

# Specific signal types
python main.py --signals BVP ECG  # Multiple signals

# Skip data augmentation
python main.py --augment 0

# Custom normalization
python main.py --normalize zscore
```

---

## 🧪 Run Tests

```bash
# Quick tests (5 tests, ~30 seconds)
python quick_test.py

# Comprehensive tests (6 tests, ~2-3 minutes)
python run_simple_test.py

# Specific test file
python -m pytest test_basic.py -v
```

---

## 📈 Monitor Training Progress

While training runs, check the log:

```bash
# On Windows PowerShell
Get-Content results\logs\main.log -Tail 20 -Wait

# Or check periodically
type results\logs\main.log | tail -20
```

Look for:
- `Step 1: Initializing...` → Data loading starting
- `Loading subjects:` → Dataset being loaded
- `Training Fold 1...` → Training started
- `Epoch XX/50` → Training progress
- `Test Set Distribution:` → Training complete

---

## 🛠️ Troubleshooting

### Training Won't Start
```bash
# Verify dependencies
python quick_test.py

# Check WESAD folder exists
dir WESAD\

# Check config file
type config.yaml
```

### TensorFlow Import Freezing
```bash
# Use optimized launcher (has env settings)
python run_training.py
```

### Out of Memory Error
```bash
# Reduce batch size
python main.py --batch-size 4 --test

# Or limit subjects
python main.py --subjects 2
```

### Can't Find Models
```bash
# Check models folder
dir models\

# Should have teanet_fold_*.h5 files
ls models\ | grep teanet
```

---

## 📊 Model Deployment

### Convert to TensorFlow Lite (for mobile/embedded)
```bash
python tflite_converter.py
```

Output: `results/tflite_models/teanet_*.tflite`

### Use Trained Model
```python
from teanet_model import TEANetModel
import tensorflow as tf

# Load trained model
model = tf.keras.models.load_model('models/teanet_fold_1.h5')

# Make predictions
predictions = model.predict(your_data)
```

---

## 📋 Configuration

Edit `config.yaml` to adjust:

```yaml
# Number of training epochs
training:
  epochs: 50          # Change to 10 for faster testing

# Batch size (reduce if out of memory)
  batch_size: 32      # Try 8 or 16 if memory issues

# Data augmentation step
  augmentation_step: 480  # Smaller = more augmentation

# Number of subjects to train
dataset:
  max_subjects: 16    # Or 2 for testing

# Signal type(s)
  signals: BVP        # BVP, ECG, or EDA
```

---

## ⏱️ Typical Execution Times

| Task | Time | Command |
|------|------|---------|
| Quick test | 30 sec | `python quick_test.py` |
| 1 subject, 2 epochs | 5 min | `python run_training.py --test --subjects 1 --epochs 2` |
| 5 subjects, 10 epochs | 30-40 min | `python run_training.py --subjects 5 --epochs 10` |
| Full training (16 subjects, 50 epochs) | 8-12 hours | `python run_training.py` |
| TFLite conversion | 5 min | `python tflite_converter.py` |

---

## ✨ System Status

- ✅ All errors fixed
- ✅ All tests passing
- ✅ Ready for training
- ✅ Models can be deployed
- ✅ Production ready

**Next Step:** Run `python quick_test.py` to verify, then `python run_training.py` to train!

---
*Last Updated: November 15, 2025*
