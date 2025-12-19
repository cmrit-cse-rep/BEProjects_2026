import sys
import json
import os
import numpy as np
import pandas as pd
import tensorflow as tf
import joblib
import yfinance as yf
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

def load_model_and_predict(symbol, days):
    """
    Load trained model and make predictions
    
    Args:
        symbol (str): Stock symbol
        days (int): Number of days to predict
    
    Returns:
        dict: Prediction results
    """
    try:
        # Paths
        model_path = f"models/{symbol}_lstm_model.h5"
        scaler_path = f"models/{symbol}_scaler.pkl"
        metadata_path = f"models/{symbol}_metadata.json"
        
        # Check if files exist
        if not all(os.path.exists(path) for path in [model_path, scaler_path, metadata_path]):
            raise FileNotFoundError(f"Model files not found for {symbol}")
        
        # Load metadata
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        sequence_length = metadata.get('sequence_length', 60)
        
        # Load model and scaler
        model = tf.keras.models.load_model(model_path)
        scaler = joblib.load(scaler_path)
        
        # Download recent data for prediction
        ticker = yf.Ticker(symbol)
        data = ticker.history(period="1y")  # Get recent data
        
        if data.empty:
            raise ValueError(f"No recent data available for {symbol}")
        
        # Get last sequence
        prices = data['Close'].values
        if len(prices) < sequence_length:
            raise ValueError(f"Insufficient data for prediction. Need at least {sequence_length} days")
        
        last_sequence = prices[-sequence_length:]
        last_sequence_scaled = scaler.transform(last_sequence.reshape(-1, 1))
        
        # Make predictions
        predictions = []
        current_sequence = last_sequence_scaled.flatten()
        
        for _ in range(days):
            # Reshape for prediction
            X_pred = current_sequence.reshape(1, sequence_length, 1)
            
            # Make prediction
            next_pred = model.predict(X_pred, verbose=0)[0, 0]
            predictions.append(next_pred)
            
            # Update sequence for next prediction
            current_sequence = np.append(current_sequence[1:], next_pred)
        
        # Inverse transform predictions
        predictions = np.array(predictions).reshape(-1, 1)
        predictions = scaler.inverse_transform(predictions)
        
        # Create future dates
        last_date = data.index[-1]
        future_dates = []
        for i in range(days):
            future_date = last_date + timedelta(days=i+1)
            # Skip weekends for stock predictions
            while future_date.weekday() >= 5:  # 5=Saturday, 6=Sunday
                future_date += timedelta(days=1)
            future_dates.append(future_date.strftime('%Y-%m-%d'))
        
        # Get current price and calculate changes
        current_price = float(prices[-1])
        predicted_prices = predictions.flatten()
        
        # Calculate percentage changes
        price_changes = []
        for pred_price in predicted_prices:
            change_pct = ((pred_price - current_price) / current_price) * 100
            price_changes.append(change_pct)
        
        # Prepare result
        result = {
            'success': True,
            'symbol': symbol,
            'current_price': current_price,
            'predictions': [
                {
                    'date': date,
                    'price': float(price),
                    'change_percent': float(change)
                }
                for date, price, change in zip(future_dates, predicted_prices, price_changes)
            ],
            'metadata': {
                'model_created': metadata.get('created_at'),
                'sequence_length': sequence_length,
                'prediction_days': days,
                'last_data_date': data.index[-1].strftime('%Y-%m-%d')
            }
        }
        
        return result
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'symbol': symbol
        }

def main():
    if len(sys.argv) != 3:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python predict.py <symbol> <days>'
        }))
        sys.exit(1)
    
    symbol = sys.argv[1]
    try:
        days = int(sys.argv[2])
    except ValueError:
        print(json.dumps({
            'success': False,
            'error': 'Days must be an integer'
        }))
        sys.exit(1)
    
    # Change to script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    result = load_model_and_predict(symbol, days)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()