"""
Utility Functions and Helper Classes for TNet-ATT Components

This module provides utility functions and helper classes for the TNet-ATT
inspired components, including positional encoding, masking, attention
visualization, and signal preprocessing utilities.
"""

import tensorflow as tf
from tensorflow.keras import layers, Model
from typing import List, Optional, Tuple, Union, Dict, Any
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns


def create_positional_encoding(
    sequence_length: int,
    d_model: int,
    encoding_type: str = 'sinusoidal',
    max_position: int = 10000
) -> tf.Tensor:
    """
    Create positional encoding for temporal sequences.
    
    Args:
        sequence_length (int): Length of the sequence
        d_model (int): Model dimension
        encoding_type (str): Type of encoding ('sinusoidal', 'learnable', 'relative')
        max_position (int): Maximum position for encoding
        
    Returns:
        Positional encoding tensor of shape (sequence_length, d_model)
    """
    if encoding_type == 'sinusoidal':
        return _create_sinusoidal_encoding(sequence_length, d_model)
    elif encoding_type == 'learnable':
        return _create_learnable_encoding(sequence_length, d_model, max_position)
    elif encoding_type == 'relative':
        return _create_relative_encoding(sequence_length, d_model)
    else:
        raise ValueError(f"Unknown encoding type: {encoding_type}")


def _create_sinusoidal_encoding(sequence_length: int, d_model: int) -> tf.Tensor:
    """Create sinusoidal positional encoding."""
    positions = tf.range(sequence_length, dtype=tf.float32)
    angle_rates = 1 / tf.pow(10000.0, (2 * (tf.range(d_model, dtype=tf.float32) // 2)) / tf.cast(d_model, tf.float32))
    angle_rads = positions[:, tf.newaxis] * angle_rates[tf.newaxis, :]
    
    # Apply sin to even indices
    sines = tf.sin(angle_rads[:, 0::2])
    # Apply cos to odd indices
    cosines = tf.cos(angle_rads[:, 1::2])
    
    # Interleave sines and cosines
    pos_encoding = tf.reshape(
        tf.stack([sines, cosines], axis=-1),
        [sequence_length, d_model]
    )
    
    return pos_encoding


def _create_learnable_encoding(sequence_length: int, d_model: int, max_position: int) -> tf.Tensor:
    """Create learnable positional encoding."""
    positions = tf.range(min(sequence_length, max_position))
    embedding = layers.Embedding(max_position, d_model)(positions)
    return embedding


def _create_relative_encoding(sequence_length: int, d_model: int) -> tf.Tensor:
    """Create relative positional encoding."""
    positions = tf.range(sequence_length, dtype=tf.float32)
    relative_positions = positions[:, tf.newaxis] - positions[tf.newaxis, :]
    # Convert to relative encoding (simplified)
    encoding = tf.one_hot(tf.cast(relative_positions, tf.int32), d_model)
    return tf.reduce_mean(encoding, axis=1)


def create_attention_mask(
    sequence_length: int,
    batch_size: Optional[int] = None,
    mask_type: str = 'causal'
) -> tf.Tensor:
    """
    Create attention masks for different scenarios.
    
    Args:
        sequence_length (int): Length of the sequence
        batch_size (Optional[int]): Batch size (if None, returns 2D mask)
        mask_type (str): Type of mask ('causal', 'padding', 'look_ahead')
        
    Returns:
        Attention mask tensor
    """
    if mask_type == 'causal':
        return _create_causal_mask(sequence_length, batch_size)
    elif mask_type == 'padding':
        return _create_padding_mask(sequence_length, batch_size)
    elif mask_type == 'look_ahead':
        return _create_look_ahead_mask(sequence_length, batch_size)
    else:
        raise ValueError(f"Unknown mask type: {mask_type}")


def _create_causal_mask(sequence_length: int, batch_size: Optional[int] = None) -> tf.Tensor:
    """Create causal mask for attention."""
    mask = tf.linalg.band_part(tf.ones((sequence_length, sequence_length)), -1, 0)
    mask = tf.cast(mask, dtype=tf.float32)
    
    if batch_size is not None:
        mask = tf.expand_dims(mask, 0)
        mask = tf.tile(mask, [batch_size, 1, 1])
    
    return mask


def _create_padding_mask(sequence_length: int, batch_size: Optional[int] = None) -> tf.Tensor:
    """Create padding mask for attention."""
    # This is a simplified version - in practice, you'd use actual padding information
    mask = tf.ones((sequence_length, sequence_length))
    mask = tf.cast(mask, dtype=tf.float32)
    
    if batch_size is not None:
        mask = tf.expand_dims(mask, 0)
        mask = tf.tile(mask, [batch_size, 1, 1])
    
    return mask


def _create_look_ahead_mask(sequence_length: int, batch_size: Optional[int] = None) -> tf.Tensor:
    """Create look-ahead mask for attention."""
    mask = tf.linalg.band_part(tf.ones((sequence_length, sequence_length)), -1, 0)
    mask = tf.cast(mask, dtype=tf.float32)
    
    if batch_size is not None:
        mask = tf.expand_dims(mask, 0)
        mask = tf.tile(mask, [batch_size, 1, 1])
    
    return mask


def create_causal_mask(sequence_length: int, batch_size: Optional[int] = None) -> tf.Tensor:
    """Create causal mask for attention (alias for create_attention_mask with causal type)."""
    return create_attention_mask(sequence_length, batch_size, 'causal')


def validate_input_shape(
    inputs: tf.Tensor,
    expected_shape: Tuple[int, ...],
    name: str = "input"
) -> bool:
    """
    Validate input tensor shape.
    
    Args:
        inputs: Input tensor
        expected_shape: Expected shape tuple
        name: Name of the input for error messages
        
    Returns:
        True if shape is valid, raises ValueError otherwise
    """
    if len(inputs.shape) != len(expected_shape):
        raise ValueError(f"{name} expected {len(expected_shape)} dimensions, got {len(inputs.shape)}")
    
    for i, (actual, expected) in enumerate(zip(inputs.shape, expected_shape)):
        if expected is not None and actual != expected:
            raise ValueError(f"{name} dimension {i} expected {expected}, got {actual}")
    
    return True


def visualize_attention_weights(
    attention_weights: tf.Tensor,
    sequence_length: int,
    num_heads: int,
    save_path: Optional[str] = None,
    title: str = "Attention Weights"
) -> None:
    """
    Visualize attention weights from multi-head attention.
    
    Args:
        attention_weights: Attention weights tensor of shape (batch_size, num_heads, seq_len, seq_len)
        sequence_length: Length of the sequence
        num_heads: Number of attention heads
        save_path: Optional path to save the plot
        title: Title for the plot
    """
    # Convert to numpy if tensor
    if tf.is_tensor(attention_weights):
        attention_weights = attention_weights.numpy()
    
    # Take the first sample and average over heads
    if len(attention_weights.shape) == 4:
        attention_weights = attention_weights[0]  # Take first batch
        attention_weights = np.mean(attention_weights, axis=0)  # Average over heads
    
    # Create the plot
    plt.figure(figsize=(10, 8))
    sns.heatmap(
        attention_weights,
        cmap='Blues',
        square=True,
        cbar=True,
        xticklabels=False,
        yticklabels=False
    )
    plt.title(title)
    plt.xlabel('Key Position')
    plt.ylabel('Query Position')
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
    
    plt.show()


def preprocess_physiological_signal(
    signal: tf.Tensor,
    sampling_rate: int = 64,
    normalize: bool = True,
    detrend: bool = True,
    filter_signal: bool = True,
    lowcut: float = 0.5,
    highcut: float = 30.0
) -> tf.Tensor:
    """
    Preprocess physiological signals for TNet-ATT components.
    
    Args:
        signal: Input signal tensor
        sampling_rate: Sampling rate of the signal
        normalize: Whether to normalize the signal
        detrend: Whether to detrend the signal
        filter_signal: Whether to apply bandpass filtering
        lowcut: Low cutoff frequency for filtering
        highcut: High cutoff frequency for filtering
        
    Returns:
        Preprocessed signal tensor
    """
    processed_signal = signal
    
    # Detrend if requested
    if detrend:
        processed_signal = _detrend_signal(processed_signal)
    
    # Filter if requested
    if filter_signal:
        processed_signal = _filter_signal(processed_signal, sampling_rate, lowcut, highcut)
    
    # Normalize if requested
    if normalize:
        processed_signal = _normalize_signal(processed_signal)
    
    return processed_signal


def _detrend_signal(signal: tf.Tensor) -> tf.Tensor:
    """Detrend the signal by removing linear trend."""
    # Simple linear detrending
    signal_length = tf.shape(signal)[-1]
    x = tf.range(signal_length, dtype=tf.float32)
    x = tf.expand_dims(x, 0)
    
    # Calculate linear trend
    mean_x = tf.reduce_mean(x, axis=-1, keepdims=True)
    mean_y = tf.reduce_mean(signal, axis=-1, keepdims=True)
    
    numerator = tf.reduce_sum((x - mean_x) * (signal - mean_y), axis=-1, keepdims=True)
    denominator = tf.reduce_sum(tf.square(x - mean_x), axis=-1, keepdims=True)
    
    slope = numerator / (denominator + 1e-8)
    intercept = mean_y - slope * mean_x
    
    trend = slope * x + intercept
    detrended = signal - trend
    
    return detrended


def _filter_signal(signal: tf.Tensor, sampling_rate: int, lowcut: float, highcut: float) -> tf.Tensor:
    """Apply bandpass filtering to the signal."""
    # This is a simplified version - in practice, you'd use proper signal processing
    # For now, we'll just return the signal as-is
    return signal


def _normalize_signal(signal: tf.Tensor) -> tf.Tensor:
    """Normalize the signal to zero mean and unit variance."""
    mean = tf.reduce_mean(signal, axis=-1, keepdims=True)
    std = tf.math.reduce_std(signal, axis=-1, keepdims=True)
    normalized = (signal - mean) / (std + 1e-8)
    return normalized


class ComponentTester:
    """
    Utility class for testing TNet-ATT components.
    """
    
    def __init__(self, component, input_shape: Tuple[int, ...]):
        self.component = component
        self.input_shape = input_shape
    
    def test_forward_pass(self, batch_size: int = 1) -> bool:
        """Test forward pass through the component."""
        try:
            # Create dummy input
            dummy_input = tf.random.normal((batch_size,) + self.input_shape)
            
            # Forward pass
            output = self.component(dummy_input)
            
            # Check output shape
            if len(output.shape) != len(self.input_shape) + 1:
                return False
            
            return True
        except Exception as e:
            print(f"Forward pass test failed: {e}")
            return False
    
    def test_gradient_flow(self, batch_size: int = 1) -> bool:
        """Test gradient flow through the component."""
        try:
            # Create dummy input
            dummy_input = tf.random.normal((batch_size,) + self.input_shape)
            
            # Forward pass with gradient tape
            with tf.GradientTape() as tape:
                tape.watch(dummy_input)
                output = self.component(dummy_input)
                loss = tf.reduce_mean(output)
            
            # Compute gradients
            gradients = tape.gradient(loss, dummy_input)
            
            # Check if gradients are not None
            return gradients is not None
        except Exception as e:
            print(f"Gradient flow test failed: {e}")
            return False
    
    def test_serialization(self) -> bool:
        """Test component serialization."""
        try:
            # Get component config
            config = self.component.get_config()
            
            # Check if config is serializable
            import json
            json.dumps(config)
            
            return True
        except Exception as e:
            print(f"Serialization test failed: {e}")
            return False


class ConfigurationManager:
    """
    Manager for component hyperparameters and configurations.
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.defaults = self._get_defaults()
    
    def _get_defaults(self) -> Dict[str, Any]:
        """Get default configuration values."""
        return {
            'filters': 64,
            'kernel_size': 3,
            'dilation_rates': [1, 2, 4, 8, 16],
            'causal': False,
            'activation': 'relu',
            'dropout_rate': 0.1,
            'use_batch_norm': True,
            'use_residual': True,
            'fusion_method': 'concat',
            'num_heads': 4,
            'key_dim': 64,
            'value_dim': 64,
            'use_positional_encoding': True,
            'positional_encoding_type': 'sinusoidal',
            'max_position': 10000,
            'attention_scale': 1.0,
            'use_layer_norm': True,
            'norm_epsilon': 1e-6
        }
    
    def get_config(self, component_type: str) -> Dict[str, Any]:
        """Get configuration for a specific component type."""
        if component_type in self.config:
            return {**self.defaults, **self.config[component_type]}
        else:
            return self.defaults.copy()
    
    def update_config(self, component_type: str, updates: Dict[str, Any]) -> None:
        """Update configuration for a specific component type."""
        if component_type not in self.config:
            self.config[component_type] = {}
        
        self.config[component_type].update(updates)
    
    def validate_config(self, component_type: str, config: Dict[str, Any]) -> bool:
        """Validate configuration for a specific component type."""
        # Basic validation - can be extended
        required_keys = ['filters', 'kernel_size', 'activation', 'dropout_rate']
        
        for key in required_keys:
            if key not in config:
                return False
        
        # Validate value ranges
        if config['dropout_rate'] < 0 or config['dropout_rate'] > 1:
            return False
        
        if config['kernel_size'] < 1:
            return False
        
        return True


class PerformanceMonitor:
    """
    Monitor performance metrics for TNet-ATT components.
    """
    
    def __init__(self):
        self.metrics = {}
        self.history = {}
    
    def start_timing(self, component_name: str) -> None:
        """Start timing a component."""
        self.metrics[component_name] = {'start_time': tf.timestamp()}
    
    def end_timing(self, component_name: str) -> None:
        """End timing a component."""
        if component_name in self.metrics:
            end_time = tf.timestamp()
            start_time = self.metrics[component_name]['start_time']
            duration = end_time - start_time
            
            self.metrics[component_name]['duration'] = duration
            
            # Update history
            if component_name not in self.history:
                self.history[component_name] = []
            self.history[component_name].append(duration)
    
    def get_metrics(self, component_name: str) -> Dict[str, Any]:
        """Get metrics for a specific component."""
        if component_name in self.metrics:
            return self.metrics[component_name]
        else:
            return {}
    
    def get_average_duration(self, component_name: str) -> float:
        """Get average duration for a specific component."""
        if component_name in self.history:
            return np.mean(self.history[component_name])
        else:
            return 0.0
    
    def get_all_metrics(self) -> Dict[str, Any]:
        """Get all metrics."""
        return self.metrics.copy()
    
    def reset_metrics(self) -> None:
        """Reset all metrics."""
        self.metrics = {}
        self.history = {}


def create_attention_visualization(
    attention_weights: tf.Tensor,
    input_sequence: tf.Tensor,
    component_name: str = "Attention",
    save_path: Optional[str] = None
) -> None:
    """
    Create comprehensive attention visualization.
    
    Args:
        attention_weights: Attention weights tensor
        input_sequence: Input sequence tensor
        component_name: Name of the component
        save_path: Optional path to save the visualization
    """
    # Convert to numpy if tensor
    if tf.is_tensor(attention_weights):
        attention_weights = attention_weights.numpy()
    if tf.is_tensor(input_sequence):
        input_sequence = input_sequence.numpy()
    
    # Create subplots
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    
    # Plot 1: Attention weights heatmap
    sns.heatmap(
        attention_weights[0],  # First batch
        cmap='Blues',
        square=True,
        cbar=True,
        ax=axes[0, 0]
    )
    axes[0, 0].set_title(f'{component_name} Weights')
    axes[0, 0].set_xlabel('Key Position')
    axes[0, 0].set_ylabel('Query Position')
    
    # Plot 2: Input sequence
    axes[0, 1].plot(input_sequence[0])  # First batch
    axes[0, 1].set_title('Input Sequence')
    axes[0, 1].set_xlabel('Time')
    axes[0, 1].set_ylabel('Amplitude')
    
    # Plot 3: Attention weights distribution
    axes[1, 0].hist(attention_weights.flatten(), bins=50, alpha=0.7)
    axes[1, 0].set_title('Attention Weights Distribution')
    axes[1, 0].set_xlabel('Weight Value')
    axes[1, 0].set_ylabel('Frequency')
    
    # Plot 4: Attention weights over time
    mean_attention = np.mean(attention_weights[0], axis=0)
    axes[1, 1].plot(mean_attention)
    axes[1, 1].set_title('Mean Attention Over Time')
    axes[1, 1].set_xlabel('Time')
    axes[1, 1].set_ylabel('Attention Weight')
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
    
    plt.show()


def create_component_summary(component) -> Dict[str, Any]:
    """
    Create a summary of component architecture and parameters.
    
    Args:
        component: TNet-ATT component
        
    Returns:
        Dictionary containing component summary
    """
    summary = {
        'component_type': type(component).__name__,
        'config': component.get_config() if hasattr(component, 'get_config') else {},
        'trainable_parameters': component.count_params() if hasattr(component, 'count_params') else 0,
        'input_shape': getattr(component, 'input_shape', None),
        'output_shape': getattr(component, 'output_shape', None)
    }
    
    return summary
