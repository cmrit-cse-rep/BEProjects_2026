import os
import numpy as np
from datetime import datetime
import logging
from pathlib import Path
from typing import Optional, Dict, List, Tuple, Any
import json

# Configure TensorFlow logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Only show warnings and errors
import tensorflow as tf
from tensorflow import keras

# Configure general logging
logger = logging.getLogger(__name__)

from sklearn.metrics import (accuracy_score, precision_score, recall_score, f1_score, 
                           roc_auc_score, cohen_kappa_score, confusion_matrix,
                           roc_curve, auc)
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

# Progress bars
try:
    from tqdm import tqdm
    TQDM_AVAILABLE = True
except ImportError:
    TQDM_AVAILABLE = False
    logger.warning("tqdm not available. Progress bars will be disabled.")

# Make UMAP optional - delay import to avoid Numba JIT compilation issues on Windows
UMAP_AVAILABLE = False
def _try_import_umap():
    """Try to import UMAP, but don't fail if unavailable"""
    global UMAP_AVAILABLE
    try:
        import umap as umap_module
        UMAP_AVAILABLE = True
        return umap_module
    except Exception as e:
        logger.warning(f"UMAP not available ({type(e).__name__}). UMAP visualization will be skipped.")
        UMAP_AVAILABLE = False
        return None

umap = None

# GPU and memory utilities
try:
    from utils.gpu_utils import (
        GPUManager, TrainingException, DataValidationError, 
        ModelBuildError, CheckpointError, MemoryError
    )
except ImportError:
    logger.warning("GPU utilities not available. Creating fallback classes.")
    class TrainingException(Exception):
        pass
    class DataValidationError(TrainingException):
        pass
    class ModelBuildError(TrainingException):
        pass
    class CheckpointError(TrainingException):
        pass
    class MemoryError(TrainingException):
        pass
    class GPUManager:
        @staticmethod
        def detect_gpus():
            return {'available': False, 'count': 0}
        @staticmethod
        def configure_gpu_memory(**kwargs):
            return False
        @staticmethod
        def clear_memory():
            pass
        @staticmethod
        def log_memory_status():
            pass

from tensorflow import keras
layers = keras.layers
Model = keras.Model

class TEANetTrainer:
    """
    Trainer for TEANet model with LOSO cross-validation
    Following the exact specifications from the TEANet paper
    
    Configuration Requirements:
    The config dictionary can be either flat (backward compatible) or nested (new structure).
    
    MANDATORY keys (will raise ValueError if missing):
    - samples_per_window (or dataset.samples_per_window): int, positive integer, number of samples per window
      This is critical for data reshaping and MUST be provided. No default is used.
    
    Required keys with defaults (will use defaults if missing, but will validate types if present):
    - batch_size (or training.batch_size): int, positive batch size (default: 16)
    - epochs (or training.epochs): int, positive number of epochs (default: 50)
    - learning_rate (or training.learning_rate): float, positive learning rate (default: 0.0005)
    - patience (or training.patience): int, non-negative early stopping patience (default: 10)
    
    Note: If any of the above keys are missing, defaults will be used. However, if provided, they
    must be of the correct type and within valid ranges, otherwise a ValueError will be raised.
    
    Example minimum config:
    {
        'samples_per_window': 1920,  # MANDATORY - no default
        'batch_size': 16,             # Optional - defaults to 16 if missing
        'epochs': 50,                  # Optional - defaults to 50 if missing
        'learning_rate': 0.0005,       # Optional - defaults to 0.0005 if missing
        'patience': 10                 # Optional - defaults to 10 if missing
    }
    """
    
    def __init__(self, model_builder, data_processor, config, checkpoint_dir: Optional[str] = None):
        """
        Initialize TEANet trainer
        
        Args:
            model_builder: Function to build TEANet model
            data_processor: WESAD data processor instance
            config: Training configuration dictionary (flat or nested structure)
            checkpoint_dir: Optional directory for saving/loading checkpoints (default: None)
            
        Raises:
            DataValidationError: If configuration validation fails
        """
        self.model_builder = model_builder
        self.data_processor = data_processor
        self.config = config
        self.results = {}
        self.best_model = None
        
        # Setup checkpoint directory
        if checkpoint_dir is None:
            checkpoint_dir = self._get_config_value('output.results_dir', 'results')
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
        self.checkpoint_state_file = self.checkpoint_dir / 'training_state.json'
        
        # Detect and configure GPU
        gpu_info = GPUManager.detect_gpus()
        if gpu_info['available']:
            GPUManager.configure_gpu_memory(growth=True)
            logger.info(f"GPU training enabled: {gpu_info['count']} GPU(s) detected")
        else:
            logger.info("CPU training mode (no GPUs detected)")
        
        GPUManager.log_memory_status()
        
        # Validate configuration
        try:
            self._validate_config()
        except ValueError as e:
            raise DataValidationError(f"Configuration validation failed: {e}") from e
    
    def _validate_config(self):
        """
        Validate the configuration dictionary contains all required keys for training.
        
        MANDATORY validation (raises ValueError if missing or invalid):
        - samples_per_window: Must be present and a positive integer
        
        Optional validation with defaults (uses defaults if missing, validates types if present):
        - batch_size, epochs, learning_rate, patience: Use defaults if missing, validate types if provided
        
        These can be either at the top level (for backward compatibility) or nested under
        appropriate sections (e.g., training.batch_size).
        
        Raises:
            ValueError: If samples_per_window is missing or invalid, or if other keys have invalid types/ranges
        """
        # MANDATORY: samples_per_window - no default, must be provided and valid
        samples_per_window = self._get_config_value('dataset.samples_per_window', default=None)
        if samples_per_window is None:
            # Try flat key for backward compatibility
            samples_per_window = self._get_config_value('samples_per_window', default=None)
            if samples_per_window is None:
                raise ValueError(
                    "Missing required configuration key: samples_per_window (or dataset.samples_per_window). "
                    "This key is mandatory and must be provided as it is critical for data reshaping."
                )
        
        # Validate samples_per_window type and range
        if not isinstance(samples_per_window, int):
            raise ValueError(
                f"samples_per_window must be an integer, got {samples_per_window} ({type(samples_per_window)})"
            )
        if samples_per_window <= 0:
            raise ValueError(
                f"samples_per_window must be a positive integer (greater than 0), got {samples_per_window}"
            )
        
        # Optional keys with defaults - validate types if present, use defaults if missing
        batch_size = self._get_config_value('training.batch_size', self._get_config_value('batch_size', 16))
        if not isinstance(batch_size, int) or batch_size <= 0:
            raise ValueError(f"batch_size must be a positive integer, got {batch_size} ({type(batch_size)})")
        
        epochs = self._get_config_value('training.epochs', self._get_config_value('epochs', 50))
        if not isinstance(epochs, int) or epochs <= 0:
            raise ValueError(f"epochs must be a positive integer, got {epochs} ({type(epochs)})")
        
        learning_rate = self._get_config_value('training.learning_rate', self._get_config_value('learning_rate', 0.0005))
        if not isinstance(learning_rate, (int, float)) or learning_rate <= 0:
            raise ValueError(f"learning_rate must be a positive number, got {learning_rate} ({type(learning_rate)})")
        
        patience = self._get_config_value('training.patience', self._get_config_value('patience', 10))
        if not isinstance(patience, int) or patience < 0:
            raise ValueError(f"patience must be a non-negative integer, got {patience} ({type(patience)})")
        
        logging.info("Configuration validated successfully")
    
    def _get_config_value(self, key: str, default=None):
        """
        Safely retrieve config values supporting both flat and nested structures.
        
        Tries to get the value from the nested path first (e.g., 'training.batch_size'),
        then falls back to the flat key (e.g., 'batch_size'), and finally returns the default.
        This provides backward compatibility while supporting the new nested config structure.
        
        Args:
            key: Configuration key (supports dot notation for nested access)
            default: Default value to return if key doesn't exist
            
        Returns:
            Configuration value or default if not found
        """
        # Try nested path first
        if '.' in key:
            keys = key.split('.')
            value = self.config
            try:
                for k in keys:
                    if isinstance(value, dict) and k in value:
                        value = value[k]
                    else:
                        break
                else:
                    # Successfully traversed all keys
                    return value
            except (KeyError, TypeError, AttributeError):
                pass
        
        # Try flat key for backward compatibility
        if key in self.config:
            return self.config[key]
        
        # Try last part of nested key as flat key
        if '.' in key:
            flat_key = key.split('.')[-1]
            if flat_key in self.config:
                logger.warning(f"Using flat key '{flat_key}' instead of nested '{key}'. "
                              f"Consider updating to nested structure.")
                return self.config[flat_key]
        
        # Return default, but log warning if it's a required key
        if default is None:
            logger.warning(f"Config key '{key}' not found, using default value None. "
                          f"This may cause errors if the key is required.")
        return default
    
    def _validate_training_data(self, signals, labels, subject_ids) -> None:
        """
        Validate training data inputs.
        
        Args:
            signals: List of signal windows
            labels: List of corresponding labels
            subject_ids: List of subject IDs
            
        Raises:
            DataValidationError: If validation fails
        """
        if not isinstance(signals, (list, np.ndarray)):
            raise DataValidationError(f"signals must be a list or numpy array, got {type(signals)}")
        
        if not isinstance(labels, (list, np.ndarray)):
            raise DataValidationError(f"labels must be a list or numpy array, got {type(labels)}")
        
        if not isinstance(subject_ids, (list, np.ndarray)):
            raise DataValidationError(f"subject_ids must be a list or numpy array, got {type(subject_ids)}")
        
        if len(signals) == 0:
            raise DataValidationError("signals cannot be empty")
        
        if len(labels) == 0:
            raise DataValidationError("labels cannot be empty")
        
        if len(subject_ids) == 0:
            raise DataValidationError("subject_ids cannot be empty")
        
        if not (len(signals) == len(labels) == len(subject_ids)):
            raise DataValidationError(
                f"Input arrays must have the same length. "
                f"Got signals: {len(signals)}, labels: {len(labels)}, subject_ids: {len(subject_ids)}"
            )
        
        # Validate signal shapes
        samples_per_window = self._get_config_value('dataset.samples_per_window', 
                                                   self._get_config_value('samples_per_window', None))
        if samples_per_window is not None:
            for i, signal in enumerate(signals[:10]):  # Check first 10 samples
                signal_array = np.array(signal)
                if signal_array.size == 0:
                    raise DataValidationError(f"Signal at index {i} is empty")
                if signal_array.ndim == 1 and signal_array.shape[0] != samples_per_window:
                    raise DataValidationError(
                        f"Signal at index {i} has incorrect length. "
                        f"Expected {samples_per_window}, got {signal_array.shape[0]}"
                    )
        
        # Validate labels
        labels_array = np.array(labels)
        unique_labels = np.unique(labels_array)
        num_classes = self._get_config_value('model.num_classes', self._get_config_value('num_classes', 2))
        
        if len(unique_labels) > num_classes:
            raise DataValidationError(
                f"Found {len(unique_labels)} unique labels but model expects {num_classes} classes. "
                f"Unique labels: {unique_labels}"
            )
        
        if np.min(unique_labels) < 0:
            raise DataValidationError(f"Labels must be non-negative, found minimum: {np.min(unique_labels)}")
        
        logger.debug(f"Training data validation passed: {len(signals)} samples, "
                    f"{len(unique_labels)} classes, {len(np.unique(subject_ids))} subjects")
    
    def _save_training_state(self, fold: int, completed_folds: List[int], 
                            fold_results: List[Dict]) -> None:
        """
        Save training state for resume functionality.
        
        Args:
            fold: Current fold number
            completed_folds: List of completed fold numbers
            fold_results: List of fold results dictionaries
        """
        try:
            state = {
                'current_fold': fold,
                'completed_folds': completed_folds,
                'fold_results': [
                    {
                        'fold': r.get('fold'),
                        'test_subject': r.get('test_subject'),
                        'accuracy': float(r.get('accuracy', 0.0)),
                        'f1_score': float(r.get('f1_score', 0.0)),
                        'auc': float(r.get('auc', 0.0))
                    }
                    for r in fold_results
                ],
                'timestamp': datetime.now().isoformat()
            }
            
            with open(self.checkpoint_state_file, 'w') as f:
                json.dump(state, f, indent=2)
            
            logger.debug(f"Training state saved: fold {fold}, {len(completed_folds)} completed")
            
        except Exception as e:
            logger.warning(f"Failed to save training state: {e}")
    
    def _load_training_state(self) -> Optional[Dict]:
        """
        Load training state for resume functionality.
        
        Returns:
            Training state dictionary or None if no state exists
        """
        if not self.checkpoint_state_file.exists():
            return None
        
        try:
            with open(self.checkpoint_state_file, 'r') as f:
                state = json.load(f)
            
            logger.info(f"Found training state: {len(state.get('completed_folds', []))} folds completed, "
                       f"resuming from fold {state.get('current_fold', 1)}")
            return state
            
        except Exception as e:
            logger.warning(f"Failed to load training state: {e}")
            return None
    
    def _should_resume_training(self) -> bool:
        """
        Check if training should be resumed.
        
        Returns:
            True if training should be resumed, False otherwise
        """
        resume = self._get_config_value('training.resume', self._get_config_value('resume', False))
        return resume and self.checkpoint_state_file.exists()
        
    def train_with_loso(self, signals, labels, subject_ids):
        """
        Train model using Leave-One-Subject-Out (LOSO) cross-validation
        
        Args:
            signals: List of signal windows (can be single or multi-channel)
            labels: List of corresponding labels
            subject_ids: List of subject IDs
            
        Returns:
            Dictionary containing training results and metrics
            
        Raises:
            DataValidationError: If input data validation fails
            TrainingException: If training fails
        """
        try:
            # Log header
            logger.info("="*80)
            logger.info("TEANet LOSO Cross-Validation Training")
            logger.info("="*80)
            
            # Input validation
            try:
                self._validate_training_data(signals, labels, subject_ids)
            except DataValidationError as e:
                logger.error(f"Training data validation failed: {e}")
                raise
            
            # Prepare data for LOSO
            logger.info("Step 1: Preparing LOSO Data Structure...")
            subject_data = self.data_processor.prepare_loso_data(signals, labels, subject_ids)
            unique_subjects = sorted(list(subject_data.keys()))
            
            # Log data summary
            logger.info(f"Found {len(unique_subjects)} subjects: {', '.join(unique_subjects)}")
            logger.info(f"Total samples: {len(signals)}")
            # Only log class distribution for classification tasks
            if len(np.unique(labels)) <= 10:  # Reasonable threshold for classification
                class_dist = np.bincount(np.array(labels).astype(int))
                if len(class_dist) == 2:
                    logger.info(f"Class distribution: {class_dist[0]} normal, {class_dist[1]} stress")
                else:
                    logger.info(f"Class distribution: {dict(zip(range(len(class_dist)), class_dist))}")
        
            # Check for resume
            training_state = None
            if self._should_resume_training():
                training_state = self._load_training_state()
                if training_state:
                    logger.info("Resuming training from checkpoint")
            
            # Initialize results storage
            fold_results = []
            all_predictions = []
            all_true_labels = []
            all_features = []
            
            # Load previous results if resuming
            if training_state:
                fold_results = training_state.get('fold_results', [])
                completed_folds = set(training_state.get('completed_folds', []))
                logger.info(f"Loaded {len(fold_results)} previous fold results")
            else:
                completed_folds = set()
            
            logger.info("Step 2: Starting LOSO Cross-Validation...")
            logger.info("-" * 80)
            
            # Create progress bar for folds
            fold_iterator = enumerate(unique_subjects, 1)
            if TQDM_AVAILABLE:
                fold_iterator = tqdm(fold_iterator, total=len(unique_subjects), 
                                    desc="LOSO Folds", unit="fold")
            
            # LOSO cross-validation
            for fold, test_subject in fold_iterator:
                try:
                    # Skip if fold already completed (resume functionality)
                    if fold in completed_folds:
                        logger.info(f"Skipping fold {fold} (Subject {test_subject}) - already completed")
                        continue
                    
                    logger.info(f"Fold {fold}/{len(unique_subjects)} - Testing on Subject {test_subject}")
                    logger.info("-" * 40)
                    
                    # Split data
                    train_subjects = [s for s in unique_subjects if s != test_subject]
                    test_subjects = [test_subject]
                    
                    # Apply TEANet augmentation
                    logger.debug("Preparing fold data...")
                    train_signals, train_labels, test_signals, test_labels = \
                        self.data_processor.apply_teanet_augmentation(
                            signals, labels, subject_ids, 
                            train_subjects, test_subjects
                        )
                    
                    # Convert to numpy arrays and reshape based on signal dimensions
                    samples_per_window = self._get_config_value('dataset.samples_per_window', 
                                                               self._get_config_value('samples_per_window', 1920))
                    input_channels = self._get_config_value('model.input_channels', 
                                                           self._get_config_value('input_channels', 1))
                    
                    # Reshape training data
                    train_array = np.array(train_signals)
                    if train_array.ndim == 2:
                        # Single channel: add channel dimension
                        X_train = train_array.reshape(-1, samples_per_window, 1)
                    elif train_array.ndim == 3:
                        # Multi-channel: already has channel dimension
                        X_train = train_array
                    else:
                        X_train = train_array.reshape(-1, samples_per_window, input_channels)
                    
                    y_train = np.array(train_labels)
                    
                    # Reshape test data
                    test_array = np.array(test_signals)
                    if test_array.ndim == 2:
                        # Single channel: add channel dimension
                        X_test = test_array.reshape(-1, samples_per_window, 1)
                    elif test_array.ndim == 3:
                        # Multi-channel: already has channel dimension
                        X_test = test_array
                    else:
                        X_test = test_array.reshape(-1, samples_per_window, input_channels)
                    
                    y_test = np.array(test_labels)
                    
                    logger.debug(f"Training set shape: {X_train.shape}")
                    logger.debug(f"Test set shape: {X_test.shape}")
                    # Only log class distribution for classification tasks
                    if len(np.unique(y_train)) <= 10:
                        logger.debug(f"Training class distribution: {np.bincount(y_train.astype(int))}")
                        logger.debug(f"Test class distribution: {np.bincount(y_test.astype(int))}")
                    else:
                        logger.debug(f"Training label range: [{np.min(y_train):.2f}, {np.max(y_train):.2f}]")
                        logger.debug(f"Test label range: [{np.min(y_test):.2f}, {np.max(y_test):.2f}]")
                    
                    # Train model for this fold
                    try:
                        model, history = self._train_fold(X_train, y_train, X_test, y_test, fold)
                    except (ModelBuildError, MemoryError) as e:
                        logger.error(f"Failed to train fold {fold}: {e}")
                        raise TrainingException(f"Training failed for fold {fold}") from e
                    except Exception as e:
                        logger.error(f"Unexpected error training fold {fold}: {e}")
                        raise TrainingException(f"Training failed for fold {fold}") from e
                    
                    # Evaluate model
                    try:
                        fold_result = self._evaluate_fold(model, X_test, y_test, fold, test_subject)
                        fold_results.append(fold_result)
                    except Exception as e:
                        logger.error(f"Failed to evaluate fold {fold}: {e}")
                        raise TrainingException(f"Evaluation failed for fold {fold}") from e
                    
                    # Store predictions and features for overall analysis
                    predictions = model.predict(X_test, verbose=0)
                    all_predictions.extend(predictions)
                    all_true_labels.extend(y_test)
                    
                    # Extract features for UMAP visualization
                    feature_extractor = self._get_feature_extractor_from_keras_model(model)
                    features = feature_extractor.predict(X_test, verbose=0)
                    all_features.extend(features)
                    
                    # Save best model if this fold has better performance
                    if fold_result['accuracy'] > self.results.get('best_accuracy', 0):
                        self.results['best_accuracy'] = fold_result['accuracy']
                        self.best_model = model
                        logger.info(f"New best model saved with accuracy: {fold_result['accuracy']:.4f}")
                    
                    # Mark fold as completed and save state
                    completed_folds.add(fold)
                    self._save_training_state(fold, list(completed_folds), fold_results)
                    
                    # Clear memory
                    del model
                    GPUManager.clear_memory()
                    
                except TrainingException:
                    # Re-raise training exceptions
                    raise
                except Exception as e:
                    logger.error(f"Error in fold {fold} (Subject {test_subject}): {str(e)}", exc_info=True)
                    # Continue to next fold instead of failing completely
                    continue
            
            # Compute overall results
            if len(fold_results) == 0:
                logger.error("No fold results available. Training may have failed for all folds.")
                raise TrainingException("No successful folds completed")
            
            overall_results = self._compute_overall_results(fold_results, all_predictions, all_true_labels)
            
            # Store all results
            self.results.update({
                'fold_results': fold_results,
                'overall_results': overall_results,
                'all_features': np.array(all_features),
                'all_true_labels': np.array(all_true_labels),
                'all_predictions': np.array(all_predictions)
            })
            
            # Clear checkpoint state on successful completion
            if self.checkpoint_state_file.exists():
                try:
                    self.checkpoint_state_file.unlink()
                    logger.info("Training completed successfully. Checkpoint state cleared.")
                except Exception as e:
                    logger.warning(f"Failed to clear checkpoint state: {e}")
            
            logger.info("Training completed successfully!")
            return self.results
            
        except (DataValidationError, TrainingException) as e:
            logger.error(f"Training error: {str(e)}", exc_info=True)
            raise
        except Exception as e:
            logger.error(f"Unexpected error during training: {str(e)}", exc_info=True)
            raise TrainingException(f"Training failed: {e}") from e
    
    def _train_fold(self, X_train, y_train, X_val, y_val, fold):
        """
        Train model for a single fold
        
        Args:
            X_train: Training features
            y_train: Training labels
            X_val: Validation features
            y_val: Validation labels
            fold: Fold number
            
        Returns:
            Trained model and training history
        """
        logger.info("Initializing Model Training...")
        logger.info("-" * 40)
        
        # Build model with progress tracking
        try:
            logger.debug("Building model architecture...")
            model = self.model_builder()
            logger.debug("Model built successfully")
        except Exception as e:
            logger.error(f"Failed to build model: {e}")
            raise ModelBuildError(f"Model building failed: {e}") from e
        
        try:
            # Create callbacks directory
            callbacks_dir = os.path.join("models", "callbacks", f"fold_{fold}")
            os.makedirs(callbacks_dir, exist_ok=True)
            
            # Callbacks
            callbacks = []
            
            # 1. Early stopping
            patience = self._get_config_value('training.patience', self._get_config_value('patience', 10))
            early_stopping = keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=patience,
                restore_best_weights=True,
                verbose=0
            )
            callbacks.append(early_stopping)
            
            # 2. Model checkpoint
            checkpoint_path = os.path.join("models", f"teanet_fold_{fold}.h5")
            os.makedirs("models", exist_ok=True)
            checkpoint = keras.callbacks.ModelCheckpoint(
                checkpoint_path,
                monitor='val_accuracy',
                save_best_only=True,
                verbose=0
            )
            callbacks.append(checkpoint)
            
            # 3. Reduce learning rate on plateau
            reduce_lr = keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-6,
                verbose=0
            )
            callbacks.append(reduce_lr)
            
            # 4. TensorBoard logging
            tensorboard = keras.callbacks.TensorBoard(
                log_dir=os.path.join(callbacks_dir, 'tensorboard'),
                histogram_freq=1,
                write_graph=True
            )
            callbacks.append(tensorboard)
            
            # 5. CSV Logger
            csv_logger = keras.callbacks.CSVLogger(
                os.path.join(callbacks_dir, 'training_log.csv'),
                append=True
            )
            callbacks.append(csv_logger)
            
            # Log training configuration
            batch_size = self._get_config_value('training.batch_size', self._get_config_value('batch_size', 16))
            learning_rate = self._get_config_value('training.learning_rate', self._get_config_value('learning_rate', 0.0005))
            epochs = self._get_config_value('training.epochs', self._get_config_value('epochs', 50))
            patience = self._get_config_value('training.patience', self._get_config_value('patience', 10))
            
            logger.info(f"Training Configuration:")
            logger.info(f"  Batch size: {batch_size}")
            logger.info(f"  Learning rate: {learning_rate}")
            logger.info(f"  Max epochs: {epochs}")
            logger.info(f"  Early stopping patience: {patience}")
            
            # Train model with progress tracking
            logger.info("Training model...")
            try:
                history = model.fit(
                    X_train, y_train,
                    validation_data=(X_val, y_val),
                    batch_size=batch_size,
                    epochs=epochs,
                    callbacks=callbacks,
                    verbose=1 if TQDM_AVAILABLE else 2  # Use verbose=1 with tqdm, 2 without
                )
            except tf.errors.ResourceExhaustedError as e:
                logger.error(f"Out of memory during training: {e}")
                GPUManager.clear_memory()
                raise MemoryError(f"GPU/CPU memory exhausted: {e}") from e
            
            # Training summary
            val_accuracy = max(history.history['val_accuracy'])
            best_epoch = np.argmax(history.history['val_accuracy']) + 1
            logger.info(f"Training completed:")
            logger.info(f"  Best validation accuracy: {val_accuracy:.4f} (epoch {best_epoch})")
            logger.info(f"  Model saved to: {checkpoint_path}")
            
            return model, history
            
        except FileNotFoundError as e:
            logger.error(f"Failed to access model files or directories for fold {fold}: {str(e)}")
            raise CheckpointError(f"File access error: {e}") from e
        except tf.errors.ResourceExhaustedError as e:
            logger.error(f"Out of memory while training fold {fold}. Try reducing batch size or model complexity: {str(e)}")
            GPUManager.clear_memory()
            raise MemoryError(f"Memory exhausted: {e}") from e
        except Exception as e:
            logger.error(f"Unexpected error during training fold {fold}: {str(e)}", exc_info=True)
            raise TrainingException(f"Training fold {fold} failed: {e}") from e
    
    def _evaluate_fold(self, model, X_test, y_test, fold, test_subject):
        """
        Evaluate model for a single fold
        
        Args:
            model: Trained model
            X_test: Test features
            y_test: Test labels
            fold: Fold number
            test_subject: Test subject ID
            
        Returns:
            Dictionary containing evaluation metrics
        """
        logger.info("Evaluating Model Performance...")
        logger.info("-" * 40)
        
        try:
            # Make predictions with progress tracking
            logger.debug("Generating predictions...")
            predictions = model.predict(X_test, verbose=0)
            y_pred = np.argmax(predictions, axis=1)
            y_pred_proba = predictions[:, 1]  # Probability of stress class
            logger.debug("Predictions generated")
            
            # Compute core metrics
            logger.debug("Computing performance metrics...")
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, average='binary', zero_division=0)
            recall = recall_score(y_test, y_pred, average='binary', zero_division=0)
            f1 = f1_score(y_test, y_pred, average='binary', zero_division=0)
            
            # Sensitivity and Specificity
            tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
            sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0
            specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
            
            # AUC and Kappa
            try:
                auc = roc_auc_score(y_test, y_pred_proba)
            except (ValueError, RuntimeError) as e:
                logger.warning(f"Failed to compute AUC for fold {fold} (subject {test_subject}): {str(e)}. Using default value of 0.5")
                auc = 0.5
            
            kappa = cohen_kappa_score(y_test, y_pred)
            logger.debug("Metrics computed")
            
            # Confusion matrix
            cm = confusion_matrix(y_test, y_pred)
        
            # Store results
            fold_result = {
                'fold': fold,
                'test_subject': test_subject,
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1_score': f1,
                'sensitivity': sensitivity,
                'specificity': specificity,
                'auc': auc,
                'kappa': kappa,
                'confusion_matrix': cm,
                'predictions': y_pred,
                'probabilities': y_pred_proba,
                'true_labels': y_test
            }
            
            # Log results in organized sections
            logger.info(f"Results for Subject {test_subject} (Fold {fold}):")
            logger.info("-" * 40)
            
            logger.info("Classification Metrics:")
            logger.info(f"  Accuracy:    {accuracy:.4f}")
            logger.info(f"  F1-Score:    {f1:.4f}")
            logger.info(f"  AUC:         {auc:.4f}")
            logger.info(f"  Kappa:       {kappa:.4f}")
            
            logger.info("Detailed Metrics:")
            logger.info(f"  Precision:   {precision:.4f}")
            logger.info(f"  Recall:      {recall:.4f}")
            logger.info(f"  Sensitivity: {sensitivity:.4f}")
            logger.info(f"  Specificity: {specificity:.4f}")
            
            logger.info("Confusion Matrix:")
            logger.info(f"  [Normal]  [Stress]")
            logger.info(f"    {cm[0][0]:4d}     {cm[0][1]:4d}    [Normal]")
            logger.info(f"    {cm[1][0]:4d}     {cm[1][1]:4d}    [Stress]")
            
            return fold_result
            
        except ValueError as e:
            logger.error(f"Invalid data or predictions for fold {fold} (subject {test_subject}): {str(e)}")
            raise DataValidationError(f"Evaluation data validation failed: {e}") from e
        except RuntimeError as e:
            logger.error(f"Computation error during evaluation of fold {fold} (subject {test_subject}): {str(e)}")
            raise TrainingException(f"Evaluation computation failed: {e}") from e
        except Exception as e:
            logger.error(f"Unexpected error during evaluation of fold {fold} (subject {test_subject}): {str(e)}", exc_info=True)
            raise TrainingException(f"Evaluation failed: {e}") from e
    
    def _compute_overall_results(self, fold_results, all_predictions, all_true_labels):
        """
        Compute overall results across all folds
        
        Args:
            fold_results: List of fold results
            all_predictions: All predictions across folds
            all_true_labels: All true labels across folds
            
        Returns:
            Dictionary containing overall metrics
        """
        logger.info("Computing Overall Performance...")
        logger.info("=" * 80)
        
        try:
            # Input validation
            if len(all_predictions) == 0:
                logger.error("No predictions available for evaluation")
                raise DataValidationError("No predictions available for overall evaluation")
            
            # Convert to numpy array if needed
            all_predictions = np.array(all_predictions) if not isinstance(all_predictions, np.ndarray) else all_predictions
            all_true_labels = np.array(all_true_labels) if not isinstance(all_true_labels, np.ndarray) else all_true_labels
            
            logger.debug("Computing overall metrics...")
            all_pred_labels = np.argmax(all_predictions, axis=1)
            
            # Compute overall metrics
            overall_accuracy = accuracy_score(all_true_labels, all_pred_labels)
            overall_precision = precision_score(all_true_labels, all_pred_labels, average='binary', zero_division=0)
            overall_recall = recall_score(all_true_labels, all_pred_labels, average='binary', zero_division=0)
            overall_f1 = f1_score(all_true_labels, all_pred_labels, average='binary', zero_division=0)
            
            # Overall sensitivity and specificity
            cm_full = confusion_matrix(all_true_labels, all_pred_labels, labels=[0, 1])
            tn, fp, fn, tp = cm_full.ravel()
            overall_sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0
            overall_specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
            
            # Overall AUC and Kappa
            try:
                overall_auc = roc_auc_score(all_true_labels, all_predictions[:, 1])
            except (ValueError, RuntimeError) as e:
                logger.error(f"Failed to compute overall AUC: {str(e)}. This may indicate an issue with class distribution. Using default value of 0.5")
                overall_auc = 0.5
            
            overall_kappa = cohen_kappa_score(all_true_labels, all_pred_labels)
            logger.debug("Overall metrics computed")
            
            # Overall confusion matrix
            overall_cm = cm_full
        
            # Compute average metrics across folds
            logger.debug("Computing cross-validation statistics...")
            avg_accuracy = np.mean([r['accuracy'] for r in fold_results])
            avg_sensitivity = np.mean([r['sensitivity'] for r in fold_results])
            avg_specificity = np.mean([r['specificity'] for r in fold_results])
            avg_f1 = np.mean([r['f1_score'] for r in fold_results])
            avg_auc = np.mean([r['auc'] for r in fold_results])
            avg_kappa = np.mean([r['kappa'] for r in fold_results])
            
            # Compute standard deviations
            std_accuracy = np.std([r['accuracy'] for r in fold_results])
            std_sensitivity = np.std([r['sensitivity'] for r in fold_results])
            std_specificity = np.std([r['specificity'] for r in fold_results])
            std_f1 = np.std([r['f1_score'] for r in fold_results])
            std_auc = np.std([r['auc'] for r in fold_results])
            std_kappa = np.std([r['kappa'] for r in fold_results])
            logger.debug("Cross-validation statistics computed")
            
            # Store overall results
            overall_results = {
                'overall_accuracy': overall_accuracy,
                'overall_precision': overall_precision,
                'overall_recall': overall_recall,
                'overall_f1_score': overall_f1,
                'overall_sensitivity': overall_sensitivity,
                'overall_specificity': overall_specificity,
                'overall_auc': overall_auc,
                'overall_kappa': overall_kappa,
                'overall_confusion_matrix': overall_cm,
                'average_accuracy': avg_accuracy,
                'average_sensitivity': avg_sensitivity,
                'average_specificity': avg_specificity,
                'average_f1_score': avg_f1,
                'average_auc': avg_auc,
                'average_kappa': avg_kappa,
                'std_accuracy': std_accuracy,
                'std_sensitivity': std_sensitivity,
                'std_specificity': std_specificity,
                'std_f1': std_f1,
                'std_auc': std_auc,
                'std_kappa': std_kappa
            }
            
            # Log results in organized sections
            logger.info("Final Performance Summary")
            logger.info("=" * 80)
            
            logger.info("1. Overall Performance Metrics:")
            logger.info(f"  Accuracy:    {overall_accuracy:.4f}")
            logger.info(f"  F1-Score:    {overall_f1:.4f}")
            logger.info(f"  AUC:         {overall_auc:.4f}")
            logger.info(f"  Kappa:       {overall_kappa:.4f}")
            
            logger.info("2. Detailed Overall Metrics:")
            logger.info(f"  Precision:   {overall_precision:.4f}")
            logger.info(f"  Recall:      {overall_recall:.4f}")
            logger.info(f"  Sensitivity: {overall_sensitivity:.4f}")
            logger.info(f"  Specificity: {overall_specificity:.4f}")
            
            logger.info("3. Cross-Validation Results (Mean ± Std):")
            logger.info(f"  Accuracy:    {avg_accuracy:.4f} ± {std_accuracy:.4f}")
            logger.info(f"  F1-Score:    {avg_f1:.4f} ± {std_f1:.4f}")
            logger.info(f"  AUC:         {avg_auc:.4f} ± {std_auc:.4f}")
            logger.info(f"  Kappa:       {avg_kappa:.4f} ± {std_kappa:.4f}")
            
            logger.info("4. Overall Confusion Matrix:")
            logger.info(f"  [Normal]  [Stress]")
            logger.info(f"    {overall_cm[0][0]:4d}     {overall_cm[0][1]:4d}    [Normal]")
            logger.info(f"    {overall_cm[1][0]:4d}     {overall_cm[1][1]:4d}    [Stress]")
            
            return overall_results
            
        except Exception as e:
            logger.error(f"Error computing overall results: {str(e)}", exc_info=True)
            raise TrainingException(f"Failed to compute overall results: {e}") from e

    def _get_feature_extractor_from_keras_model(self, keras_model):
        """Build a feature extractor model from a compiled Keras model by locating the GlobalAveragePooling1D layer."""
        gap_layer = None
        for layer in reversed(keras_model.layers):
            if isinstance(layer, layers.GlobalAveragePooling1D):
                gap_layer = layer
                break
        if gap_layer is None:
            # Fallback: use penultimate layer
            gap_layer = keras_model.layers[-2]
        return Model(inputs=keras_model.input, outputs=gap_layer.output)
    
    def save_results(self, output_dir="results"):
        """
        Save training results and visualizations
        
        Args:
            output_dir: Output directory for results
        """
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save results summary
        results_file = os.path.join(output_dir, f"teanet_results_{timestamp}.txt")
        with open(results_file, 'w') as f:
            f.write("TEANet Training Results\n")
            f.write("=" * 50 + "\n\n")
            
            # Overall results
            overall = self.results['overall_results']
            f.write("OVERALL RESULTS:\n")
            f.write(f"Accuracy: {overall['overall_accuracy']:.4f}\n")
            f.write(f"Precision: {overall['overall_precision']:.4f}\n")
            f.write(f"Recall: {overall['overall_recall']:.4f}\n")
            f.write(f"F1-Score: {overall['overall_f1_score']:.4f}\n")
            f.write(f"Sensitivity: {overall['overall_sensitivity']:.4f}\n")
            f.write(f"Specificity: {overall['overall_specificity']:.4f}\n")
            f.write(f"AUC: {overall['overall_auc']:.4f}\n")
            f.write(f"Kappa: {overall['overall_kappa']:.4f}\n\n")
            
            # Per-fold results
            f.write("PER-FOLD RESULTS:\n")
            for fold_result in self.results['fold_results']:
                f.write(f"Fold {fold_result['fold']} ({fold_result['test_subject']}):\n")
                f.write(f"  Accuracy: {fold_result['accuracy']:.4f}\n")
                f.write(f"  Sensitivity: {fold_result['sensitivity']:.4f}\n")
                f.write(f"  Specificity: {fold_result['specificity']:.4f}\n")
                f.write(f"  F1-Score: {fold_result['f1_score']:.4f}\n")
                f.write(f"  AUC: {fold_result['auc']:.4f}\n")
                f.write(f"  Kappa: {fold_result['kappa']:.4f}\n\n")
        
        logger.info(f"Results saved to {results_file}")
        
        # Save best model
        if self.best_model is not None:
            best_model_path = os.path.join(output_dir, f"teanet_best_model_{timestamp}.h5")
            self.best_model.save(best_model_path)
            logger.info(f"Best model saved to {best_model_path}")
        
        return results_file
    
    def create_visualizations(self, output_dir="results"):
        """
        Create and save visualizations for explainability
        
        Args:
            output_dir: Output directory for visualizations
        """
        plots_dir = os.path.join(output_dir, "plots")
        os.makedirs(plots_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 1. Confusion Matrix
        self._plot_confusion_matrix(plots_dir, timestamp)
        
        # 2. UMAP Visualization
        self._plot_umap_visualization(plots_dir, timestamp)
        
        # 3. Per-fold Performance
        self._plot_performance_comparison(plots_dir, timestamp)
        
        # 4. ROC Curves
        self._plot_roc_curves(plots_dir, timestamp)
        
        # 5. Training History (if available)
        if hasattr(self, 'training_history'):
            self._plot_training_history(plots_dir, timestamp)
        
        logger.info(f"Visualizations saved to {plots_dir}")
    
    def _plot_confusion_matrix(self, output_dir, timestamp):
        """Plot overall confusion matrix with normalized values and metrics"""
        overall_cm = self.results['overall_results']['overall_confusion_matrix']
        
        # Calculate normalized confusion matrix
        cm_normalized = overall_cm.astype('float') / overall_cm.sum(axis=1)[:, np.newaxis]
        
        # Create figure with two subplots side by side
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
        
        # Plot absolute confusion matrix
        sns.heatmap(overall_cm, annot=True, fmt='d', cmap='Blues',
                   xticklabels=['Normal', 'Stress'],
                   yticklabels=['Normal', 'Stress'], ax=ax1)
        ax1.set_title('Absolute Confusion Matrix')
        ax1.set_ylabel('True Label')
        ax1.set_xlabel('Predicted Label')
        
        # Plot normalized confusion matrix
        sns.heatmap(cm_normalized, annot=True, fmt='.3f', cmap='RdYlBu_r',
                   xticklabels=['Normal', 'Stress'],
                   yticklabels=['Normal', 'Stress'], ax=ax2)
        ax2.set_title('Normalized Confusion Matrix')
        ax2.set_ylabel('True Label')
        ax2.set_xlabel('Predicted Label')
        
        # Add performance metrics as text
        metrics_text = (
            f"Accuracy: {self.results['overall_results']['overall_accuracy']:.3f}\n"
            f"Sensitivity: {self.results['overall_results']['overall_sensitivity']:.3f}\n"
            f"Specificity: {self.results['overall_results']['overall_specificity']:.3f}\n"
            f"F1-Score: {self.results['overall_results']['overall_f1_score']:.3f}\n"
            f"AUC: {self.results['overall_results']['overall_auc']:.3f}"
        )
        
        fig.suptitle('Confusion Matrix Analysis', fontsize=12, y=1.05)
        plt.figtext(0.98, 0.5, metrics_text, fontsize=10, ha='left', va='center',
                   bbox=dict(facecolor='white', edgecolor='gray', alpha=0.8))
        
        plt.tight_layout()
        cm_path = os.path.join(output_dir, f"confusion_matrix_{timestamp}.png")
        plt.savefig(cm_path, dpi=300, bbox_inches='tight')
        logger.debug(f"Confusion matrix plot saved as: confusion_matrix_{timestamp}.png")
        plt.close()
    
    def _plot_umap_visualization(self, output_dir, timestamp):
        """Create UMAP visualization of features"""
        global umap
        if not UMAP_AVAILABLE:
            # Try lazy import on first use
            umap = _try_import_umap()
            if not UMAP_AVAILABLE:
                logger.info("Skipping UMAP visualization (UMAP not available)")
                return
            
        try:
            # Apply UMAP dimensionality reduction
            reducer = umap.UMAP(n_components=2, random_state=42)
            features_2d = reducer.fit_transform(self.results['all_features'])
            
            # Plot UMAP visualization
            plt.figure(figsize=(10, 8))
            
            # Plot normal samples
            normal_mask = self.results['all_true_labels'] == 0
            plt.scatter(features_2d[normal_mask, 0], features_2d[normal_mask, 1], 
                       c='blue', label='Normal', alpha=0.6, s=50)
            
            # Plot stress samples
            stress_mask = self.results['all_true_labels'] == 1
            plt.scatter(features_2d[stress_mask, 0], features_2d[stress_mask, 1], 
                       c='red', label='Stress', alpha=0.6, s=50)
            
            plt.title('UMAP Visualization of TEANet Features')
            plt.xlabel('UMAP Component 1')
            plt.ylabel('UMAP Component 2')
            plt.legend()
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            
            umap_path = os.path.join(output_dir, f"umap_visualization_{timestamp}.png")
            plt.savefig(umap_path, dpi=300, bbox_inches='tight')
            plt.close()
            logger.debug(f"UMAP visualization saved as: umap_visualization_{timestamp}.png")
            
        except Exception as e:
            logger.warning(f"Error creating UMAP visualization: {e}")
    
    def _plot_performance_comparison(self, output_dir, timestamp):
        """Plot performance comparison across folds"""
        fold_results = self.results['fold_results']
        
        metrics = ['accuracy', 'sensitivity', 'specificity', 'f1_score', 'auc']
        metric_names = ['Accuracy', 'Sensitivity', 'Specificity', 'F1-Score', 'AUC']
        
        fig, axes = plt.subplots(2, 3, figsize=(18, 12))
        axes = axes.ravel()
        
        for i, (metric, name) in enumerate(zip(metrics, metric_names)):
            values = [fold_result[metric] for fold_result in fold_results]
            subjects = [fold_result['test_subject'] for fold_result in fold_results]
            
            # Calculate mean and std for the metric
            mean_val = np.mean(values)
            std_val = np.std(values)
            
            # Plot bars
            bars = axes[i].bar(range(len(values)), values, color='skyblue', alpha=0.7)
            
            # Add horizontal line for mean
            axes[i].axhline(y=mean_val, color='red', linestyle='--', label=f'Mean: {mean_val:.3f}')
            
            # Add horizontal lines for standard deviation
            axes[i].axhline(y=mean_val + std_val, color='gray', linestyle=':', alpha=0.5)
            axes[i].axhline(y=mean_val - std_val, color='gray', linestyle=':', alpha=0.5)
            
            axes[i].set_title(f'{name} by Fold\n(Mean: {mean_val:.3f} ± {std_val:.3f})')
            axes[i].set_xlabel('Subject')
            axes[i].set_ylabel(name)
            axes[i].set_xticks(range(len(subjects)))
            axes[i].set_xticklabels(subjects, rotation=45)
            axes[i].grid(True, alpha=0.3)
            axes[i].legend()
            
            # Add value labels on bars
            for j, v in enumerate(values):
                axes[i].text(j, v + 0.01, f'{v:.3f}', ha='center', va='bottom')
        
        # Remove extra subplot
        axes[-1].remove()
        
        plt.tight_layout()
        perf_path = os.path.join(output_dir, f"performance_comparison_{timestamp}.png")
        plt.savefig(perf_path, dpi=300, bbox_inches='tight')
        logger.debug(f"Performance comparison plot saved as: performance_comparison_{timestamp}.png")
        plt.close()
    
    def _plot_roc_curves(self, output_dir, timestamp):
        """Plot ROC curves for each fold and overall"""
        plt.figure(figsize=(10, 8))
        
        # Plot ROC curve for each fold
        mean_tpr = np.linspace(0, 1, 100)
        aucs = []
        
        for fold_result in self.results['fold_results']:
            fpr, tpr, _ = roc_curve(fold_result['true_labels'], fold_result['probabilities'])
            roc_auc = auc(fpr, tpr)
            aucs.append(roc_auc)
            
            # Interpolate TPR at mean FPR points
            interp_tpr = np.interp(mean_tpr, fpr, tpr)
            interp_tpr[0] = 0.0
            plt.plot(fpr, tpr, alpha=0.3, label=f'Fold {fold_result["test_subject"]} (AUC = {roc_auc:.3f})')
        
        # Plot chance level
        plt.plot([0, 1], [0, 1], linestyle='--', color='gray', alpha=0.8, label='Chance level')
        
        # Plot mean ROC curve
        mean_auc = np.mean(aucs)
        std_auc = np.std(aucs)
        plt.plot(mean_tpr, mean_tpr, color='blue', alpha=0.8,
                label=f'Mean ROC (AUC = {mean_auc:.3f} ± {std_auc:.3f})',
                linestyle='--', linewidth=2)
        
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title('Receiver Operating Characteristic (ROC) Curves')
        plt.legend(loc='lower right', bbox_to_anchor=(1.4, 0))
        plt.grid(True, alpha=0.3)
        
        roc_path = os.path.join(output_dir, f"roc_curves_{timestamp}.png")
        plt.savefig(roc_path, dpi=300, bbox_inches='tight')
        logger.debug(f"ROC curves plot saved as: roc_curves_{timestamp}.png")
        plt.close()
    
    def _plot_training_history(self, output_dir, timestamp):
        """Plot training history (loss and accuracy curves)"""
        if not hasattr(self, 'training_history'):
            return
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))
        
        # Plot training & validation loss
        ax1.plot(self.training_history.history['loss'], label='Training Loss')
        ax1.plot(self.training_history.history['val_loss'], label='Validation Loss')
        ax1.set_title('Model Loss')
        ax1.set_xlabel('Epoch')
        ax1.set_ylabel('Loss')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # Plot training & validation accuracy
        ax2.plot(self.training_history.history['accuracy'], label='Training Accuracy')
        ax2.plot(self.training_history.history['val_accuracy'], label='Validation Accuracy')
        ax2.set_title('Model Accuracy')
        ax2.set_xlabel('Epoch')
        ax2.set_ylabel('Accuracy')
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        
        plt.tight_layout()
        history_path = os.path.join(output_dir, f"training_history_{timestamp}.png")
        plt.savefig(history_path, dpi=300, bbox_inches='tight')
        logger.debug(f"Training history plot saved as: training_history_{timestamp}.png")
        plt.close()
