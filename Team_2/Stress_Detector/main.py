# -*- coding: utf-8 -*-
# Standard Library Imports
import argparse
import logging
import os
import sys
import traceback
import numpy as np
from pathlib import Path
from datetime import datetime

# Force UTF-8 encoding on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except:
        pass

# Project Class Imports
from config_manager import ConfigManager
from data_processing import create_data_loader
from teanet_model import TEANetModel
from training import TEANetTrainer
from tflite_converter import TEANetTFLiteConverter

def main():
    """
    Main execution function for TEANet stress detection model
    """
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='TEANet Stress Detection Model')
    parser.add_argument('--config', type=str, default='config.yaml',
                        help='Path to configuration file (default: config.yaml)')
    parser.add_argument('--test', action='store_true', default=False,
                        help='Run in test mode with reduced dataset and epochs (default: False)')
    parser.add_argument('--subjects', type=int, default=None,
                        help='Number of subjects to use for training (default: all)')
    parser.add_argument('--epochs', type=int, default=None,
                        help='Number of epochs for training (default: from config)')
    args = parser.parse_args()
    
    # Set up logging
    log_dir = Path('results/logs')
    log_dir.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_dir / 'main.log'),
            logging.StreamHandler()
        ]
    )
    logger = logging.getLogger(__name__)
    logger.info("=" * 80)
    logger.info("TEANet: Transpose-Enhanced Autoencoder Network for Wearable Stress Monitoring")
    logger.info("=" * 80)
    logger.info(f"Execution started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Load configuration from file
    try:
        config_manager = ConfigManager(args.config)
    except FileNotFoundError as e:
        logger.error(f"Configuration file error: {str(e)}")
        return False
    except ValueError as e:
        logger.error(f"Configuration validation error: {str(e)}")
        return False
    
    # Create overrides dictionary from CLI arguments
    overrides = {}
    if args.test:
        overrides['training.batch_size'] = 8
        overrides['training.epochs'] = 5
        overrides['training.patience'] = 2
        overrides['dataset.max_subjects'] = 2
    if args.subjects is not None:
        overrides['dataset.max_subjects'] = args.subjects
    if args.epochs is not None:
        overrides['training.epochs'] = args.epochs
    
    # Apply overrides
    if overrides:
        config_manager.merge_overrides(overrides)
    
    # Compute derived values
    config_manager.compute_derived_values()
    
    # Get config dict
    config = config_manager.to_dict()
    
    # Log configuration
    logger.info("Configuration:")
    logger.info("  Model Type: Standard TEANet")
    logger.info(f"  Config file: {args.config}")
    
    def log_config_recursive(cfg_dict, prefix="  "):
        """Recursively log nested configuration dictionary"""
        for key, value in cfg_dict.items():
            if isinstance(value, dict):
                logger.info(f"{prefix}{key}:")
                log_config_recursive(value, prefix + "  ")
            else:
                logger.info(f"{prefix}{key}: {value}")
    
    log_config_recursive(config)
    
    try:
        # Step 1: Initialize data loader based on config
        dataset_format = config['dataset'].get('format', 'pickle')
        dataset_name = config['dataset'].get('name', 'Unknown')
        logger.info(f"Step 1: Initializing {dataset_name} Data Loader (format: {dataset_format})...")
        data_loader = create_data_loader(config)
        logger.info("Data loader initialized successfully")
        
        # Step 2: Load dataset
        logger.info(f"Step 2: Loading {dataset_name} Dataset...")
        # Get subject list from config if specified
        subjects = config['dataset'].get('subjects', None)
        signals, labels, subject_ids = data_loader.load_data(
            dataset_path=config['dataset']['path'],
            subjects=subjects
        )
        
        if len(signals) == 0:
            logger.error(f"No data loaded from {dataset_name} dataset!")
            return False
        
        # Determine signal shape for reporting
        if isinstance(signals[0], (list, np.ndarray)):
            signal_shape = np.array(signals[0]).shape
            if len(signal_shape) == 2:
                signal_info = f"{signal_shape[0]} samples × {signal_shape[1]} channels"
            else:
                signal_info = f"{signal_shape[0]} samples"
        else:
            signal_info = "unknown shape"
        
        logger.info(f"Loaded {len(signals)} signal windows from {len(set(subject_ids))} subjects")
        if config['model'].get('num_classes', 2) > 1:
            logger.info(f"Class distribution: {np.bincount(labels)}")
        logger.info(f"Window size: {signal_info} ({config['dataset']['window_size_seconds']}s at {config['dataset']['sampling_rate']}Hz)")
        
        # Step 3: Data quality check and filtering
        logger.info("Step 3: Data Quality Check...")
        unique_subjects = list(set(subject_ids))
        subject_counts = {}
        
        for subject in unique_subjects:
            subject_mask = [sid == subject for sid in subject_ids]
            subject_counts[subject] = sum(subject_mask)
        
        logger.info("Subject data distribution:")
        for subject, count in sorted(subject_counts.items()):
            logger.info(f"  {subject}: {count} windows")
        
        # Filter subjects with insufficient data
        valid_subjects = [s for s, c in subject_counts.items() if c >= config['dataset']['min_windows_per_subject']]
        logger.info(f"Valid subjects (≥{config['dataset']['min_windows_per_subject']} windows): {len(valid_subjects)}")
        logger.info(f"Subjects: {valid_subjects}")
        
        # Apply max_subjects limit if specified
        max_subjects = config['dataset'].get('max_subjects')
        if max_subjects is not None and max_subjects > 0:
            original_count = len(valid_subjects)
            if max_subjects < len(valid_subjects):
                valid_subjects = valid_subjects[:max_subjects]
                logger.info(f"Limited to first {max_subjects} subjects (from {original_count} available)")
            else:
                logger.info(f"max_subjects={max_subjects} is >= available subjects ({original_count}), using all subjects")
        
        # Apply filtering to keep only valid subjects
        if len(valid_subjects) == 0:
            logger.error("No subjects meet the minimum window requirement!")
            return False
        
        filtered_signals = []
        filtered_labels = []
        filtered_subject_ids = []
        for s, l, sid in zip(signals, labels, subject_ids):
            if sid in valid_subjects:
                filtered_signals.append(s)
                filtered_labels.append(l)
                filtered_subject_ids.append(sid)
        
        signals, labels, subject_ids = filtered_signals, np.array(filtered_labels), np.array(filtered_subject_ids)
        logger.info(f"After filtering: {len(signals)} windows from {len(set(subject_ids))} subjects")
        
        # Step 4 & 5: Define model builder and initialize trainer
        logger.info("Step 4 & 5: Initializing TEANet Model Builder and Trainer...")

        def model_builder():
            """Function to build and compile a fresh TEANet model for each fold"""
            model_wrapper = TEANetModel(
                input_shape=(config['dataset']['samples_per_window'], config['model']['input_channels']),
                num_classes=config['model']['num_classes'],
                config=config
            )
            model_wrapper.build_model(tea_layers=config['model']['tea_layers'])
            model = model_wrapper.compile_model(learning_rate=config['training']['learning_rate'])
            return model

        # Build one model to log the summary
        logger.info("Model Summary (for one instance):")
        temp_model = model_builder()
        temp_model.summary(print_fn=logger.info)

        # Initialize trainer
        trainer = TEANetTrainer(
            model_builder=model_builder,
            data_processor=data_loader,
            config=config
        )
        logger.info("Trainer initialized successfully")
        
        # Step 6: Train model using LOSO cross-validation
        logger.info("Step 6: Training TEANet Model with LOSO Cross-Validation...")
        try:
            training_results = trainer.train_with_loso(signals, labels, subject_ids)
        except Exception as e:
            logger.error(f"Training failed: {str(e)}", exc_info=True)
            return False
        
        logger.info("Training completed successfully!")
        
        # Step 7: Save results and visualizations
        logger.info("Step 7: Saving Results and Visualizations...")
        
        results_file = trainer.save_results(output_dir=config['output']['results_dir'])
        trainer.create_visualizations(output_dir=config['output']['results_dir'])
        logger.info(f"Results saved to: {results_file}")
        
        # Save effective configuration
        effective_config_path = os.path.join(config['output']['results_dir'], 'effective_config.yaml')
        config_manager.save_config(effective_config_path)
        logger.info(f"Effective configuration saved to: {effective_config_path}")
        
        # Step 8: Convert to TensorFlow Lite
        logger.info("Step 8: Converting to TensorFlow Lite...")
        
        if trainer.best_model is not None:
            # Save best model first
            best_model_path = os.path.join(config['output']['results_dir'], "teanet_best_model.h5")
            trainer.best_model.save(best_model_path)
            logger.info(f"Best model saved to: {best_model_path}")
            
            # Initialize TFLite converter
            converter = TEANetTFLiteConverter(
                model_path=best_model_path,
                output_dir=os.path.join(config['output']['results_dir'], "tflite_models")
            )
            
            # Convert to all formats
            # Use a subset of data for representative dataset
            sample_data = signals[:min(100, len(signals))]
            tflite_paths = converter.convert_all_formats(sample_data, num_samples=50)
            
            if tflite_paths:
                logger.info("TensorFlow Lite conversion completed successfully!")
                
                # Compare model sizes
                converter.compare_model_sizes(tflite_paths)
                
                # Create deployment information
                deployment_info = converter.create_deployment_info(tflite_paths)
                logger.info(f"Deployment information saved to: {deployment_info}")
                
                # Test TFLite model
                logger.info("Testing TFLite model...")
                # Reshape test data based on signal dimensions
                test_samples = signals[:5]
                if isinstance(test_samples[0], (list, np.ndarray)):
                    test_array = np.array(test_samples)
                    if test_array.ndim == 2:
                        # Single channel: add channel dimension
                        test_data = test_array.reshape(-1, config['samples_per_window'], 1)
                    elif test_array.ndim == 3:
                        # Multi-channel: already has channel dimension
                        test_data = test_array
                    else:
                        test_data = test_array.reshape(-1, config['samples_per_window'], 1)
                else:
                    test_data = np.array(test_samples).reshape(-1, config['samples_per_window'], 1)
                predictions = converter.test_tflite_model(list(tflite_paths.values())[0], test_data)
                if predictions is not None:
                    logger.info("TFLite model inference test successful!")
            else:
                logger.error("TensorFlow Lite conversion failed!")
        else:
            logger.error("No best model available for conversion!")
        
        # Final summary
        logger.info("=" * 80)
        logger.info("TRAINING COMPLETED SUCCESSFULLY!")
        logger.info("=" * 80)
        
        logger.info("Final Model Performance:")
        logger.info(f"  Overall Accuracy: {training_results['overall_results']['overall_accuracy']:.4f}")
        logger.info(f"  Overall Sensitivity: {training_results['overall_results']['overall_sensitivity']:.4f}")
        logger.info(f"  Overall Specificity: {training_results['overall_results']['overall_specificity']:.4f}")
        logger.info(f"  Overall F1-Score: {training_results['overall_results']['overall_f1_score']:.4f}")
        logger.info(f"  Overall AUC: {training_results['overall_results']['overall_auc']:.4f}")
        logger.info(f"  Overall Kappa: {training_results['overall_results']['overall_kappa']:.4f}")
        
        logger.info(f"Results and models saved to: {config['output']['results_dir']}")
        logger.info(f"Execution completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    except Exception as e:
        logger.error(f"Error during execution: {str(e)}", exc_info=True)
        return False

    return True

if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.critical(f"Fatal error: {str(e)}", exc_info=True)
        sys.exit(1)