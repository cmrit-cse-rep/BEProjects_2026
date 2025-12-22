# backend/preprocess.py
import pandas as pd
from sklearn.preprocessing import LabelEncoder, MinMaxScaler

def preprocess_csv(file_path):
    """
    Read CSV, drop a few columns, fill missing values, encode categoricals,
    scale numeric features and return processed DataFrame.
    """
    df = pd.read_csv(file_path)

    # Drop columns if present
    drop_cols = ['window_id', 'file_name']
    df = df.drop(columns=[c for c in drop_cols if c in df.columns], errors="ignore")

    # Fill numeric missing values with median (safe)
    try:
        df = df.fillna(df.median(numeric_only=True))
    except Exception:
        # fallback: fill all NaNs with a placeholder for non-numeric
        df = df.fillna(0)

    # Label encode categorical columns
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns
    for col in categorical_cols:
        le = LabelEncoder()
        # cast to string so label encoder doesn't fail on NaNs
        df[col] = le.fit_transform(df[col].astype(str))

    # Scale numeric columns with MinMaxScaler
    numeric_cols = df.select_dtypes(include=['number']).columns
    if len(numeric_cols) > 0:
        scaler = MinMaxScaler()
        df[numeric_cols] = scaler.fit_transform(df[numeric_cols])

    return df
