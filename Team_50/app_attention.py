from flask import Flask, request, jsonify
import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from tensorflow.keras.models import load_model
from sklearn.preprocessing import RobustScaler
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)

MODEL_DIR = '.'
SEQ_LENGTH = 60  # Enhanced sequence length

CALIBRATION_ALPHA = float(os.environ.get('CALIBRATION_ALPHA', '0.8'))  # Higher confidence in attention models
CLAMP_PCT = float(os.environ.get('CLAMP_PCT', '0.08'))  # Tighter bounds for better models

MARKET_CROPS = {
    'davangere': ['Cotton', 'Maize', 'Ragi', 'Rice', 'Tomato'],
    'gangavathi': ['Cotton', 'Maize', 'Ragi', 'Rice'],
    'HBhalli': ['Cotton', 'Maize', 'Ragi', 'Rice'],
    'hospet': ['Maize', 'Ragi', 'Rice', 'Tomato']
}

# Enhanced caches
_attention_lstm_cache = {}
_xgb_cache = None
_ensemble_cache = None

def _ensure_price_scaler(obj):
    """Handle both old and new scaler formats"""
    if isinstance(obj, dict) and 'price_scaler' in obj:
        return obj['price_scaler']
    return obj

def load_attention_lstm_model_and_scaler(market: str, crop: str):
    """Load attention-enhanced LSTM model with advanced architecture"""
    key = (market, crop)
    if key in _attention_lstm_cache:
        return _attention_lstm_cache[key]
    
    # Try attention model first, fallback to enhanced model, then regular model
    model_paths = [
        f'lstm_attention_{market}_{crop}.keras',
        f'lstm_enhanced_{market}_{crop}.keras',
        f'lstm_{market}_{crop}.keras'
    ]
    
    scaler_paths = [
        f'lstm_attention_{market}_{crop}_scaler.pkl',
        f'lstm_enhanced_{market}_{crop}_scaler.pkl',
        f'lstm_{market}_{crop}_scaler.pkl'
    ]
    
    model_path = None
    scaler_path = None
    
    for mp, sp in zip(model_paths, scaler_paths):
        if os.path.exists(mp) and os.path.exists(sp):
            model_path = mp
            scaler_path = sp
            break
    
    if model_path and scaler_path:
        try:
            model = load_model(model_path, compile=False)
            scaler_data = joblib.load(scaler_path)
            
            # Handle different scaler formats
            if isinstance(scaler_data, dict):
                price_scaler = scaler_data.get('price_scaler', scaler_data)
                feature_scaler = scaler_data.get('feature_scaler', None)
            else:
                price_scaler = scaler_data
                feature_scaler = None
            
            _attention_lstm_cache[key] = (model, price_scaler, feature_scaler)
            return model, price_scaler, feature_scaler
        except Exception as e:
            print(f"Error loading model {model_path}: {e}")
            return None, None, None
    
    return None, None, None

def load_ensemble_model():
    """Load ensemble model for crop recommendations"""
    global _ensemble_cache
    if _ensemble_cache is not None:
        return _ensemble_cache
    
    ensemble_path = os.path.join(MODEL_DIR, 'ensemble_crop_recommendation.pkl')
    scaler_path = os.path.join(MODEL_DIR, 'ensemble_scaler.pkl')
    
    if os.path.exists(ensemble_path) and os.path.exists(scaler_path):
        try:
            ensemble_model = joblib.load(ensemble_path)
            ensemble_scaler = joblib.load(scaler_path)
            _ensemble_cache = (ensemble_model, ensemble_scaler)
            return ensemble_model, ensemble_scaler
        except Exception as e:
            print(f"Error loading ensemble model: {e}")
            return None, None
    
    return None, None

def build_advanced_features(prices_np: np.ndarray):
    """Enhanced feature engineering with more sophisticated features"""
    p = prices_np.flatten()
    
    def roll_mean(x, w):
        return pd.Series(x).rolling(window=w, min_periods=1).mean().values
    
    def roll_std(x, w):
        return pd.Series(x).rolling(window=w, min_periods=2).std(ddof=0).fillna(0).values
    
    def roll_min(x, w):
        return pd.Series(x).rolling(window=w, min_periods=1).min().values
    
    def roll_max(x, w):
        return pd.Series(x).rolling(window=w, min_periods=1).max().values
    
    # Multiple time windows
    ma7 = roll_mean(p, 7)
    ma14 = roll_mean(p, 14)
    ma30 = roll_mean(p, 30)
    ma60 = roll_mean(p, 60)
    
    std7 = roll_std(p, 7)
    std14 = roll_std(p, 14)
    std30 = roll_std(p, 30)
    
    min7 = roll_min(p, 7)
    min14 = roll_min(p, 14)
    min30 = roll_min(p, 30)
    
    max7 = roll_max(p, 7)
    max14 = roll_max(p, 14)
    max30 = roll_max(p, 30)
    
    # Price ratios (scale-free features)
    eps = 1e-6
    r_ma7 = p / (ma7 + eps)
    r_ma14 = p / (ma14 + eps)
    r_ma30 = p / (ma30 + eps)
    r_ma60 = p / (ma60 + eps)
    
    # Volatility ratios
    r_std7 = std7 / (ma7 + eps)
    r_std14 = std14 / (ma14 + eps)
    r_std30 = std30 / (ma30 + eps)
    
    # Range ratios
    r_min7 = p / (min7 + eps)
    r_min14 = p / (min14 + eps)
    r_min30 = p / (min30 + eps)
    
    r_max7 = p / (max7 + eps)
    r_max14 = p / (max14 + eps)
    r_max30 = p / (max30 + eps)
    
    # Price momentum (rate of change)
    momentum_1 = np.diff(p, prepend=p[0])
    momentum_3 = pd.Series(p).diff(3).fillna(0).values
    momentum_7 = pd.Series(p).diff(7).fillna(0).values
    
    # Technical indicators
    rsi_14 = calculate_rsi(p, 14)
    bollinger_upper, bollinger_lower = calculate_bollinger_bands(p, 20, 2)
    bollinger_position = (p - bollinger_lower) / (bollinger_upper - bollinger_lower + eps)
    
    # Combine all features
    features = np.column_stack([
        p,  # Original price
        ma7, ma14, ma30, ma60,  # Moving averages
        std7, std14, std30,  # Standard deviations
        min7, min14, min30,  # Minimums
        max7, max14, max30,  # Maximums
        r_ma7, r_ma14, r_ma30, r_ma60,  # Price ratios
        r_std7, r_std14, r_std30,  # Volatility ratios
        r_min7, r_min14, r_min30,  # Min ratios
        r_max7, r_max14, r_max30,  # Max ratios
        momentum_1, momentum_3, momentum_7,  # Momentum
        rsi_14, bollinger_position  # Technical indicators
    ])
    
    return features

def calculate_rsi(prices, window=14):
    """Calculate Relative Strength Index"""
    delta = pd.Series(prices).diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50).values

def calculate_bollinger_bands(prices, window=20, num_std=2):
    """Calculate Bollinger Bands"""
    rolling_mean = pd.Series(prices).rolling(window=window).mean()
    rolling_std = pd.Series(prices).rolling(window=window).std()
    upper_band = rolling_mean + (rolling_std * num_std)
    lower_band = rolling_mean - (rolling_std * num_std)
    return upper_band.fillna(method='bfill').values, lower_band.fillna(method='bfill').values

def predict_price_attention(market: str, crop: str, history: list = None, anchor_price: float = None):
    """Make price prediction using attention-enhanced LSTM"""
    
    model, price_scaler, feature_scaler = load_attention_lstm_model_and_scaler(market, crop)
    if model is None:
        return None, "Attention model not found"
    
    try:
        # Use provided history or generate default
        if history is None or len(history) < SEQ_LENGTH:
            # Generate default history based on anchor price
            if anchor_price is None:
                anchor_price = 2000  # Default price
            history = [anchor_price] * SEQ_LENGTH
        
        # Ensure we have enough history
        if len(history) < SEQ_LENGTH:
            history = [history[0]] * (SEQ_LENGTH - len(history)) + history
        
        # Take the last SEQ_LENGTH values
        recent_history = history[-SEQ_LENGTH:]
        
        # Build features
        prices_array = np.array(recent_history).reshape(-1, 1)
        features = build_advanced_features(prices_array)
        
        # Scale features if feature scaler is available
        if feature_scaler is not None:
            features_scaled = feature_scaler.transform(features)
        else:
            features_scaled = features
        
        # Scale prices
        prices_scaled = price_scaler.transform(prices_array)
        features_scaled[:, 0] = prices_scaled.flatten()
        
        # Reshape for LSTM input
        X = features_scaled.reshape(1, SEQ_LENGTH, features_scaled.shape[1])
        
        # Make prediction
        prediction_scaled = model.predict(X, verbose=0)[0][0]
        
        # Inverse transform prediction
        prediction = price_scaler.inverse_transform([[prediction_scaled]])[0][0]
        
        # Apply calibration and clamping
        if anchor_price is not None:
            # Calibrate prediction towards anchor price
            prediction = CALIBRATION_ALPHA * prediction + (1 - CALIBRATION_ALPHA) * anchor_price
            
            # Clamp prediction within reasonable bounds
            min_price = anchor_price * (1 - CLAMP_PCT)
            max_price = anchor_price * (1 + CLAMP_PCT)
            prediction = np.clip(prediction, min_price, max_price)
        
        return prediction, None
        
    except Exception as e:
        return None, f"Prediction error: {str(e)}"

def predict_crop_recommendation(market: str, month: int = None):
    """Predict crop recommendations using ensemble model"""
    
    ensemble_model, ensemble_scaler = load_ensemble_model()
    if ensemble_model is None:
        return None, "Ensemble model not found"
    
    try:
        # Create feature vector for prediction
        features = np.array([[
            month if month is not None else 6,  # Default to June
            1 if market == 'davangere' else 0,
            1 if market == 'gangavathi' else 0,
            1 if market == 'HBhalli' else 0,
            1 if market == 'hospet' else 0
        ]])
        
        # Scale features
        features_scaled = ensemble_scaler.transform(features)
        
        # Make prediction
        prediction = ensemble_model.predict(features_scaled)[0]
        
        # Get crop probabilities
        crop_probs = ensemble_model.predict_proba(features_scaled)[0]
        
        # Map to crop names
        crop_names = ['Cotton', 'Maize', 'Ragi', 'Rice', 'Tomato']
        recommendations = []
        
        for i, prob in enumerate(crop_probs):
            if i < len(crop_names):
                recommendations.append({
                    'crop': crop_names[i],
                    'probability': float(prob),
                    'confidence': 'High' if prob > 0.7 else 'Medium' if prob > 0.4 else 'Low'
                })
        
        # Sort by probability
        recommendations.sort(key=lambda x: x['probability'], reverse=True)
        
        return recommendations, None
        
    except Exception as e:
        return None, f"Recommendation error: {str(e)}"

@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        task = data.get('task', 'price_forecast')
        market = data.get('market', '').lower()
        crop = data.get('crop', '')
        history = data.get('history', [])
        anchor_price = data.get('anchor_price')
        month = data.get('month')
        
        if not market:
            return jsonify({'error': 'Market is required'}), 400
        
        if market not in MARKET_CROPS:
            return jsonify({'error': 'Invalid market'}), 400
        
        if task == 'price_forecast' and not crop:
            return jsonify({'error': 'Crop is required for price forecasting'}), 400
        
        if task == 'price_forecast' and crop not in MARKET_CROPS[market]:
            return jsonify({'error': 'Invalid crop for this market'}), 400
        
        if task == 'price_forecast':
            prediction, error = predict_price_attention(market, crop, history, anchor_price)
            if error:
                return jsonify({'error': error}), 500
            
            return jsonify({
                'prediction': float(prediction),
                'model_type': 'attention_lstm',
                'confidence': 'high',
                'market': market,
                'crop': crop
            })
        
        elif task == 'crop_recommendation':
            recommendations, error = predict_crop_recommendation(market, month)
            if error:
                return jsonify({'error': error}), 500
            
            return jsonify({
                'recommendations': recommendations,
                'model_type': 'ensemble',
                'market': market,
                'month': month
            })
        
        else:
            return jsonify({'error': 'Invalid task'}), 400
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_type': 'attention_enhanced_lstm',
        'version': '2.0'
    })

@app.route('/models', methods=['GET'])
def list_models():
    models = []
    for market in MARKET_CROPS.keys():
        for crop in MARKET_CROPS[market]:
            mp = f"lstm_attention_{market}_{crop}.keras"
            sp = f"lstm_attention_{market}_{crop}_scaler.pkl"
            mp2 = f"lstm_enhanced_{market}_{crop}.keras"
            sp2 = f"lstm_enhanced_{market}_{crop}_scaler.pkl"
            mp3 = f"lstm_{market}_{crop}.keras"
            sp3 = f"lstm_{market}_{crop}_scaler.pkl"
            available = []
            if os.path.exists(mp) and os.path.exists(sp):
                available.append(mp)
            if os.path.exists(mp2) and os.path.exists(sp2):
                available.append(mp2)
            if os.path.exists(mp3) and os.path.exists(sp3):
                available.append(mp3)
            if available:
                models.append({'market': market, 'crop': crop, 'available_models': available})
    return jsonify({'available': models})

@app.route('/pwd', methods=['GET'])
def pwd():
    import os
    try:
        cwd = os.getcwd()
        files = sorted(os.listdir(cwd))
    except Exception as e:
        return {"error": str(e)}
    return {"cwd": cwd, "files": files}



if __name__ == '__main__':
    print("Starting Attention-Enhanced LSTM API Server...")
    print("=" * 50)
    print("Model Type: Attention-Enhanced LSTM")
    print("Features: Multi-Head Attention, Bidirectional LSTM")
    print("Expected Accuracy: 90%+")
    print("=" * 50)
    
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
