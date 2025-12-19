import sys
import json
import argparse
import os
from lstm_trainer import LSTMStockPredictor

def main():
    parser = argparse.ArgumentParser(description='Train LSTM model for a single stock')
    parser.add_argument('symbol', help='Stock symbol (e.g., RELIANCE.NS)')
    parser.add_argument('--period', default='5y', help='Data period (default: 5y)')
    parser.add_argument('--epochs', type=int, default=50, help='Training epochs (default: 50)')
    parser.add_argument('--sequence-length', type=int, default=60, help='Sequence length (default: 60)')
    parser.add_argument('--test-size', type=float, default=0.2, help='Test size (default: 0.2)')
    parser.add_argument('--verbose', type=int, default=1, help='Verbosity level (default: 1)')
    
    args = parser.parse_args()
    
    # Change to script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    try:
        print(f"Starting training for {args.symbol}...")
        
        # Initialize predictor
        predictor = LSTMStockPredictor(
            symbol=args.symbol,
            sequence_length=args.sequence_length,
            test_size=args.test_size
        )
        
        # Download and preprocess data
        if not predictor.download_data(period=args.period):
            result = {
                'success': False,
                'error': f'Failed to download data for {args.symbol}',
                'symbol': args.symbol
            }
            print(json.dumps(result))
            return
        
        predictor.preprocess_data()
        
        # Build and train model
        predictor.build_model()
        history = predictor.train_model(epochs=args.epochs, verbose=args.verbose)
        
        # Evaluate model
        metrics, _, _ = predictor.evaluate_model()
        
        # Save model
        predictor.save_model()
        
        # Prepare result
        result = {
            'success': True,
            'symbol': args.symbol,
            'metrics': metrics,
            'training_epochs': len(history.history['loss']),
            'final_loss': float(history.history['loss'][-1]),
            'final_val_loss': float(history.history['val_loss'][-1]) if 'val_loss' in history.history else None
        }
        
        print(f"Training completed successfully for {args.symbol}")
        print(json.dumps(result))
        
    except Exception as e:
        result = {
            'success': False,
            'error': str(e),
            'symbol': args.symbol
        }
        print(json.dumps(result))
        sys.exit(1)

if __name__ == "__main__":
    main()