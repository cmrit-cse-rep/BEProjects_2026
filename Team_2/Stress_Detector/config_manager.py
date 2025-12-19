"""
Configuration Manager for TEANet Stress Detection System

This module provides a ConfigManager class for loading, validating, and managing
YAML-based configuration files with schema validation and type checking.
"""

import yaml
import os
from typing import Any, Dict, Optional, Union
import logging

logger = logging.getLogger(__name__)


class ConfigManager:
    """
    Manages configuration loading, validation, and access for the TEANet system.
    
    Provides methods to:
    - Load YAML configuration files
    - Validate configuration against schema
    - Access nested configuration values using dot notation
    - Merge CLI overrides
    - Compute derived values
    - Save effective configuration
    """
    
    def __init__(self, config_path: str = 'config.yaml'):
        """
        Initialize the ConfigManager with a configuration file path.
        
        Args:
            config_path: Path to the YAML configuration file
            
        Raises:
            FileNotFoundError: If the config file doesn't exist
            ValueError: If the config fails validation
        """
        self.config_path = config_path
        self.config: Dict[str, Any] = {}
        self._schema = self._define_schema()
        
        # Load and validate config during initialization
        self.load_config()
        self.validate_config()
    
    def _define_schema(self) -> Dict[str, Any]:
        """
        Define the configuration schema with required fields, optional fields, and types.
        
        Returns:
            Dictionary defining the schema structure
        """
        return {
            'dataset': {
                'required': ['name', 'path', 'format', 'sampling_rate', 'window_size_seconds', 'label_mapping'],
                'optional': ['signal_type', 'feature_columns', 'label_column', 'subject_id_column', 
                            'window_overlap', 'min_windows_per_subject', 'subjects'],
                'types': {
                    'sampling_rate': (int, float),
                    'window_size_seconds': (int, float),
                    'label_mapping': dict,
                    'window_overlap': (int, float),
                    'min_windows_per_subject': int,
                    'format': str
                },
                'enums': {
                    'format': ['pickle', 'csv', 'hdf5', 'numpy']
                }
            },
            'model': {
                'required': ['architecture', 'tea_layers', 'num_classes'],
                'optional': ['input_channels', 'filters', 'gru_units', 'gru_layers', 
                            'use_attention', 'fusion_dim'],
                'types': {
                    'tea_layers': int,
                    'num_classes': int,
                    'input_channels': (int, type(None)),
                    'gru_units': int,
                    'gru_layers': int,
                    'fusion_dim': int
                },
                'enums': {
                    'architecture': ['TEANet', 'HybridTEANet']
                }
            },
            'training': {
                'required': ['batch_size', 'epochs', 'learning_rate', 'patience', 'optimizer', 'loss'],
                'optional': ['validation_strategy', 'use_augmentation', 'augmentation_step_size',
                            'balance_method', 'use_advanced_optimization', 'use_cosine_annealing',
                            'use_warm_restarts', 'gradient_clip_norm', 'weight_decay', 'label_smoothing'],
                'types': {
                    'batch_size': int,
                    'epochs': int,
                    'learning_rate': (int, float),
                    'patience': int,
                    'gradient_clip_norm': (int, float),
                    'weight_decay': (int, float),
                    'label_smoothing': (int, float)
                },
                'enums': {
                    'validation_strategy': ['LOSO', 'k-fold', 'holdout'],
                    'optimizer': ['RMSprop', 'Adam', 'SGD']
                }
            },
            'preprocessing': {
                'required': ['normalization'],
                'optional': ['per_window', 'remove_outliers', 'outlier_threshold'],
                'types': {
                    'per_window': bool,
                    'remove_outliers': bool,
                    'outlier_threshold': (int, float)
                },
                'enums': {
                    'normalization': ['z-score', 'min-max', 'robust']
                }
            },
            'output': {
                'required': ['results_dir'],
                'optional': ['save_best_model', 'save_all_folds', 'create_visualizations', 'tflite_conversion'],
                'types': {
                    'save_best_model': bool,
                    'save_all_folds': bool,
                    'create_visualizations': bool,
                    'tflite_conversion': bool
                }
            }
        }
    
    def load_config(self) -> Dict[str, Any]:
        """
        Load the YAML configuration file.
        
        Returns:
            Loaded configuration dictionary
            
        Raises:
            FileNotFoundError: If the config file doesn't exist
            yaml.YAMLError: If the YAML is malformed
        """
        if not os.path.exists(self.config_path):
            error_msg = (
                f"Configuration file not found: {self.config_path}\n"
                f"Please create a config.yaml file. You can copy config_example.yaml as a template."
            )
            raise FileNotFoundError(error_msg)
        
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self.config = yaml.safe_load(f)
            
            if self.config is None:
                raise ValueError("Configuration file is empty")
            
            logger.info(f"Configuration loaded from {self.config_path}")
            return self.config
            
        except yaml.YAMLError as e:
            error_msg = f"Error parsing YAML file {self.config_path}: {str(e)}"
            raise yaml.YAMLError(error_msg) from e
    
    def validate_config(self) -> None:
        """
        Validate the loaded configuration against the schema.
        
        Raises:
            ValueError: If validation fails with descriptive error messages
        """
        if not isinstance(self.config, dict):
            raise ValueError("Configuration must be a dictionary")
        
        # Check for required sections
        required_sections = ['dataset', 'model', 'training', 'preprocessing', 'output']
        missing_sections = [s for s in required_sections if s not in self.config]
        if missing_sections:
            raise ValueError(f"Missing required configuration sections: {', '.join(missing_sections)}")
        
        # Validate each section
        for section_name, section_schema in self._schema.items():
            if section_name not in self.config:
                continue
            
            section_config = self.config[section_name]
            if not isinstance(section_config, dict):
                raise ValueError(f"Section '{section_name}' must be a dictionary")
            
            # Check required fields
            required_fields = section_schema.get('required', [])
            missing_fields = [f for f in required_fields if f not in section_config]
            if missing_fields:
                raise ValueError(
                    f"Missing required fields in section '{section_name}': {', '.join(missing_fields)}"
                )
            
            # Validate types
            type_specs = section_schema.get('types', {})
            for field_name, expected_type in type_specs.items():
                if field_name not in section_config:
                    continue
                
                value = section_config[field_name]
                if value is None:
                    continue
                
                if not isinstance(value, expected_type):
                    raise ValueError(
                        f"Field '{section_name}.{field_name}' has incorrect type. "
                        f"Expected {expected_type}, got {type(value)}"
                    )
            
            # Validate enum values
            enum_specs = section_schema.get('enums', {})
            for field_name, valid_values in enum_specs.items():
                if field_name not in section_config:
                    continue
                
                value = section_config[field_name]
                if value not in valid_values:
                    raise ValueError(
                        f"Field '{section_name}.{field_name}' has invalid value '{value}'. "
                        f"Valid values: {', '.join(valid_values)}"
                    )
            
            # Validate numeric constraints
            if section_name == 'dataset':
                if 'sampling_rate' in section_config:
                    sr = section_config['sampling_rate']
                    if sr <= 0:
                        raise ValueError("dataset.sampling_rate must be positive")
                
                if 'window_size_seconds' in section_config:
                    ws = section_config['window_size_seconds']
                    if ws <= 0:
                        raise ValueError("dataset.window_size_seconds must be positive")
            
            elif section_name == 'model':
                if 'tea_layers' in section_config:
                    tl = section_config['tea_layers']
                    if tl <= 0:
                        raise ValueError("model.tea_layers must be positive")
                
                if 'num_classes' in section_config:
                    nc = section_config['num_classes']
                    if nc < 2:
                        raise ValueError("model.num_classes must be >= 2")
            
            elif section_name == 'training':
                if 'batch_size' in section_config:
                    bs = section_config['batch_size']
                    if bs <= 0:
                        raise ValueError("training.batch_size must be positive")
                
                if 'epochs' in section_config:
                    ep = section_config['epochs']
                    if ep <= 0:
                        raise ValueError("training.epochs must be positive")
                
                if 'learning_rate' in section_config:
                    lr = section_config['learning_rate']
                    if lr <= 0:
                        raise ValueError("training.learning_rate must be positive")
                
                if 'patience' in section_config:
                    pat = section_config['patience']
                    if pat < 0:
                        raise ValueError("training.patience must be non-negative")
        
        logger.info("Configuration validated successfully")
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Safely retrieve a configuration value using dot notation.
        
        Args:
            key: Dot-separated key path (e.g., "dataset.sampling_rate")
            default: Default value to return if key doesn't exist
            
        Returns:
            Configuration value or default if not found
            
        Example:
            >>> config_manager.get("dataset.sampling_rate")
            64
            >>> config_manager.get("training.batch_size", 16)
            16
        """
        keys = key.split('.')
        value = self.config
        
        try:
            for k in keys:
                if isinstance(value, dict) and k in value:
                    value = value[k]
                else:
                    return default
            return value
        except (KeyError, TypeError, AttributeError):
            return default
    
    def get_section(self, section_name: str) -> Dict[str, Any]:
        """
        Retrieve an entire configuration section.
        
        Args:
            section_name: Name of the section (e.g., "dataset", "model")
            
        Returns:
            Dictionary containing the section configuration
            
        Raises:
            KeyError: If the section doesn't exist
        """
        if section_name not in self.config:
            raise KeyError(f"Configuration section '{section_name}' not found")
        
        return self.config[section_name]
    
    def merge_overrides(self, overrides: Dict[str, Any]) -> None:
        """
        Merge CLI argument overrides into the loaded config.
        
        Args:
            overrides: Dictionary of overrides using dot notation keys
                      (e.g., {"training.epochs": 100, "dataset.subjects": ["S2", "S3"]})
        
        Example:
            >>> config_manager.merge_overrides({"training.epochs": 100})
            >>> config_manager.get("training.epochs")
            100
        """
        for key_path, value in overrides.items():
            keys = key_path.split('.')
            config_ref = self.config
            
            # Navigate to the parent dictionary
            for k in keys[:-1]:
                if k not in config_ref:
                    config_ref[k] = {}
                elif not isinstance(config_ref[k], dict):
                    config_ref[k] = {}
                config_ref = config_ref[k]
            
            # Set the value
            final_key = keys[-1]
            config_ref[final_key] = value
            logger.info(f"Override applied: {key_path} = {value}")
    
    def compute_derived_values(self) -> None:
        """
        Calculate derived configuration values that depend on other config values.
        
        Computes:
        - samples_per_window: window_size_seconds * sampling_rate
        - augmentation_step_size: samples_per_window // 4 (if null)
        - input_channels: Based on feature columns (if null)
        
        Also adds commonly used values to top level for backward compatibility.
        
        Note: This method assumes the config has been validated via validate_config().
        However, it includes defensive checks to provide clear error messages if required
        keys are missing or invalid. Callers should not mutate self.config directly
        without re-validation.
        
        Raises:
            ValueError: If required keys are missing or invalid when computing derived values
        """
        # Defensive checks for required keys used in computation
        dataset_section = self.config.get('dataset')
        if not isinstance(dataset_section, dict):
            raise ValueError(
                "Missing or invalid 'dataset' section in configuration. "
                "Cannot compute derived values."
            )
        
        window_size = dataset_section.get('window_size_seconds')
        if window_size is None:
            raise ValueError(
                "Missing required key 'dataset.window_size_seconds' for computing derived values. "
                "This key is required to calculate samples_per_window."
            )
        if not isinstance(window_size, (int, float)) or window_size <= 0:
            raise ValueError(
                f"Invalid value for 'dataset.window_size_seconds': {window_size}. "
                "Must be a positive number."
            )
        
        sampling_rate = dataset_section.get('sampling_rate')
        if sampling_rate is None:
            raise ValueError(
                "Missing required key 'dataset.sampling_rate' for computing derived values. "
                "This key is required to calculate samples_per_window."
            )
        if not isinstance(sampling_rate, (int, float)) or sampling_rate <= 0:
            raise ValueError(
                f"Invalid value for 'dataset.sampling_rate': {sampling_rate}. "
                "Must be a positive number."
            )
        
        # Compute samples_per_window
        samples_per_window = int(window_size * sampling_rate)
        
        # Store in dataset section
        self.config['dataset']['samples_per_window'] = samples_per_window
        
        # Add to top level for backward compatibility
        self.config['samples_per_window'] = samples_per_window
        self.config['window_size'] = window_size
        self.config['target_sample_rate'] = sampling_rate
        
        # Compute augmentation_step_size if null
        if 'training' not in self.config:
            raise ValueError(
                "Missing 'training' section in configuration. "
                "Cannot compute derived values."
            )
        training_section = self.config['training']
        if not isinstance(training_section, dict):
            raise ValueError(
                "Invalid 'training' section in configuration. "
                "Must be a dictionary."
            )
        
        if training_section.get('augmentation_step_size') is None:
            aug_step = max(1, samples_per_window // 4)
            training_section['augmentation_step_size'] = aug_step
        
        # Compute input_channels if null (default to 1 for single-channel)
        if 'model' not in self.config:
            raise ValueError(
                "Missing 'model' section in configuration. "
                "Cannot compute derived values."
            )
        model_section = self.config['model']
        if not isinstance(model_section, dict):
            raise ValueError(
                "Invalid 'model' section in configuration. "
                "Must be a dictionary."
            )
        
        if model_section.get('input_channels') is None:
            signal_type = dataset_section.get('signal_type', 'BVP')
            if isinstance(signal_type, list):
                input_channels = len(signal_type)
            else:
                input_channels = 1
            model_section['input_channels'] = input_channels
        
        # Add commonly used training values to top level for backward compatibility
        # Use defensive checks with clear error messages
        batch_size = training_section.get('batch_size')
        if batch_size is None:
            raise ValueError(
                "Missing required key 'training.batch_size' for computing derived values."
            )
        self.config['batch_size'] = batch_size
        
        epochs = training_section.get('epochs')
        if epochs is None:
            raise ValueError(
                "Missing required key 'training.epochs' for computing derived values."
            )
        self.config['epochs'] = epochs
        
        learning_rate = training_section.get('learning_rate')
        if learning_rate is None:
            raise ValueError(
                "Missing required key 'training.learning_rate' for computing derived values."
            )
        self.config['learning_rate'] = learning_rate
        
        patience = training_section.get('patience')
        if patience is None:
            raise ValueError(
                "Missing required key 'training.patience' for computing derived values."
            )
        self.config['patience'] = patience
        
        tea_layers = model_section.get('tea_layers')
        if tea_layers is None:
            raise ValueError(
                "Missing required key 'model.tea_layers' for computing derived values."
            )
        self.config['tea_layers'] = tea_layers
        
        # Add dataset path for backward compatibility
        dataset_path = dataset_section.get('path')
        if dataset_path is None:
            raise ValueError(
                "Missing required key 'dataset.path' for computing derived values."
            )
        self.config['wesad_path'] = dataset_path
        
        if 'output' not in self.config:
            raise ValueError(
                "Missing 'output' section in configuration. "
                "Cannot compute derived values."
            )
        output_section = self.config['output']
        if not isinstance(output_section, dict):
            raise ValueError(
                "Invalid 'output' section in configuration. "
                "Must be a dictionary."
            )
        
        results_dir = output_section.get('results_dir')
        if results_dir is None:
            raise ValueError(
                "Missing required key 'output.results_dir' for computing derived values."
            )
        self.config['output_dir'] = results_dir
        
        min_windows = dataset_section.get('min_windows_per_subject')
        if min_windows is None:
            # This is optional, so use a default
            min_windows = 0
        self.config['min_windows_per_subject'] = min_windows
        
        logger.info(f"Derived values computed: samples_per_window={samples_per_window}")
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Return the entire configuration as a dictionary.
        
        Returns:
            Complete configuration dictionary
            
        Note:
            This method returns the config with all derived values and overrides applied.
            Useful for backward compatibility with code expecting a flat config dict.
        """
        return self.config
    
    def save_config(self, output_path: str) -> None:
        """
        Save the current configuration to a YAML file.
        
        Args:
            output_path: Path where the configuration should be saved
            
        This is useful for saving the effective config (with overrides and derived values)
        alongside training results for reproducibility.
        """
        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else '.', exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            yaml.dump(self.config, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
        
        logger.info(f"Configuration saved to {output_path}")

