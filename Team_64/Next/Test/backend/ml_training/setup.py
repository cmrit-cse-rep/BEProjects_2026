#!/usr/bin/env python3
"""
Setup script for LSTM training environment
"""

import subprocess
import sys
import os
import json

def install_requirements():
    """Install required Python packages"""
    print("Installing Python dependencies...")
    
    try:
        # Install packages from requirements.txt
        subprocess.check_call([
            sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'
        ])
        print("✓ All dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Error installing dependencies: {e}")
        return False

def create_directories():
    """Create necessary directories"""
    print("Creating directories...")
    
    directories = ['models', 'data', 'logs']
    
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"✓ Created directory: {directory}")
        else:
            print(f"✓ Directory already exists: {directory}")

def test_imports():
    """Test if all required packages can be imported"""
    print("Testing package imports...")
    
    required_packages = [
        'yfinance',
        'tensorflow',
        'numpy',
        'pandas',
        'sklearn',
        'joblib'
    ]
    
    failed_imports = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✓ {package}")
        except ImportError:
            print(f"✗ {package}")
            failed_imports.append(package)
    
    if failed_imports:
        print(f"\nFailed to import: {', '.join(failed_imports)}")
        return False
    else:
        print("✓ All packages imported successfully!")
        return True

def create_config():
    """Create configuration file"""
    print("Creating configuration file...")
    
    config = {
        "default_settings": {
            "sequence_length": 60,
            "test_size": 0.2,
            "epochs": 50,
            "batch_size": 32,
            "learning_rate": 0.001
        },
        "model_settings": {
            "lstm_units": [50, 50],
            "dropout_rate": 0.2,
            "validation_split": 0.1
        },
        "data_settings": {
            "default_period": "5y",
            "min_data_points": 60
        }
    }
    
    with open('config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    print("✓ Configuration file created: config.json")

def main():
    """Main setup function"""
    print("=" * 60)
    print("LSTM Stock Prediction Training Environment Setup")
    print("=" * 60)
    
    # Change to script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    steps = [
        ("Creating directories", create_directories),
        ("Installing requirements", install_requirements),
        ("Testing imports", test_imports),
        ("Creating configuration", create_config)
    ]
    
    success_count = 0
    
    for step_name, step_function in steps:
        print(f"\n{step_name}...")
        if step_function():
            success_count += 1
        else:
            print(f"✗ Failed: {step_name}")
    
    print(f"\n{'=' * 60}")
    print(f"Setup completed: {success_count}/{len(steps)} steps successful")
    
    if success_count == len(steps):
        print("✓ Environment setup completed successfully!")
        print("\nYou can now:")
        print("1. Train models using: python lstm_trainer.py")
        print("2. Train single model: python train_single.py SYMBOL")
        print("3. Make predictions: python predict.py SYMBOL DAYS")
    else:
        print("✗ Setup incomplete. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()