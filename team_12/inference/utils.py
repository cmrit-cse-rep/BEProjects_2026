"""
Utility functions for inference
"""
import pandas as pd
import numpy as np

FEATURE_COLUMNS = [
    'HR', 'O2Sat', 'Temp', 'SBP', 'DBP', 'MAP', 'Resp', 'EtCO2',
    'BaseExcess', 'HCO3', 'FiO2', 'pH', 'PaCO2', 'SaO2', 'AST', 'BUN',
    'Alkalinephos', 'Calcium', 'Chloride', 'Creatinine', 'Bilirubin_direct',
    'Glucose', 'Lactate', 'Magnesium', 'Phosphate', 'Potassium',
    'Bilirubin_total', 'TroponinI', 'Hct', 'Hgb', 'PTT', 'WBC',
    'Fibrinogen', 'Platelets', 'Age', 'Gender', 'ICULOS'
]

def normalize_features(data_dict):
    """Normalize feature names and values"""
    normalized = {}
    
    # Common aliases mapping
    aliases = {
        'heart_rate': 'HR',
        'heartrate': 'HR',
        'oxygen_saturation': 'O2Sat',
        'o2_sat': 'O2Sat',
        'temperature': 'Temp',
        'temp': 'Temp',
        'systolic_bp': 'SBP',
        'diastolic_bp': 'DBP',
        'mean_arterial_pressure': 'MAP',
        'respiration': 'Resp',
        'resp_rate': 'Resp',
        'white_blood_cell': 'WBC',
        'wbc_count': 'WBC',
        'age': 'Age',
        'gender': 'Gender',
        'sex': 'Gender'
    }
    
    for key, value in data_dict.items():
        key_lower = key.lower().replace(' ', '_')
        if key_lower in aliases:
            normalized[aliases[key_lower]] = float(value) if value else 0
        elif key in FEATURE_COLUMNS:
            normalized[key] = float(value) if value else 0
    
    return normalized


