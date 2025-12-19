"""
Fusion Layers for Combining TNet-ATT Component Outputs

This module implements various fusion strategies for combining outputs from
different TNet-ATT components, enabling effective integration with the existing
TEANet architecture.
"""

import tensorflow as tf
from tensorflow.keras import layers, Model, backend as K
from typing import List, Optional, Tuple, Union, Dict
import numpy as np


class FeatureFusion(layers.Layer):
    """
    Base class for feature fusion strategies.
    
    This base class provides common functionality for fusing features from multiple
    sources. All subclasses handle variable input feature dimensions automatically
    by projecting inputs to a common output dimension.
    
    Args:
        output_dim (int): Output dimension for fused features
        fusion_method (str): Method for fusion ('concat', 'add', 'mul', 'attention')
        dropout_rate (float): Dropout rate (default: 0.1)
        activation (str): Activation function (default: 'relu')
        use_batch_norm (bool): Whether to use batch normalization (default: True)
    """
    
    def __init__(
        self,
        output_dim: int,
        fusion_method: str = 'concat',
        dropout_rate: float = 0.1,
        activation: str = 'relu',
        use_batch_norm: bool = True,
        **kwargs
    ):
        """
        Initialize FeatureFusion base layer.
        
        Args:
            output_dim: Output dimension for fused features. Inputs with variable
                       feature dimensions will be projected to this dimension.
            fusion_method: Method identifier for fusion strategy (default: 'concat')
            dropout_rate: Dropout rate for regularization (default: 0.1)
            activation: Activation function name (default: 'relu')
            use_batch_norm: Whether to apply batch normalization (default: True)
            **kwargs: Additional arguments passed to Layer base class
        """
        super(FeatureFusion, self).__init__(**kwargs)
        
        self.output_dim = output_dim
        self.fusion_method = fusion_method
        self.dropout_rate = dropout_rate
        self.activation = activation
        self.use_batch_norm = use_batch_norm
        
        # Output projection
        self.output_projection = layers.Dense(
            units=output_dim,
            activation=activation,
            name='output_projection'
        )
        
        # Regularization
        self.dropout = layers.Dropout(dropout_rate)
        
        # Batch normalization
        if use_batch_norm:
            self.batch_norm = layers.BatchNormalization()
        else:
            self.batch_norm = None
    
    def call(
        self, 
        inputs: List[tf.Tensor], 
        training: Optional[bool] = None
    ) -> tf.Tensor:
        """
        Forward pass through the fusion layer.
        
        Args:
            inputs: List of input tensors to fuse. Each tensor can have different
                   feature dimensions - subclasses should handle this by projecting
                   to output_dim. Expected shape: (batch_size, sequence_length, features)
            training: Whether in training mode (optional)
            
        Returns:
            Fused features tensor of shape (batch_size, sequence_length, output_dim)
            
        Raises:
            NotImplementedError: Must be implemented by subclasses
        """
        raise NotImplementedError("Subclasses must implement the call method")
    
    def get_config(self):
        """Get layer configuration for serialization."""
        config = super(FeatureFusion, self).get_config()
        config.update({
            'output_dim': self.output_dim,
            'fusion_method': self.fusion_method,
            'dropout_rate': self.dropout_rate,
            'activation': self.activation,
            'use_batch_norm': self.use_batch_norm
        })
        return config


class ConcatenationFusion(FeatureFusion):
    """
    Simple concatenation fusion for combining component outputs.
    
    Args:
        output_dim (int): Output dimension for fused features
        dropout_rate (float): Dropout rate
        activation (str): Activation function
        use_batch_norm (bool): Whether to use batch normalization
    """
    
    def __init__(
        self,
        output_dim: int,
        dropout_rate: float = 0.1,
        activation: str = 'relu',
        use_batch_norm: bool = True,
        **kwargs
    ):
        super(ConcatenationFusion, self).__init__(
            output_dim=output_dim,
            fusion_method='concat',
            dropout_rate=dropout_rate,
            activation=activation,
            use_batch_norm=use_batch_norm,
            **kwargs
        )
    
    def call(self, inputs, training=None):
        """Concatenate input features and apply projection."""
        # Concatenate all inputs
        fused = tf.concat(inputs, axis=-1)
        
        # Apply output projection
        output = self.output_projection(fused)
        
        # Apply batch normalization
        if self.batch_norm:
            output = self.batch_norm(output, training=training)
        
        # Apply dropout
        output = self.dropout(output, training=training)
        
        return output


class AttentionFusion(FeatureFusion):
    """
    Attention-based fusion for combining component outputs.
    
    Args:
        output_dim (int): Output dimension for fused features
        num_heads (int): Number of attention heads (default: 4)
        key_dim (int): Dimension of key vectors (default: output_dim // num_heads)
        dropout_rate (float): Dropout rate
        activation (str): Activation function
        use_batch_norm (bool): Whether to use batch normalization
    """
    
    def __init__(
        self,
        output_dim: int,
        num_heads: int = 4,
        key_dim: Optional[int] = None,
        dropout_rate: float = 0.1,
        activation: str = 'relu',
        use_batch_norm: bool = True,
        **kwargs
    ):
        super(AttentionFusion, self).__init__(
            output_dim=output_dim,
            fusion_method='attention',
            dropout_rate=dropout_rate,
            activation=activation,
            use_batch_norm=use_batch_norm,
            **kwargs
        )
        
        self.num_heads = num_heads
        self.key_dim = key_dim or (output_dim // num_heads)
        
        # Multi-head attention
        self.attention = layers.MultiHeadAttention(
            num_heads=num_heads,
            key_dim=self.key_dim,
            dropout=dropout_rate
        )
        
        # Attention normalization
        self.attention_norm = layers.LayerNormalization()
        
        # Feature projection for attention
        self.feature_projection = layers.Dense(
            units=output_dim,
            activation=activation,
            name='feature_projection'
        )
    
    def call(self, inputs, training=None):
        """Apply attention-based fusion."""
        if len(inputs) < 2:
            # If only one input, just apply projection
            return self.output_projection(inputs[0])
        
        # Use first input as query, others as key and value
        query = inputs[0]
        key_value = tf.concat(inputs[1:], axis=-1)
        
        # Apply attention
        attended = self.attention(
            query=query,
            value=key_value,
            key=key_value,
            training=training
        )
        
        # Apply residual connection and normalization
        output = self.attention_norm(query + attended)
        
        # Apply feature projection
        output = self.feature_projection(output)
        
        # Apply batch normalization
        if self.batch_norm:
            output = self.batch_norm(output, training=training)
        
        # Apply dropout
        output = self.dropout(output, training=training)
        
        return output


class GatedFusion(FeatureFusion):
    """
    Gated fusion mechanism for controlling information flow between components.
    
    Args:
        output_dim (int): Output dimension for fused features
        gate_activation (str): Activation function for gates (default: 'sigmoid')
        dropout_rate (float): Dropout rate
        activation (str): Activation function
        use_batch_norm (bool): Whether to use batch normalization
    """
    
    def __init__(
        self,
        output_dim: int,
        gate_activation: str = 'sigmoid',
        dropout_rate: float = 0.1,
        activation: str = 'relu',
        use_batch_norm: bool = True,
        **kwargs
    ):
        super(GatedFusion, self).__init__(
            output_dim=output_dim,
            fusion_method='gated',
            dropout_rate=dropout_rate,
            activation=activation,
            use_batch_norm=use_batch_norm,
            **kwargs
        )
        
        self.gate_activation = gate_activation
        
        # Gate networks for each input
        self.gate_networks = []
        for i in range(len(self.input_names) if hasattr(self, 'input_names') else 2):
            gate_network = layers.Dense(
                units=output_dim,
                activation=gate_activation,
                name=f'gate_network_{i}'
            )
            self.gate_networks.append(gate_network)
        
        # Feature networks for each input
        self.feature_networks = []
        for i in range(len(self.input_names) if hasattr(self, 'input_names') else 2):
            feature_network = layers.Dense(
                units=output_dim,
                activation=activation,
                name=f'feature_network_{i}'
            )
            self.feature_networks.append(feature_network)
    
    def call(self, inputs, training=None):
        """Apply gated fusion."""
        if len(inputs) == 1:
            return self.output_projection(inputs[0])
        
        # Apply gates and feature transformations
        gated_features = []
        for i, input_tensor in enumerate(inputs):
            if i < len(self.gate_networks):
                gate = self.gate_networks[i](input_tensor)
                features = self.feature_networks[i](input_tensor)
                gated = gate * features
                gated_features.append(gated)
        
        # Combine gated features
        if len(gated_features) > 1:
            fused = tf.add_n(gated_features) / len(gated_features)
        else:
            fused = gated_features[0]
        
        # Apply output projection
        output = self.output_projection(fused)
        
        # Apply batch normalization
        if self.batch_norm:
            output = self.batch_norm(output, training=training)
        
        # Apply dropout
        output = self.dropout(output, training=training)
        
        return output


class ResidualFusion(FeatureFusion):
    """
    Residual fusion for combining new component features with original TEANet features.
    
    This layer handles variable input feature dimensions automatically by using
    Dense layers to project inputs to a common output dimension. Suitable for
    dynamic model configurations with varying feature sizes.
    
    Args:
        output_dim (int): Output dimension for fused features
        residual_weight (float): Weight for residual connection (default: 0.5)
        dropout_rate (float): Dropout rate
        activation (str): Activation function
        use_batch_norm (bool): Whether to use batch normalization
    """
    
    def __init__(
        self,
        output_dim: int,
        residual_weight: float = 0.5,
        dropout_rate: float = 0.1,
        activation: str = 'relu',
        use_batch_norm: bool = True,
        **kwargs
    ):
        """
        Initialize ResidualFusion layer.
        
        Args:
            output_dim: Output dimension for fused features. Inputs with variable
                       feature dimensions will be projected to this dimension.
            residual_weight: Weight for residual connection (0.0-1.0, default: 0.5)
            dropout_rate: Dropout rate for regularization (default: 0.1)
            activation: Activation function name (default: 'relu')
            use_batch_norm: Whether to apply batch normalization (default: True)
            **kwargs: Additional arguments passed to FeatureFusion base class
        """
        super(ResidualFusion, self).__init__(
            output_dim=output_dim,
            fusion_method='residual',
            dropout_rate=dropout_rate,
            activation=activation,
            use_batch_norm=use_batch_norm,
            **kwargs
        )
        
        self.residual_weight = residual_weight
        
        # Residual connection
        self.residual_connection = layers.Dense(
            units=output_dim,
            activation=activation,
            name='residual_connection'
        )
        
        # Feature combination
        self.feature_combination = layers.Dense(
            units=output_dim,
            activation=activation,
            name='feature_combination'
        )
    
    def call(
        self, 
        inputs: List[tf.Tensor], 
        training: Optional[bool] = None
    ) -> tf.Tensor:
        """
        Apply residual fusion with variable input feature dimensions.
        
        Args:
            inputs: List of input tensors to fuse. Each tensor can have different
                   feature dimensions - they will be projected to output_dim.
                   Expected shape: (batch_size, sequence_length, features)
                   Features dimension can vary between inputs.
            training: Whether in training mode (optional)
            
        Returns:
            Fused output tensor of shape (batch_size, sequence_length, output_dim).
            All inputs are projected to output_dim regardless of their input feature sizes.
        """
        if len(inputs) < 2:
            return self.output_projection(inputs[0])
        
        # Assume first input is original TEANet features, others are new components
        # Handle variable feature dimensions by concatenating and projecting
        original_features = inputs[0]
        new_features = tf.concat(inputs[1:], axis=-1)
        
        # Apply residual connection (handles variable input dims via Dense layer)
        residual = self.residual_connection(original_features)
        
        # Combine features (handles variable input dims via Dense layer)
        combined = self.feature_combination(new_features)
        
        # Apply residual fusion
        fused = self.residual_weight * residual + (1 - self.residual_weight) * combined
        
        # Apply output projection
        output = self.output_projection(fused)
        
        # Apply batch normalization
        if self.batch_norm:
            output = self.batch_norm(output, training=training)
        
        # Apply dropout
        output = self.dropout(output, training=training)
        
        return output


class AdaptiveFusion(FeatureFusion):
    """
    Adaptive fusion with learnable weights that adapt based on input characteristics.
    
    Args:
        output_dim (int): Output dimension for fused features
        adaptation_dim (int): Dimension of adaptation space (default: 64)
        num_adaptation_layers (int): Number of adaptation layers (default: 2)
        dropout_rate (float): Dropout rate
        activation (str): Activation function
        use_batch_norm (bool): Whether to use batch normalization
    """
    
    def __init__(
        self,
        output_dim: int,
        adaptation_dim: int = 64,
        num_adaptation_layers: int = 2,
        dropout_rate: float = 0.1,
        activation: str = 'relu',
        use_batch_norm: bool = True,
        **kwargs
    ):
        super(AdaptiveFusion, self).__init__(
            output_dim=output_dim,
            fusion_method='adaptive',
            dropout_rate=dropout_rate,
            activation=activation,
            use_batch_norm=use_batch_norm,
            **kwargs
        )
        
        self.adaptation_dim = adaptation_dim
        self.num_adaptation_layers = num_adaptation_layers
        
        # Adaptation network
        self.adaptation_layers = []
        for i in range(num_adaptation_layers):
            layer = layers.Dense(
                units=adaptation_dim,
                activation=activation,
                name=f'adaptation_layer_{i}'
            )
            self.adaptation_layers.append(layer)
        
        # Adaptive weights - created dynamically in call() based on num_inputs
        # Cache weight layers by num_inputs for efficiency
        self._weight_layers = {}
        
        # Feature processing
        self.feature_processing = layers.Dense(
            units=output_dim,
            activation=activation,
            name='feature_processing'
        )
    
    def call(self, inputs, training=None):
        """
        Apply adaptive fusion with robust shape handling.
        
        Args:
            inputs: List of input tensors to fuse
            training: Whether in training mode
            
        Returns:
            Fused output tensor
        
        Raises:
            ValueError: If input shapes are incompatible or validation fails
        """
        # Handle single input case
        if len(inputs) == 1:
            return self.output_projection(inputs[0])

        # Ensure input list is not empty
        if not inputs:
            raise ValueError("Empty input list provided to AdaptiveFusion")

        # Validate that each input is 3D (batch, sequence, features)
        for i, x in enumerate(inputs):
            tf.debugging.assert_equal(
                tf.rank(x), 3,
                message=f"Input {i} must be a 3D tensor (batch, sequence, features), got rank {tf.rank(x)}"
            )

        # Get input shapes for batch and sequence validation
        input_shapes = [tf.shape(x) for x in inputs]
        batch_size = input_shapes[0][0]
        seq_length = input_shapes[0][1]

        # Validate batch and sequence dimensions
        for i, shape in enumerate(input_shapes[1:], 1):
            tf.debugging.assert_equal(
                shape[0], batch_size,
                message=f"Batch size mismatch at input {i}. Expected {batch_size}, got {shape[0]}"
            )
            tf.debugging.assert_equal(
                shape[1], seq_length,
                message=f"Sequence length mismatch at input {i}. Expected {seq_length}, got {shape[1]}"
            )

        # Concatenate features for adaptation network
        concatenated = tf.concat(inputs, axis=-1)
        
        # Pass through adaptation layers
        adapted = concatenated
        for layer in self.adaptation_layers:
            adapted = layer(adapted)
            adapted = self.dropout(adapted, training=training)

        # Determine number of inputs
        num_inputs = len(inputs)
        
        # Validate num_inputs
        if num_inputs < 1:
            raise ValueError(f"num_inputs must be >= 1, got {num_inputs}")
        
        # Get or create weight layer for this number of inputs
        if num_inputs not in self._weight_layers:
            self._weight_layers[num_inputs] = layers.Dense(
                units=num_inputs,
                activation=None,
                name=f'adaptive_weights_{num_inputs}'
            )
        
        weight_layer = self._weight_layers[num_inputs]
        
        # Compute attention logits with shape (batch, seq, num_inputs)
        attention_logits = weight_layer(adapted)
        
        # Normalize weights across inputs using softmax
        # Shape: (batch, seq, num_inputs)
        attention_weights = tf.nn.softmax(attention_logits, axis=-1)
        
        # Add shape assertion
        tf.debugging.assert_equal(
            tf.shape(attention_weights)[-1],
            num_inputs,
            message=f"Attention weights shape mismatch. Expected last dim {num_inputs}, got {tf.shape(attention_weights)[-1]}"
        )
        
        # Apply attention weights to each input
        weighted_inputs = []
        for i, input_tensor in enumerate(inputs):
            # Extract weights for current input using slicing
            # Shape: (batch, seq, 1) - keep dimension for broadcasting
            current_weights = attention_weights[..., i:i+1]
            
            # Apply weights using broadcasting
            weighted = input_tensor * current_weights
            weighted_inputs.append(weighted)
            
            # Verify output shape matches input shape
            tf.debugging.assert_equal(
                tf.shape(weighted),
                tf.shape(input_tensor),
                message=f"Weighted input {i} shape mismatch"
            )
        
        # Sum weighted inputs
        combined = tf.add_n(weighted_inputs)
        
        # Apply feature processing
        processed = self.feature_processing(combined)
        
        # Final output transformation
        output = self.output_projection(processed)
        if self.batch_norm:
            output = self.batch_norm(output, training=training)
        output = self.dropout(output, training=training)
        
        return output


class MultiModalFusion(FeatureFusion):
    """
    Specialized fusion for combining different physiological signal modalities.
    
    Args:
        output_dim (int): Output dimension for fused features
        modality_dims (Dict[str, int]): Dictionary mapping modality names to dimensions
        use_modality_attention (bool): Whether to use modality-specific attention
        attention_heads (int): Number of attention heads
        dropout_rate (float): Dropout rate
        activation (str): Activation function
        use_batch_norm (bool): Whether to use batch normalization
    """
    
    def __init__(
        self,
        output_dim: int,
        modality_dims: Dict[str, int],
        use_modality_attention: bool = True,
        attention_heads: int = 4,
        dropout_rate: float = 0.1,
        activation: str = 'relu',
        use_batch_norm: bool = True,
        **kwargs
    ):
        super(MultiModalFusion, self).__init__(
            output_dim=output_dim,
            fusion_method='multimodal',
            dropout_rate=dropout_rate,
            activation=activation,
            use_batch_norm=use_batch_norm,
            **kwargs
        )
        
        self.modality_dims = modality_dims
        self.use_modality_attention = use_modality_attention
        self.attention_heads = attention_heads
        
        # Modality-specific processing
        self.modality_processors = {}
        for modality, dim in modality_dims.items():
            processor = layers.Dense(
                units=output_dim,
                activation=activation,
                name=f'modality_processor_{modality}'
            )
            self.modality_processors[modality] = processor
        
        # Modality attention
        if use_modality_attention:
            self.modality_attention = layers.MultiHeadAttention(
                num_heads=attention_heads,
                key_dim=output_dim // attention_heads
            )
            self.attention_norm = layers.LayerNormalization()
            self.attention_dropout = layers.Dropout(dropout_rate)
        
        # Modality fusion
        self.modality_fusion = layers.Dense(
            units=output_dim,
            activation=activation,
            name='modality_fusion'
        )
    
    def call(self, inputs, training=None):
        """Apply multi-modal fusion."""
        if isinstance(inputs, dict):
            # Handle dictionary of modality inputs
            modality_features = {}
            for modality, features in inputs.items():
                if modality in self.modality_processors:
                    processed = self.modality_processors[modality](features)
                    modality_features[modality] = processed
        else:
            # Handle list of inputs
            modality_features = {}
            modality_names = list(self.modality_dims.keys())
            for i, features in enumerate(inputs):
                if i < len(modality_names):
                    modality = modality_names[i]
                    processed = self.modality_processors[modality](features)
                    modality_features[modality] = processed
        
        # Apply modality attention if enabled
        if self.use_modality_attention and len(modality_features) > 1:
            modality_list = list(modality_features.values())
            modality_names = list(modality_features.keys())
            
            # Apply attention between modalities
            attended_modalities = []
            for i, modality_features in enumerate(modality_list):
                # Use other modalities as key and value
                other_modalities = [modality_list[j] for j in range(len(modality_list)) if j != i]
                if other_modalities:
                    other_features = tf.concat(other_modalities, axis=-1)
                    attended = self.modality_attention(
                        query=modality_features,
                        value=other_features,
                        key=other_features,
                        training=training
                    )
                    attended = self.attention_norm(modality_features + attended)
                    attended = self.attention_dropout(attended, training=training)
                    attended_modalities.append(attended)
                else:
                    attended_modalities.append(modality_features)
            
            # Update modality features
            for i, modality_name in enumerate(modality_names):
                modality_features[modality_name] = attended_modalities[i]
        
        # Fuse all modalities
        fused_features = tf.concat(list(modality_features.values()), axis=-1)
        fused_features = self.modality_fusion(fused_features)
        
        # Apply output projection
        output = self.output_projection(fused_features)
        
        # Apply batch normalization
        if self.batch_norm:
            output = self.batch_norm(output, training=training)
        
        # Apply dropout
        output = self.dropout(output, training=training)
        
        return output


class TemporalFusion(FeatureFusion):
    """
    Fusion strategies that consider temporal alignment of features.
    
    Args:
        output_dim (int): Output dimension for fused features
        temporal_alignment (str): Method for temporal alignment ('concat', 'interpolate', 'attention')
        dropout_rate (float): Dropout rate
        activation (str): Activation function
        use_batch_norm (bool): Whether to use batch normalization
    """
    
    def __init__(
        self,
        output_dim: int,
        temporal_alignment: str = 'concat',
        dropout_rate: float = 0.1,
        activation: str = 'relu',
        use_batch_norm: bool = True,
        **kwargs
    ):
        super(TemporalFusion, self).__init__(
            output_dim=output_dim,
            fusion_method='temporal',
            dropout_rate=dropout_rate,
            activation=activation,
            use_batch_norm=use_batch_norm,
            **kwargs
        )
        
        self.temporal_alignment = temporal_alignment
        
        # Temporal alignment layers
        if temporal_alignment == 'interpolate':
            self.interpolation_layer = layers.Dense(
                units=output_dim,
                activation=activation,
                name='interpolation_layer'
            )
        elif temporal_alignment == 'attention':
            self.temporal_attention = layers.MultiHeadAttention(
                num_heads=4,
                key_dim=output_dim // 4
            )
            self.attention_norm = layers.LayerNormalization()
            self.attention_dropout = layers.Dropout(dropout_rate)
    
    def call(self, inputs, training=None):
        """Apply temporal fusion."""
        if len(inputs) == 1:
            return self.output_projection(inputs[0])
        
        # Align temporal dimensions
        if self.temporal_alignment == 'concat':
            # Simple concatenation
            aligned = tf.concat(inputs, axis=-1)
        elif self.temporal_alignment == 'interpolate':
            # Interpolate to common temporal dimension
            target_length = tf.shape(inputs[0])[1]
            aligned_inputs = []
            for input_tensor in inputs:
                if tf.shape(input_tensor)[1] != target_length:
                    # Interpolate to target length
                    interpolated = tf.image.resize(
                        tf.expand_dims(input_tensor, axis=-1),
                        [target_length, 1]
                    )
                    interpolated = tf.squeeze(interpolated, axis=-1)
                    aligned_inputs.append(interpolated)
                else:
                    aligned_inputs.append(input_tensor)
            aligned = tf.concat(aligned_inputs, axis=-1)
        elif self.temporal_alignment == 'attention':
            # Use attention for temporal alignment
            query = inputs[0]
            key_value = tf.concat(inputs[1:], axis=-1)
            
            attended = self.temporal_attention(
                query=query,
                value=key_value,
                key=key_value,
                training=training
            )
            aligned = self.attention_norm(query + attended)
            aligned = self.attention_dropout(aligned, training=training)
        
        # Apply output projection
        output = self.output_projection(aligned)
        
        # Apply batch normalization
        if self.batch_norm:
            output = self.batch_norm(output, training=training)
        
        # Apply dropout
        output = self.dropout(output, training=training)
        
        return output
