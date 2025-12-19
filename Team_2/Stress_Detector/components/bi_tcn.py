"""
Bidirectional Temporal Convolutional Network (Bi-TCN) for Physiological Signal Processing

This module implements a bidirectional temporal convolutional network adapted for
physiological signals, providing multi-scale temporal feature extraction with
dilated convolutions and residual connections.
"""

import tensorflow as tf
from tensorflow.keras import layers, Model
from typing import List, Optional, Tuple, Union
import numpy as np


class BiTCNLayer(layers.Layer):
    """
    Bidirectional Temporal Convolutional Network layer for physiological signals.
    
    This layer processes temporal sequences in both forward and backward directions
    using dilated convolutions to capture multi-scale temporal dependencies.
    
    Args:
        filters (int): Number of output filters
        kernel_size (int): Size of the convolution kernel
        dilation_rates (List[int]): List of dilation rates for multi-scale processing
        causal (bool): Whether to use causal convolutions (default: False)
        activation (str): Activation function (default: 'relu')
        dropout_rate (float): Dropout rate (default: 0.1)
        use_batch_norm (bool): Whether to use batch normalization (default: True)
        use_residual (bool): Whether to use residual connections (default: True)
        fusion_method (str): Method to fuse forward/backward features ('concat', 'add', 'attention')
    """
    
    def __init__(
        self,
        filters: int,
        kernel_size: int = 3,
        dilation_rates: List[int] = [1, 2, 4, 8, 16],
        causal: bool = False,
        activation: str = 'relu',
        dropout_rate: float = 0.1,
        use_batch_norm: bool = True,
        use_residual: bool = True,
        fusion_method: str = 'concat',
        **kwargs
    ):
        super(BiTCNLayer, self).__init__(**kwargs)
        
        self.filters = filters
        self.kernel_size = kernel_size
        self.dilation_rates = dilation_rates
        self.causal = causal
        self.activation = activation
        self.dropout_rate = dropout_rate
        self.use_batch_norm = use_batch_norm
        self.use_residual = use_residual
        self.fusion_method = fusion_method
        
        # Forward temporal path
        self.forward_convs = []
        self.forward_bn = []
        self.forward_dropout = []
        
        # Backward temporal path
        self.backward_convs = []
        self.backward_bn = []
        self.backward_dropout = []
        
        # Fusion layer
        if fusion_method == 'attention':
            self.attention_fusion = layers.MultiHeadAttention(
                num_heads=4,
                key_dim=filters // 4
            )
        elif fusion_method == 'concat':
            self.fusion_conv = layers.Conv1D(
                filters=filters,
                kernel_size=1,
                activation=activation
            )
        elif fusion_method == 'add':
            self.fusion_conv = layers.Conv1D(
                filters=filters,
                kernel_size=1,
                activation=activation
            )
        
        # Residual connection
        if use_residual:
            self.residual_conv = layers.Conv1D(
                filters=filters,
                kernel_size=1
            )
        
        # Final processing
        self.final_bn = layers.BatchNormalization() if use_batch_norm else None
        self.final_dropout = layers.Dropout(dropout_rate)
        
    def build(self, input_shape):
        """Build the layer based on input shape."""
        input_channels = input_shape[-1]
        
        # Build forward path
        for dilation in self.dilation_rates:
            # Forward convolution
            forward_conv = layers.Conv1D(
                filters=self.filters,
                kernel_size=self.kernel_size,
                dilation_rate=dilation,
                padding='causal' if self.causal else 'same',
                activation=self.activation
            )
            self.forward_convs.append(forward_conv)
            
            # Forward batch norm
            if self.use_batch_norm:
                self.forward_bn.append(layers.BatchNormalization())
            
            # Forward dropout
            self.forward_dropout.append(layers.Dropout(self.dropout_rate))
        
        # Build backward path
        for dilation in self.dilation_rates:
            # Backward convolution
            backward_conv = layers.Conv1D(
                filters=self.filters,
                kernel_size=self.kernel_size,
                dilation_rate=dilation,
                padding='causal' if self.causal else 'same',
                activation=self.activation
            )
            self.backward_convs.append(backward_conv)
            
            # Backward batch norm
            if self.use_batch_norm:
                self.backward_bn.append(layers.BatchNormalization())
            
            # Backward dropout
            self.backward_dropout.append(layers.Dropout(self.dropout_rate))
        
        super(BiTCNLayer, self).build(input_shape)
    
    def call(self, inputs, training=None, mask=None):
        """
        Forward pass through the BiTCN layer.
        
        Args:
            inputs: Input tensor of shape (batch_size, sequence_length, channels)
            training: Whether in training mode
            mask: Optional mask for variable-length sequences
            
        Returns:
            Output tensor of shape (batch_size, sequence_length, filters)
        """
        # Forward temporal processing
        forward_outputs = []
        x_forward = inputs
        
        for i, (conv, bn, dropout) in enumerate(zip(
            self.forward_convs, self.forward_bn, self.forward_dropout
        )):
            x_forward = conv(x_forward)
            if self.use_batch_norm:
                x_forward = bn(x_forward, training=training)
            x_forward = dropout(x_forward, training=training)
            forward_outputs.append(x_forward)
        
        # Backward temporal processing (reverse sequence)
        backward_outputs = []
        x_backward = tf.reverse(inputs, axis=[1])  # Reverse temporal dimension
        
        for i, (conv, bn, dropout) in enumerate(zip(
            self.backward_convs, self.backward_bn, self.backward_dropout
        )):
            x_backward = conv(x_backward)
            if self.use_batch_norm:
                x_backward = bn(x_backward, training=training)
            x_backward = dropout(x_backward, training=training)
            backward_outputs.append(x_backward)
        
        # Reverse backward outputs to match original sequence order
        backward_outputs = [tf.reverse(output, axis=[1]) for output in backward_outputs]
        
        # Fuse forward and backward features
        if self.fusion_method == 'concat':
            # Concatenate all forward and backward features
            all_features = forward_outputs + backward_outputs
            fused = tf.concat(all_features, axis=-1)
            fused = self.fusion_conv(fused)
            
        elif self.fusion_method == 'add':
            # Add corresponding forward and backward features
            fused = inputs
            for forward_out, backward_out in zip(forward_outputs, backward_outputs):
                combined = forward_out + backward_out
                fused = fused + combined
            fused = self.fusion_conv(fused)
            
        elif self.fusion_method == 'attention':
            # Use attention to fuse forward and backward features
            forward_concat = tf.concat(forward_outputs, axis=-1)
            backward_concat = tf.concat(backward_outputs, axis=-1)
            
            # Apply attention between forward and backward features
            attended = self.attention_fusion(
                query=forward_concat,
                value=backward_concat,
                key=backward_concat
            )
            fused = forward_concat + attended
        
        # Apply residual connection
        if self.use_residual:
            residual = self.residual_conv(inputs)
            fused = fused + residual
        
        # Final processing
        if self.final_bn:
            fused = self.final_bn(fused, training=training)
        fused = self.final_dropout(fused, training=training)
        
        return fused
    
    def get_config(self):
        """Get layer configuration for serialization."""
        config = super(BiTCNLayer, self).get_config()
        config.update({
            'filters': self.filters,
            'kernel_size': self.kernel_size,
            'dilation_rates': self.dilation_rates,
            'causal': self.causal,
            'activation': self.activation,
            'dropout_rate': self.dropout_rate,
            'use_batch_norm': self.use_batch_norm,
            'use_residual': self.use_residual,
            'fusion_method': self.fusion_method
        })
        return config


class BiTCNBlock(layers.Layer):
    """
    A complete BiTCN block with multiple BiTCN layers and optional pooling.
    
    Args:
        filters (int): Number of output filters
        num_layers (int): Number of BiTCN layers in the block
        kernel_size (int): Size of the convolution kernel
        dilation_rates (List[int]): List of dilation rates
        causal (bool): Whether to use causal convolutions
        activation (str): Activation function
        dropout_rate (float): Dropout rate
        use_batch_norm (bool): Whether to use batch normalization
        use_residual (bool): Whether to use residual connections
        fusion_method (str): Method to fuse forward/backward features
        use_pooling (bool): Whether to use temporal pooling
        pool_size (int): Size of the pooling window
    """
    
    def __init__(
        self,
        filters: int,
        num_layers: int = 3,
        kernel_size: int = 3,
        dilation_rates: List[int] = [1, 2, 4, 8, 16],
        causal: bool = False,
        activation: str = 'relu',
        dropout_rate: float = 0.1,
        use_batch_norm: bool = True,
        use_residual: bool = True,
        fusion_method: str = 'concat',
        use_pooling: bool = False,
        pool_size: int = 2,
        **kwargs
    ):
        super(BiTCNBlock, self).__init__(**kwargs)
        
        self.filters = filters
        self.num_layers = num_layers
        self.use_pooling = use_pooling
        self.pool_size = pool_size
        
        # Create BiTCN layers
        self.bi_tcn_layers = []
        for i in range(num_layers):
            layer = BiTCNLayer(
                filters=filters,
                kernel_size=kernel_size,
                dilation_rates=dilation_rates,
                causal=causal,
                activation=activation,
                dropout_rate=dropout_rate,
                use_batch_norm=use_batch_norm,
                use_residual=use_residual,
                fusion_method=fusion_method
            )
            self.bi_tcn_layers.append(layer)
        
        # Optional pooling layer
        if use_pooling:
            self.pooling = layers.MaxPooling1D(pool_size=pool_size)
        else:
            self.pooling = None
    
    def call(self, inputs, training=None, mask=None):
        """Forward pass through the BiTCN block."""
        x = inputs
        
        # Apply BiTCN layers
        for layer in self.bi_tcn_layers:
            x = layer(x, training=training, mask=mask)
        
        # Apply pooling if specified
        if self.pooling:
            x = self.pooling(x)
        
        return x
    
    def get_config(self):
        """Get layer configuration for serialization."""
        config = super(BiTCNBlock, self).get_config()
        config.update({
            'filters': self.filters,
            'num_layers': self.num_layers,
            'use_pooling': self.use_pooling,
            'pool_size': self.pool_size
        })
        return config
