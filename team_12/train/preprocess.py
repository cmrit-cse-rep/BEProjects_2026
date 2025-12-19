"""
Preprocess PhysioNet Sepsis dataset
- Combine multiple patient files
- Handle missing values (forward fill + backward fill)
- Apply MinMaxScaler
- Select useful features
- Create labels
- Split into train/test
"""
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
import joblib
import os

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
MODELS_DIR = BASE_DIR / "models"

# Feature columns (PhysioNet sepsis features)
FEATURE_COLUMNS = [
    'HR', 'O2Sat', 'Temp', 'SBP', 'DBP', 'MAP', 'Resp', 'EtCO2',
    'BaseExcess', 'HCO3', 'FiO2', 'pH', 'PaCO2', 'SaO2', 'AST', 'BUN',
    'Alkalinephos', 'Calcium', 'Chloride', 'Creatinine', 'Bilirubin_direct',
    'Glucose', 'Lactate', 'Magnesium', 'Phosphate', 'Potassium',
    'Bilirubin_total', 'TroponinI', 'Hct', 'Hgb', 'PTT', 'WBC',
    'Fibrinogen', 'Platelets', 'Age', 'Gender', 'ICULOS'
]

def load_patient_files():
    """Load and combine all patient files"""
    print("Loading patient files...")
    
    all_data = []
    csv_files = list(DATA_DIR.glob("*.csv"))
    
    if not csv_files:
        print("No CSV files found. Please run download_data.py first.")
        return None
    
    for file_path in csv_files:
        try:
            df = pd.read_csv(file_path)
            all_data.append(df)
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
    
    if not all_data:
        print("No data loaded!")
        return None
    
    combined_df = pd.concat(all_data, ignore_index=True)
    print(f"Combined {len(csv_files)} files into {len(combined_df)} records")
    return combined_df

def handle_missing_values(df):
    """Handle missing values using forward fill + backward fill"""
    print("Handling missing values...")
    
    # Forward fill
    df = df.ffill()
    
    # Backward fill
    df = df.bfill()
    
    # Fill any remaining NaN with median
    for col in df.columns:
        if df[col].isna().any():
            df[col].fillna(df[col].median(), inplace=True)
    
    print(f"Missing values handled. Remaining NaNs: {df.isna().sum().sum()}")
    return df

def select_features(df):
    """Select useful features"""
    print("Selecting features...")
    
    # Ensure all feature columns exist
    available_features = [col for col in FEATURE_COLUMNS if col in df.columns]
    missing_features = [col for col in FEATURE_COLUMNS if col not in df.columns]
    
    if missing_features:
        print(f"Warning: Missing features {missing_features}. Creating with default values.")
        for col in missing_features:
            df[col] = 0
    
    # Select features
    X = df[FEATURE_COLUMNS].copy()
    
    # Get labels
    if 'SepsisLabel' in df.columns:
        y = df['SepsisLabel'].copy()
    else:
        print("Warning: No SepsisLabel found. Creating synthetic labels.")
        y = np.random.choice([0, 1], size=len(df), p=[0.7, 0.3])
    
    print(f"Selected {len(FEATURE_COLUMNS)} features")
    return X, y

def preprocess_data():
    """Main preprocessing function"""
    print("=" * 50)
    print("PREPROCESSING DATA")
    print("=" * 50)
    
    # Create directories
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Load data
    df = load_patient_files()
    if df is None:
        return None, None, None, None
    
    # Handle missing values
    df = handle_missing_values(df)
    
    # Select features and labels
    X, y = select_features(df)
    
    # Split into train/test
    print("Splitting into train/test sets...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Train set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    
    # Apply MinMaxScaler
    print("Applying MinMaxScaler...")
    scaler = MinMaxScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Save scaler
    scaler_path = MODELS_DIR / "scaler.pkl"
    joblib.dump(scaler, scaler_path)
    print(f"Scaler saved to {scaler_path}")
    
    # Convert back to DataFrame
    X_train_scaled = pd.DataFrame(X_train_scaled, columns=FEATURE_COLUMNS)
    X_test_scaled = pd.DataFrame(X_test_scaled, columns=FEATURE_COLUMNS)
    
    # Save processed data
    X_train_scaled.to_csv(PROCESSED_DIR / "X_train.csv", index=False)
    X_test_scaled.to_csv(PROCESSED_DIR / "X_test.csv", index=False)
    y_train.to_csv(PROCESSED_DIR / "y_train.csv", index=False)
    y_test.to_csv(PROCESSED_DIR / "y_test.csv", index=False)
    
    print("Preprocessing complete!")
    print("=" * 50)
    
    return X_train_scaled, X_test_scaled, y_train, y_test

if __name__ == "__main__":
    preprocess_data()

