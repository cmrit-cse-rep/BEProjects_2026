"""
Bidirectional GRU (BiGRU) for Physiological Signal Processing

This module implements bidirectional GRU layers optimized for physiological
signals, providing long-term dependency modeling with attention mechanisms.
"""

import tensorflow as tf
from tensorflow.keras import layers, Model
from typing import List, Optional, Tuple, Union
import numpy as np


class BiGRULayer(layers.Layer):
    """
    Bidirectional GRU layer for physiological signal processing.
    
    This layer handles variable input feature dimensions automatically,
    making it suitable for dynamic model configurations. The output feature
    dimension is determined by the units parameter and merge_mode.
    
    Attributes:
        units: Number of GRU units (output feature dimension depends on merge_mode)
        num_layers: Number of stacked BiGRU layers
        return_sequences: Whether to return full sequences or just last output
        return_state: Whether to return hidden states
        merge_mode: How to merge forward/backward outputs ('concat', 'sum', 'mul', 'ave')
    """
    
    def __init__(
        self,
        units: int,
        num_layers: int = 1,
        return_sequences: bool = True,
        return_state: bool = False,
        dropout: float = 0.0,
        recurrent_dropout: float = 0.0,
        use_attention: bool = False,
        attention_heads: int = 4,
        activation: str = 'tanh',
        recurrent_activation: str = 'sigmoid',
        use_batch_norm: bool = True,
        merge_mode: str = 'concat',
        **kwargs
    ):
        """
        Initialize BiGRU layer.
        
        Args:
            units: Number of GRU units. Output feature dimension will be:
                  - units * 2 if merge_mode='concat'
                  - units otherwise
            num_layers: Number of stacked BiGRU layers (default: 1)
            return_sequences: Whether to return full sequences (default: True)
            return_state: Whether to return hidden states (default: False)
            dropout: Dropout rate for inputs (default: 0.0)
            recurrent_dropout: Dropout rate for recurrent connections (default: 0.0)
            use_attention: Whether to use multi-head attention (default: False)
            attention_heads: Number of attention heads if use_attention=True (default: 4)
            activation: Activation function for GRU (default: 'tanh')
            recurrent_activation: Activation for recurrent gates (default: 'sigmoid')
            use_batch_norm: Whether to apply batch normalization (default: True)
            merge_mode: How to merge forward/backward outputs:
                       'concat', 'sum', 'mul', or 'ave' (default: 'concat')
            **kwargs: Additional arguments passed to Layer base class
        """
        super(BiGRULayer, self).__init__(**kwargs)
        
        self.units = units
        self.num_layers = num_layers
        self.return_sequences = return_sequences
        self.return_state = return_state
        self.dropout = dropout
        self.recurrent_dropout = recurrent_dropout
        self.use_attention = use_attention
        self.attention_heads = attention_heads
        self.activation = activation
        self.recurrent_activation = recurrent_activation
        self.use_batch_norm = use_batch_norm
        self.merge_mode = merge_mode
        
        # Create BiGRU layers
        self.bi_gru_layers = []
        for i in range(num_layers):
            is_last_layer = (i == num_layers - 1)
            bi_gru = layers.Bidirectional(
                layers.GRU(
                    units=units,
                    return_sequences=return_sequences or (i < num_layers - 1),
                    return_state=return_state and is_last_layer,
                    dropout=dropout,
                    recurrent_dropout=recurrent_dropout,
                    activation=activation,
                    recurrent_activation=recurrent_activation
                ),
                merge_mode=merge_mode,
                name=f'bi_gru_{i}'
            )
            self.bi_gru_layers.append(bi_gru)
        
        # Attention mechanism
        if use_attention:
            self.attention = layers.MultiHeadAttention(
                num_heads=attention_heads,
                key_dim=units // attention_heads,
                name='multi_head_attention'
            )
            self.attention_norm = layers.LayerNormalization(name='attention_norm')
            self.attention_dropout = layers.Dropout(dropout)
        
        # Batch normalization
        if use_batch_norm:
            self.batch_norm = layers.BatchNormalization(name='batch_norm')
        else:
            self.batch_norm = None
        
        # Final dropout
        if dropout > 0:
            self.final_dropout = layers.Dropout(dropout, name='final_dropout')
        else:
            self.final_dropout = None
    
    def build(self, input_shape: Tuple[Optional[int], ...]) -> None:
        """
        Build the layer with dynamic input shape support.
        
        Args:
            input_shape: Input shape tuple. Can handle variable feature dimensions.
                       Expected format: (batch_size, sequence_length, features)
        """
        super().build(input_shape)
        for layer in self.bi_gru_layers:
            layer.build(input_shape)
        if self.use_attention:
            gru_output_shape = list(input_shape)
            gru_output_shape[-1] = self.units * (2 if self.merge_mode == 'concat' else 1)
            self.attention.build([gru_output_shape] * 3)  # query, key, value have same shape
            self.attention_norm.build(gru_output_shape)
        if self.batch_norm:
            gru_output_shape = list(input_shape)
            gru_output_shape[-1] = self.units * (2 if self.merge_mode == 'concat' else 1)
            self.batch_norm.build(gru_output_shape)
    
    def compute_output_shape(
        self, 
        input_shape: Tuple[Optional[int], ...]
    ) -> Tuple[Optional[int], ...]:
        """
        Compute output shape with variable input feature dimensions.
        
        Args:
            input_shape: Input shape tuple (batch_size, sequence_length, features)
            
        Returns:
            Output shape tuple. Feature dimension depends on merge_mode:
            - (batch_size, sequence_length, units*2) if merge_mode='concat' and return_sequences=True
            - (batch_size, units*2) if merge_mode='concat' and return_sequences=False
            - Similar but with units instead of units*2 for other merge modes
        """
        output_shape = list(input_shape)
        output_shape[-1] = self.units * (2 if self.merge_mode == 'concat' else 1)
        if not self.return_sequences:
            # Remove sequence dimension
            output_shape = [output_shape[0], output_shape[-1]]
        return tuple(output_shape)
    
    def call(
        self, 
        inputs: tf.Tensor, 
        training: Optional[bool] = None, 
        mask: Optional[tf.Tensor] = None
    ) -> Union[tf.Tensor, Tuple[tf.Tensor, Tuple[tf.Tensor, tf.Tensor]]]:
        """
        Forward pass through the BiGRU layer.
        Handles variable input feature dimensions automatically.
        
        Args:
            inputs: Input tensor of shape (batch_size, sequence_length, features).
                   Feature dimension can vary - layer adapts automatically.
            training: Whether in training mode (optional)
            mask: Optional mask tensor for variable-length sequences
            
        Returns:
            Output tensor of shape:
            - (batch_size, sequence_length, output_features) if return_sequences=True
            - (batch_size, output_features) if return_sequences=False
            - Tuple of (output, (forward_state, backward_state)) if return_state=True
            
            Where output_features = units * 2 if merge_mode='concat', else units
        """
        x = inputs
        states = None
        
        # Apply BiGRU layers
        for i, bi_gru in enumerate(self.bi_gru_layers):
            if i == len(self.bi_gru_layers) - 1 and self.return_state:
                # Last layer with return_state: Bidirectional returns (output, (forward_state, backward_state))
                x, (forward_state, backward_state) = bi_gru(x, training=training, mask=mask)
                states = (forward_state, backward_state)
            else:
                x = bi_gru(x, training=training, mask=mask)
        
        # Apply attention if enabled
        if self.use_attention:
            # Self-attention over the sequence
            attended = self.attention(
                query=x,
                value=x,
                key=x,
                training=training,
                mask=mask
            )
            # Residual connection and normalization
            x = self.attention_norm(x + attended)
            x = self.attention_dropout(x, training=training)
        
        # Apply batch normalization
        if self.use_batch_norm:
            x = self.batch_norm(x, training=training)
        
        # Apply final dropout
        if self.final_dropout:
            x = self.final_dropout(x, training=training)
        
        # Return output and states if requested
        if self.return_state:
            return x, states
        else:
            return x
    
    def get_config(self):
        """Get layer configuration for serialization."""
        config = super(BiGRULayer, self).get_config()
        config.update({
            'units': self.units,
            'num_layers': self.num_layers,
            'return_sequences': self.return_sequences,
            'return_state': self.return_state,
            'dropout': self.dropout,
            'recurrent_dropout': self.recurrent_dropout,
            'use_attention': self.use_attention,
            'attention_heads': self.attention_heads,
            'activation': self.activation,
            'recurrent_activation': self.recurrent_activation,
            'use_batch_norm': self.use_batch_norm,
            'merge_mode': self.merge_mode
        })
        return config


class HierarchicalBiGRU(layers.Layer):
    """
    Hierarchical BiGRU with different hidden sizes for multi-scale processing.
    
    Args:
        units_list (List[int]): List of units for each BiGRU layer
        return_sequences (bool): Whether to return full sequences
        dropout (float): Dropout rate
        recurrent_dropout (float): Recurrent dropout rate
        use_attention (bool): Whether to use attention between layers
        attention_heads (int): Number of attention heads
        activation (str): Activation function
        use_batch_norm (bool): Whether to use batch normalization
        merge_mode (str): How to merge forward/backward outputs
    """
    
    def __init__(
        self,
        units_list: List[int],
        return_sequences: bool = True,
        dropout: float = 0.0,
        recurrent_dropout: float = 0.0,
        use_attention: bool = False,
        attention_heads: int = 4,
        activation: str = 'tanh',
        use_batch_norm: bool = True,
        merge_mode: str = 'concat',
        **kwargs
    ):
        super(HierarchicalBiGRU, self).__init__(**kwargs)
        
        self.units_list = units_list
        self.return_sequences = return_sequences
        self.use_attention = use_attention
        self.attention_heads = attention_heads
        
        # Create hierarchical BiGRU layers
        self.bi_gru_layers = []
        for i, units in enumerate(units_list):
            bi_gru = BiGRULayer(
                units=units,
                num_layers=1,
                return_sequences=return_sequences or (i < len(units_list) - 1),
                dropout=dropout,
                recurrent_dropout=recurrent_dropout,
                use_attention=use_attention and (i > 0),  # Attention after first layer
                attention_heads=attention_heads,
                activation=activation,
                use_batch_norm=use_batch_norm,
                merge_mode=merge_mode
            )
            self.bi_gru_layers.append(bi_gru)
        
        # Inter-layer attention
        if use_attention and len(units_list) > 1:
            self.inter_attention = layers.MultiHeadAttention(
                num_heads=attention_heads,
                key_dim=units_list[-1] // attention_heads
            )
            self.inter_attention_norm = layers.LayerNormalization()
            self.inter_attention_dropout = layers.Dropout(dropout)
    
    def call(self, inputs, training=None, mask=None):
        """Forward pass through the hierarchical BiGRU."""
        x = inputs
        layer_outputs = []
        
        # Apply BiGRU layers
        for i, bi_gru in enumerate(self.bi_gru_layers):
            x = bi_gru(x, training=training, mask=mask)
            layer_outputs.append(x)
        
        # Apply inter-layer attention if enabled
        if self.use_attention and len(self.bi_gru_layers) > 1:
            # Use attention between different hierarchical levels
            attended = self.inter_attention(
                query=layer_outputs[-1],
                value=tf.concat(layer_outputs[:-1], axis=-1),
                key=tf.concat(layer_outputs[:-1], axis=-1),
                training=training,
                mask=mask
            )
            x = self.inter_attention_norm(x + attended)
            x = self.inter_attention_dropout(x, training=training)
        
        return x
    
    def get_config(self):
        """Get layer configuration for serialization."""
        config = super(HierarchicalBiGRU, self).get_config()
        config.update({
            'units_list': self.units_list,
            'return_sequences': self.return_sequences,
            'use_attention': self.use_attention,
            'attention_heads': self.attention_heads
        })
        return config


class BiGRUWithAttention(layers.Layer):
    """
    BiGRU with attention mechanism for sequence-to-vector or sequence-to-sequence tasks.
    
    Args:
        units (int): Number of GRU units
        attention_type (str): Type of attention ('self', 'global', 'local')
        attention_heads (int): Number of attention heads
        return_sequences (bool): Whether to return full sequences
        dropout (float): Dropout rate
        recurrent_dropout (float): Recurrent dropout rate
        activation (str): Activation function
        use_batch_norm (bool): Whether to use batch normalization
        merge_mode (str): How to merge forward/backward outputs
    """
    
    def __init__(
        self,
        units: int,
        attention_type: str = 'self',
        attention_heads: int = 4,
        return_sequences: bool = True,
        dropout: float = 0.0,
        recurrent_dropout: float = 0.0,
        activation: str = 'tanh',
        use_batch_norm: bool = True,
        merge_mode: str = 'concat',
        **kwargs
    ):
        super(BiGRUWithAttention, self).__init__(**kwargs)
        
        self.units = units
        self.attention_type = attention_type
        self.attention_heads = attention_heads
        self.return_sequences = return_sequences
        
        # BiGRU layer
        self.bi_gru = BiGRULayer(
            units=units,
            return_sequences=True,  # Always return sequences for attention
            dropout=dropout,
            recurrent_dropout=recurrent_dropout,
            activation=activation,
            use_batch_norm=use_batch_norm,
            merge_mode=merge_mode
        )
        
        # Attention mechanism
        if attention_type == 'self':
            self.attention = layers.MultiHeadAttention(
                num_heads=attention_heads,
                key_dim=units // attention_heads
            )
        elif attention_type == 'global':
            self.attention = layers.GlobalAveragePooling1D()
        elif attention_type == 'local':
            self.attention = layers.Conv1D(
                filters=1,
                kernel_size=3,
                padding='same',
                activation='sigmoid'
            )
        
        self.attention_norm = layers.LayerNormalization()
        self.attention_dropout = layers.Dropout(dropout)
        
        # Final processing
        if not return_sequences and attention_type != 'global':
            self.global_pool = layers.GlobalAveragePooling1D()
        else:
            self.global_pool = None
    
    def call(self, inputs, training=None, mask=None):
        """Forward pass through BiGRU with attention."""
        # Apply BiGRU
        x = self.bi_gru(inputs, training=training, mask=mask)
        
        # Apply attention
        if self.attention_type == 'self':
            attended = self.attention(
                query=x,
                value=x,
                key=x,
                training=training,
                mask=mask
            )
            x = self.attention_norm(x + attended)
            x = self.attention_dropout(x, training=training)
            
        elif self.attention_type == 'local':
            attention_weights = self.attention(x)
            x = x * attention_weights
        
        # Global pooling if needed
        if not self.return_sequences and self.global_pool:
            x = self.global_pool(x)
        
        return x
    
    def get_config(self):
        """Get layer configuration for serialization."""
        config = super(BiGRUWithAttention, self).get_config()
        config.update({
            'units': self.units,
            'attention_type': self.attention_type,
            'attention_heads': self.attention_heads,
            'return_sequences': self.return_sequences
        })
        return config
