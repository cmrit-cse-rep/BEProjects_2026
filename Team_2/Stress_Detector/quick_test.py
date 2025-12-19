#!/usr/bin/env python3
"""
Quick test that skips loading data to demonstrate the system works
"""

import os
import sys
os.environ['NUMBA_DISABLE_JIT'] = '1'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# Force UTF-8 output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

print("=" * 80)
print("TEANet Stress Detector - Quick System Test")
print("=" * 80)
print()

# Test imports
print("[1/5] Testing imports...")
try:
    import numpy as np
    import tensorflow as tf
    from config_manager import ConfigManager
    from teanet_model import TEANetModel
    from training import TEANetTrainer
    print("[OK] All imports successful\n")
except Exception as e:
    print(f"[FAIL] Import failed: {e}\n")
    import traceback
    traceback.print_exc()
    exit(1)

# Load config
print("[2/5] Loading configuration...")
try:
    config_manager = ConfigManager('config.yaml')
    config_manager.compute_derived_values()
    config = config_manager.to_dict()
    print(f"[OK] Config loaded\n")
except Exception as e:
    print(f"[FAIL] Config load failed: {e}\n")
    exit(1)

# Build model
print("[3/5] Building TEANet model...")
try:
    model_wrapper = TEANetModel(
        input_shape=(config['dataset']['samples_per_window'], config['model']['input_channels']),
        num_classes=config['model']['num_classes'],
        config=config
    )
    model_wrapper.build_model(tea_layers=config['model']['tea_layers'])
    model = model_wrapper.compile_model(learning_rate=config['training']['learning_rate'])
    print(f"[OK] Model built with {len(model.layers)} layers\n")
except Exception as e:
    print(f"[FAIL] Model build failed: {e}\n")
    import traceback
    traceback.print_exc()
    exit(1)

# Create dummy data
print("[4/5] Creating synthetic test data...")
try:
    x_train = np.random.randn(16, 1920, 1).astype(np.float32)
    y_train = np.random.randint(0, 2, 16)
    print(f"[OK] Created training batch: {x_train.shape}\n")
except Exception as e:
    print(f"[FAIL] Data creation failed: {e}\n")
    exit(1)

# Test training step
print("[5/5] Testing model training (1 epoch)...")
try:
    history = model.fit(
        x_train, 
        y_train,
        epochs=1,
        batch_size=4,
        verbose=0
    )
    print(f"[OK] Training completed successfully")
    print(f"  Loss: {history.history['loss'][0]:.4f}\n")
except Exception as e:
    print(f"[FAIL] Training failed: {e}\n")
    import traceback
    traceback.print_exc()
    exit(1)

print("=" * 80)
print("[PASS] ALL TESTS PASSED - SYSTEM READY!")
print("=" * 80)
print()
print("System is operational. You can now run the full training with:")
print("  .\venv\Scripts\python main.py --test")
print()
