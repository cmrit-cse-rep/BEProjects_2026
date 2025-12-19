import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import joblib
import json
import os
from datetime import datetime, timedelta
import sys
import yfinance as yf

def load_model_and_predict(symbol, days=7, model_dir="models"):
    """Load a trained model and make predictions"""
    try:
        # Load model
        model_path = os.path.join(model_dir, f"{symbol}_model.joblib")
        if not os.path.exists(model_path):
            return {
                'success': False,
                'error': f'No trained model found for {symbol}'
            }
        
        model = joblib.load(model_path)
        
        # Load scaler
        scaler_path = os.path.join(model_dir, f"{symbol}_scaler.joblib")
        scaler = joblib.load(scaler_path)
        
        # Load metadata
        metadata_path = os.path.join(model_dir, f"{symbol}_metadata.json")
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        sequence_length = metadata.get('sequence_length', 60)
        
        recent_prices = []
        try:
            data = yf.Ticker(symbol).history(period="3mo")
            closes = data["Close"].values.tolist()
            if len(closes) >= sequence_length:
                recent_prices = closes[-sequence_length:]
            else:
                if len(closes) == 0:
                    closes = [1.0]
                last = closes[-1]
                recent_prices = (closes + [last] * (sequence_length - len(closes)))[:sequence_length]
        except Exception:
            recent_prices = [1.0] * sequence_length
        
        # Scale the recent data
        recent_prices_array = np.array(recent_prices).reshape(-1, 1)
        scaled_recent = scaler.transform(recent_prices_array)
        
        # Get last sequence
        last_sequence = scaled_recent.flatten()
        
        predictions = []
        current_sequence = last_sequence.copy()
        
        for _ in range(days):
            # Predict next value
            next_pred = model.predict(current_sequence.reshape(1, -1))[0]
            predictions.append(next_pred)
            
            # Update sequence
            current_sequence = np.append(current_sequence[1:], next_pred)
        
        # Inverse transform predictions
        predictions = np.array(predictions).reshape(-1, 1)
        predictions = scaler.inverse_transform(predictions)
        
        # Generate dates
        future_dates = []
        current_date = datetime.now()
        while len(future_dates) < days:
            current_date += timedelta(days=1)
            if current_date.weekday() <= 4:
                future_dates.append(current_date.strftime('%Y-%m-%d'))
        
        return {
            'success': True,
            'predictions': [
                {
                    'date': date,
                    'price': float(pred[0])
                }
                for date, pred in zip(future_dates, predictions)
            ],
            'current_price': float(recent_prices[-1]),
            'model_type': metadata.get('model_type', 'Unknown'),
            'trained_date': metadata.get('trained_date', 'Unknown')
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python predict_simple.py <SYMBOL> [days]'
        }))
        return
    
    symbol = sys.argv[1]
    days = int(sys.argv[2]) if len(sys.argv) > 2 else 7
    model_dir = sys.argv[3] if len(sys.argv) > 3 else "models"
    result = load_model_and_predict(symbol, days, model_dir)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()