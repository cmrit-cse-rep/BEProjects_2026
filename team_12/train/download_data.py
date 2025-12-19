"""
Download PhysioNet Sepsis dataset automatically
"""
import os
import wget
import zipfile
import requests
from pathlib import Path

# PhysioNet Sepsis Early Prediction Challenge dataset
# Using a publicly available sepsis dataset
DATASET_URL = "https://physionet.org/files/challenge-2019/1.0.0/training/training_setA.zip"
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data" / "raw"

def download_dataset():
    """Download and extract PhysioNet sepsis dataset"""
    print("Downloading PhysioNet Sepsis dataset...")
    
    # Create directories
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    # Download file
    zip_path = DATA_DIR / "dataset.zip"
    
    try:
        if not zip_path.exists():
            print(f"Downloading from {DATASET_URL}...")
            wget.download(DATASET_URL, str(zip_path))
            print("\nDownload complete!")
        else:
            print("Dataset already downloaded.")
        
        # Extract zip file
        if zip_path.exists():
            print("Extracting dataset...")
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(DATA_DIR)
            print("Extraction complete!")
            
            # Remove zip file to save space
            zip_path.unlink()
            print("Dataset ready for preprocessing!")
            
    except Exception as e:
        print(f"Error downloading dataset: {e}")
        print("Creating synthetic dataset for demonstration...")
        create_synthetic_dataset()

def create_synthetic_dataset():
    """Create a synthetic sepsis dataset if download fails"""
    import pandas as pd
    import numpy as np
    
    print("Generating synthetic sepsis dataset...")
    
    np.random.seed(42)
    n_samples = 1000
    
    # Generate synthetic patient data
    data = {
        'HR': np.random.normal(90, 20, n_samples),  # Heart Rate
        'O2Sat': np.random.normal(96, 5, n_samples),  # Oxygen Saturation
        'Temp': np.random.normal(37, 1, n_samples),  # Temperature
        'SBP': np.random.normal(120, 20, n_samples),  # Systolic BP
        'DBP': np.random.normal(80, 15, n_samples),  # Diastolic BP
        'MAP': np.random.normal(93, 15, n_samples),  # Mean Arterial Pressure
        'Resp': np.random.normal(18, 5, n_samples),  # Respiration Rate
        'EtCO2': np.random.normal(40, 5, n_samples),  # End-tidal CO2
        'BaseExcess': np.random.normal(0, 5, n_samples),
        'HCO3': np.random.normal(24, 3, n_samples),
        'FiO2': np.random.normal(0.21, 0.1, n_samples),
        'pH': np.random.normal(7.4, 0.1, n_samples),
        'PaCO2': np.random.normal(40, 5, n_samples),
        'SaO2': np.random.normal(98, 2, n_samples),
        'AST': np.random.normal(30, 15, n_samples),
        'BUN': np.random.normal(15, 5, n_samples),
        'Alkalinephos': np.random.normal(70, 20, n_samples),
        'Calcium': np.random.normal(9.5, 0.5, n_samples),
        'Chloride': np.random.normal(100, 5, n_samples),
        'Creatinine': np.random.normal(1.0, 0.3, n_samples),
        'Bilirubin_direct': np.random.normal(0.3, 0.2, n_samples),
        'Glucose': np.random.normal(100, 20, n_samples),
        'Lactate': np.random.normal(1.5, 0.8, n_samples),
        'Magnesium': np.random.normal(2.0, 0.3, n_samples),
        'Phosphate': np.random.normal(3.5, 0.5, n_samples),
        'Potassium': np.random.normal(4.0, 0.5, n_samples),
        'Bilirubin_total': np.random.normal(1.0, 0.5, n_samples),
        'TroponinI': np.random.normal(0.01, 0.02, n_samples),
        'Hct': np.random.normal(40, 5, n_samples),
        'Hgb': np.random.normal(14, 2, n_samples),
        'PTT': np.random.normal(30, 5, n_samples),
        'WBC': np.random.normal(7, 3, n_samples),
        'Fibrinogen': np.random.normal(300, 100, n_samples),
        'Platelets': np.random.normal(250, 75, n_samples),
        'Age': np.random.randint(18, 90, n_samples),
        'Gender': np.random.choice([0, 1], n_samples),
        'ICULOS': np.random.randint(1, 100, n_samples),  # ICU Length of Stay
        'SepsisLabel': np.random.choice([0, 1], n_samples, p=[0.7, 0.3])  # 30% sepsis
    }
    
    df = pd.DataFrame(data)
    
    # Add some correlation with sepsis
    sepsis_mask = df['SepsisLabel'] == 1
    df.loc[sepsis_mask, 'HR'] += np.random.normal(20, 10, sepsis_mask.sum())
    df.loc[sepsis_mask, 'Temp'] += np.random.normal(1.5, 0.5, sepsis_mask.sum())
    df.loc[sepsis_mask, 'Lactate'] += np.random.normal(2, 1, sepsis_mask.sum())
    df.loc[sepsis_mask, 'WBC'] += np.random.normal(5, 2, sepsis_mask.sum())
    
    # Save to CSV files (simulating multiple patient files)
    for i in range(0, n_samples, 10):
        patient_df = df.iloc[i:i+10].copy()
        patient_df.to_csv(DATA_DIR / f"patient_{i//10}.csv", index=False)
    
    print(f"Generated {n_samples//10} patient files in {DATA_DIR}")

if __name__ == "__main__":
    download_dataset()


