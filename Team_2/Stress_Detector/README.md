# TEANet: Transpose-Enhanced Autoencoder Network for Wearable Stress Monitoring

This repository implements the TEANet architecture as described in the paper "TEANet: A Transpose-Enhanced Autoencoder Network for Wearable Stress Monitoring" for stress detection using BVP (PPG) signals from the WESAD dataset.

## 🎯 Overview

TEANet is a novel deep learning architecture specifically designed for wearable stress monitoring that combines:
- **Transpose-Enhanced path**: Uses Conv1DTranspose operations for enhanced feature extraction
- **Autoencoder blocks**: Three-stage Conv1D+MaxPool1D for hierarchical feature learning
- **Convolutional path**: Traditional Conv1D blocks for spatial feature extraction
- **Sliding overlapping window augmentation**: Algorithm 1 from the paper for minority class balancing

## 🏗️ Architecture

The model follows the exact specifications from the TEANet paper:

### 1. Down-sampling Block
- Conv1D(128, kernel=5, stride=4)
- MaxPool1D(2)
- BatchNormalization + ReLU

### 2. TEA Layers (TEA-5 Configuration)
Each TEA layer contains:
- **Transpose-Enhanced path**: Conv1DTranspose → Conv1D → Autoencoder block → Conv1D → MaxPool1D
- **Convolutional path**: Two Conv1D blocks
- **Concatenation**: Both paths are concatenated

### 3. Classification Block
- Three Conv1D layers (96, 64, 32 filters)
- Each followed by: BatchNorm, ReLU, MaxPool1D(2), Dropout(0.3)
- GlobalAveragePooling
- Dense layer with 2 outputs (softmax activation)

## 📊 Dataset: WESAD

The implementation uses the WESAD dataset with the following specifications:
- **Subjects**: S2-S17 (16 subjects)
- **Sensor**: Wrist BVP (PPG) signals
- **Sampling Rate**: 64 Hz (resampled from 700 Hz)
- **Window Size**: 30 seconds (1920 samples per window)
- **Labels**: Binary classification (0: normal, 1: stress)
- **Preprocessing**: Z-score normalization per window

## 🚀 Features

### Core Implementation
- ✅ Complete TEANet architecture following paper specifications
- ✅ WESAD dataset loader with proper preprocessing
- ✅ TEANet's sliding overlapping window augmentation (Algorithm 1)
- ✅ Leave-One-Subject-Out (LOSO) cross-validation
- ✅ Comprehensive evaluation metrics

### Training & Evaluation
- ✅ RMSprop optimizer with learning rate 1e-4
- ✅ Sparse categorical crossentropy loss
- ✅ Early stopping with patience=10
- ✅ Model checkpointing and best model saving
- ✅ Per-fold and overall performance metrics

### Explainability & Visualization
- ✅ UMAP dimensionality reduction for feature visualization
- ✅ Confusion matrix visualization
- ✅ Per-fold performance comparison plots
- ✅ Activation maps from convolutional layers

### Deployment
- ✅ TensorFlow Lite conversion (float32)
- ✅ Post-training full integer quantization (int8)
- ✅ Alternative int16 quantization
- ✅ Model size comparison and compression ratios
- ✅ TFLite model testing and validation

## 📁 Project Structure

```
Stress_Detector/
├── WESAD/                          # WESAD dataset directory
├── data_processing.py              # WESAD data processor
├── teanet_model.py                 # TEANet model architecture
├── training.py                     # Training and evaluation
├── tflite_converter.py             # TensorFlow Lite conversion
├── main.py                         # Main execution script
├── requirements.txt                 # Python dependencies
├── README.md                       # This file
├── results/                        # Training results and visualizations
├── models/                         # Saved model checkpoints
└── tflite_models/                  # Converted TFLite models
```

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Stress_Detector
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Download WESAD dataset**:
   - Place the WESAD dataset in the `WESAD/` directory
   - Ensure it contains subjects S2-S17 with pickle files

## 🎮 Usage

### Quick Start

Run the complete training pipeline:

```bash
python main.py
```

This will:
1. Load and preprocess the WESAD dataset
2. Train the TEANet model using LOSO cross-validation
3. Generate performance metrics and visualizations
4. Convert the best model to TensorFlow Lite formats
5. Save all results to the `results/` directory

### Custom Training

```python
from data_processing import WESADDataProcessor
from teanet_model import TEANetModel
from training import TEANetTrainer

# Initialize components
data_processor = WESADDataProcessor(window_size=30, target_sample_rate=64)
teanet_model = TEANetModel(input_shape=(1920, 1), num_classes=2)

# Load data
bvp_signals, labels, subject_ids = data_processor.load_wesad_data()

# Train model
trainer = TEANetTrainer(model_builder, data_processor, config)
results = trainer.train_with_loso(bvp_signals, labels, subject_ids)
```

### TensorFlow Lite Conversion

```python
from tflite_converter import TEANetTFLiteConverter

# Convert trained model
converter = TEANetTFLiteConverter("path/to/model.h5")
tflite_paths = converter.convert_all_formats(sample_data)

# Test converted model
predictions = converter.test_tflite_model(tflite_paths['float32'], test_data)
```

## 📈 Performance Metrics

The implementation reports comprehensive metrics for each fold and overall:

- **Accuracy**: Overall classification accuracy
- **Sensitivity**: True positive rate (stress detection)
- **Specificity**: True negative rate (normal detection)
- **F1-Score**: Harmonic mean of precision and recall
- **AUC**: Area under ROC curve
- **Cohen's Kappa**: Agreement between predictions and true labels

## 🔍 Explainability Features

### UMAP Visualization
- 2D visualization of learned features
- Shows class separation in feature space
- Helps understand model's learned representations

### Performance Analysis
- Per-fold performance comparison
- Confusion matrix visualization
- Training history plots

### Model Interpretation
- Feature importance analysis
- Activation map visualization
- Model architecture summary

## 📱 Deployment

### TensorFlow Lite Models
- **Float32**: Best accuracy, larger size
- **Int8 Quantized**: Good balance of accuracy and size
- **Int16 Quantized**: Alternative quantization option

### Mobile/Wearable Optimization
- Reduced model size for edge devices
- Optimized inference performance
- Battery-efficient deployment

## ⚙️ Configuration

Key parameters in `main.py`:

```python
config = {
    'window_size': 30,              # Window size in seconds
    'target_sample_rate': 64,        # BVP sampling rate in Hz
    'tea_layers': 5,                # Number of TEA layers
    'learning_rate': 1e-4,          # RMSprop learning rate
    'batch_size': 32,               # Training batch size
    'epochs': 150,                  # Maximum training epochs
    'patience': 10,                 # Early stopping patience
    'min_windows_per_subject': 5    # Minimum data per subject
}
```

## 📊 Results

The training process generates:

1. **Model Checkpoints**: Saved during training
2. **Performance Metrics**: Per-fold and overall results
3. **Visualizations**: UMAP plots, confusion matrices, performance charts
4. **TensorFlow Lite Models**: Optimized for deployment
5. **Deployment Information**: Model specifications and usage notes

## 🔬 Research Applications

This implementation is suitable for:
- Stress detection research
- Wearable device development
- Physiological signal analysis
- Deep learning in healthcare
- Edge computing applications

## 📚 Citation

If you use this implementation in your research, please cite the original TEANet paper:

```
[TEANet paper citation]
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Original TEANet paper authors
- WESAD dataset contributors
- TensorFlow and open-source community

## 📞 Support

For questions or issues:
1. Check the existing issues
2. Create a new issue with detailed description
3. Include system information and error logs

---

**Note**: This implementation follows the exact specifications from the TEANet paper and is designed for research and development purposes. For production deployment, additional testing and validation are recommended.
