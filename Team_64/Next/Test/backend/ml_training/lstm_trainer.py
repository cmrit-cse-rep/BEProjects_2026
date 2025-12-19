import yfinance as yf
import numpy as np
import pandas as pd
import tensorflow as tf
try:
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    from tensorflow.keras.optimizers import Adam
except ImportError:
    from keras.models import Sequential
    from keras.layers import LSTM, Dense, Dropout
    from keras.optimizers import Adam
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error
import joblib
import os
import json
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class LSTMStockPredictor:
    def __init__(self, symbol, sequence_length=60, test_size=0.2):
        """
        Initialize LSTM Stock Predictor
        
        Args:
            symbol (str): Stock symbol (e.g., 'RELIANCE.NS', 'TCS.NS')
            sequence_length (int): Number of days to look back for prediction
            test_size (float): Proportion of data to use for testing
        """
        self.symbol = symbol
        self.sequence_length = sequence_length
        self.test_size = test_size
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.model = None
        self.data = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        
    def download_data(self, period="5y"):
        """
        Download stock data from Yahoo Finance
        
        Args:
            period (str): Data period ('1y', '2y', '5y', '10y', 'max')
        """
        try:
            print(f"Downloading data for {self.symbol}...")
            ticker = yf.Ticker(self.symbol)
            self.data = ticker.history(period=period)
            
            if self.data.empty:
                raise ValueError(f"No data found for symbol {self.symbol}")
                
            print(f"Downloaded {len(self.data)} days of data")
            return True
            
        except Exception as e:
            print(f"Error downloading data: {str(e)}")
            return False
    
    def preprocess_data(self):
        """
        Preprocess the downloaded data for LSTM training
        """
        if self.data is None:
            raise ValueError("No data available. Please download data first.")
        
        # Use closing prices for prediction
        prices = self.data['Close'].values.reshape(-1, 1)
        
        # Scale the data
        scaled_data = self.scaler.fit_transform(prices)
        
        # Create sequences
        X, y = [], []
        for i in range(self.sequence_length, len(scaled_data)):
            X.append(scaled_data[i-self.sequence_length:i, 0])
            y.append(scaled_data[i, 0])
        
        X, y = np.array(X), np.array(y)
        
        # Split into train and test sets
        split_index = int(len(X) * (1 - self.test_size))
        
        self.X_train = X[:split_index]
        self.X_test = X[split_index:]
        self.y_train = y[:split_index]
        self.y_test = y[split_index:]
        
        # Reshape for LSTM (samples, time steps, features)
        self.X_train = self.X_train.reshape((self.X_train.shape[0], self.X_train.shape[1], 1))
        self.X_test = self.X_test.reshape((self.X_test.shape[0], self.X_test.shape[1], 1))
        
        print(f"Training data shape: {self.X_train.shape}")
        print(f"Testing data shape: {self.X_test.shape}")
    
    def build_model(self, lstm_units=[50, 50], dropout_rate=0.2, learning_rate=0.001):
        """
        Build LSTM model architecture
        
        Args:
            lstm_units (list): Number of units in each LSTM layer
            dropout_rate (float): Dropout rate for regularization
            learning_rate (float): Learning rate for optimizer
        """
        self.model = Sequential()
        
        # First LSTM layer
        self.model.add(LSTM(units=lstm_units[0], 
                           return_sequences=True if len(lstm_units) > 1 else False,
                           input_shape=(self.sequence_length, 1)))
        self.model.add(Dropout(dropout_rate))
        
        # Additional LSTM layers
        for i in range(1, len(lstm_units)):
            return_seq = i < len(lstm_units) - 1
            self.model.add(LSTM(units=lstm_units[i], return_sequences=return_seq))
            self.model.add(Dropout(dropout_rate))
        
        # Output layer
        self.model.add(Dense(units=1))
        
        # Compile model
        optimizer = Adam(learning_rate=learning_rate)
        self.model.compile(optimizer=optimizer, loss='mean_squared_error', metrics=['mae'])
        
        print("Model architecture:")
        self.model.summary()
    
    def train_model(self, epochs=100, batch_size=32, validation_split=0.1, verbose=1):
        """
        Train the LSTM model
        
        Args:
            epochs (int): Number of training epochs
            batch_size (int): Batch size for training
            validation_split (float): Validation data split
            verbose (int): Verbosity level
        """
        if self.model is None:
            raise ValueError("Model not built. Please build model first.")
        
        if self.X_train is None:
            raise ValueError("Data not preprocessed. Please preprocess data first.")
        
        print("Starting model training...")
        
        # Early stopping callback
        early_stopping = tf.keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        )
        
        # Model checkpoint callback
        checkpoint_path = f"models/{self.symbol}_best_model.h5"
        os.makedirs("models", exist_ok=True)
        
        model_checkpoint = tf.keras.callbacks.ModelCheckpoint(
            checkpoint_path,
            monitor='val_loss',
            save_best_only=True,
            save_weights_only=False
        )
        
        # Train the model
        history = self.model.fit(
            self.X_train, self.y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=validation_split,
            callbacks=[early_stopping, model_checkpoint],
            verbose=verbose
        )
        
        print("Training completed!")
        return history
    
    def evaluate_model(self):
        """
        Evaluate the trained model on test data
        """
        if self.model is None:
            raise ValueError("Model not trained. Please train model first.")
        
        # Make predictions
        train_predictions = self.model.predict(self.X_train)
        test_predictions = self.model.predict(self.X_test)
        
        # Inverse transform predictions
        train_predictions = self.scaler.inverse_transform(train_predictions)
        test_predictions = self.scaler.inverse_transform(test_predictions)
        y_train_actual = self.scaler.inverse_transform(self.y_train.reshape(-1, 1))
        y_test_actual = self.scaler.inverse_transform(self.y_test.reshape(-1, 1))
        
        # Calculate metrics
        train_rmse = np.sqrt(mean_squared_error(y_train_actual, train_predictions))
        test_rmse = np.sqrt(mean_squared_error(y_test_actual, test_predictions))
        train_mae = mean_absolute_error(y_train_actual, train_predictions)
        test_mae = mean_absolute_error(y_test_actual, test_predictions)
        
        metrics = {
            'train_rmse': float(train_rmse),
            'test_rmse': float(test_rmse),
            'train_mae': float(train_mae),
            'test_mae': float(test_mae),
            'symbol': self.symbol,
            'sequence_length': self.sequence_length,
            'test_size': self.test_size
        }
        
        print(f"Training RMSE: {train_rmse:.2f}")
        print(f"Testing RMSE: {test_rmse:.2f}")
        print(f"Training MAE: {train_mae:.2f}")
        print(f"Testing MAE: {test_mae:.2f}")
        
        return metrics, test_predictions, y_test_actual
    
    def predict_future(self, days=30):
        """
        Predict future stock prices
        
        Args:
            days (int): Number of days to predict
        """
        if self.model is None:
            raise ValueError("Model not trained. Please train model first.")
        
        # Get last sequence from the data
        last_sequence = self.data['Close'].values[-self.sequence_length:]
        last_sequence_scaled = self.scaler.transform(last_sequence.reshape(-1, 1))
        
        predictions = []
        current_sequence = last_sequence_scaled.flatten()
        
        for _ in range(days):
            # Reshape for prediction
            X_pred = current_sequence.reshape(1, self.sequence_length, 1)
            
            # Make prediction
            next_pred = self.model.predict(X_pred, verbose=0)[0, 0]
            predictions.append(next_pred)
            
            # Update sequence for next prediction
            current_sequence = np.append(current_sequence[1:], next_pred)
        
        # Inverse transform predictions
        predictions = np.array(predictions).reshape(-1, 1)
        predictions = self.scaler.inverse_transform(predictions)
        
        # Create future dates
        last_date = self.data.index[-1]
        future_dates = [last_date + timedelta(days=i+1) for i in range(days)]
        
        return future_dates, predictions.flatten()
    
    def save_model(self, model_path=None, scaler_path=None):
        """
        Save the trained model and scaler
        """
        if model_path is None:
            model_path = f"models/{self.symbol}_lstm_model.h5"
        if scaler_path is None:
            scaler_path = f"models/{self.symbol}_scaler.pkl"
        
        os.makedirs("models", exist_ok=True)
        
        # Save model
        self.model.save(model_path)
        
        # Save scaler
        joblib.dump(self.scaler, scaler_path)
        
        # Save metadata
        metadata = {
            'symbol': self.symbol,
            'sequence_length': self.sequence_length,
            'test_size': self.test_size,
            'model_path': model_path,
            'scaler_path': scaler_path,
            'created_at': datetime.now().isoformat()
        }
        
        metadata_path = f"models/{self.symbol}_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"Model saved to: {model_path}")
        print(f"Scaler saved to: {scaler_path}")
        print(f"Metadata saved to: {metadata_path}")
    
    def load_model(self, model_path=None, scaler_path=None):
        """
        Load a pre-trained model and scaler
        """
        if model_path is None:
            model_path = f"models/{self.symbol}_lstm_model.h5"
        if scaler_path is None:
            scaler_path = f"models/{self.symbol}_scaler.pkl"
        
        # Load model
        self.model = tf.keras.models.load_model(model_path)
        
        # Load scaler
        self.scaler = joblib.load(scaler_path)
        
        print(f"Model loaded from: {model_path}")
        print(f"Scaler loaded from: {scaler_path}")


def train_multiple_stocks(symbols, period="5y", epochs=100):
    """
    Train LSTM models for multiple stock symbols
    
    Args:
        symbols (list): List of stock symbols
        period (str): Data period
        epochs (int): Training epochs
    """
    results = {}
    
    for symbol in symbols:
        print(f"\n{'='*50}")
        print(f"Training model for {symbol}")
        print(f"{'='*50}")
        
        try:
            # Initialize predictor
            predictor = LSTMStockPredictor(symbol)
            
            # Download and preprocess data
            if predictor.download_data(period=period):
                predictor.preprocess_data()
                
                # Build and train model
                predictor.build_model()
                history = predictor.train_model(epochs=epochs, verbose=1)
                
                # Evaluate model
                metrics, _, _ = predictor.evaluate_model()
                
                # Save model
                predictor.save_model()
                
                results[symbol] = {
                    'success': True,
                    'metrics': metrics
                }
                
            else:
                results[symbol] = {
                    'success': False,
                    'error': 'Failed to download data'
                }
                
        except Exception as e:
            print(f"Error training model for {symbol}: {str(e)}")
            results[symbol] = {
                'success': False,
                'error': str(e)
            }
    
    return results


if __name__ == "__main__":
    # Example usage
    indian_stocks = [
        'RELIANCE.NS',
        'TCS.NS',
        'INFY.NS',
        'HDFCBANK.NS',
        'ICICIBANK.NS'
    ]
    
    print("Starting LSTM model training for Indian stocks...")
    results = train_multiple_stocks(indian_stocks, period="5y", epochs=50)
    
    # Print results summary
    print(f"\n{'='*60}")
    print("TRAINING RESULTS SUMMARY")
    print(f"{'='*60}")
    
    for symbol, result in results.items():
        if result['success']:
            metrics = result['metrics']
            print(f"{symbol}: ✓ Success - RMSE: {metrics['test_rmse']:.2f}")
        else:
            print(f"{symbol}: ✗ Failed - {result['error']}")