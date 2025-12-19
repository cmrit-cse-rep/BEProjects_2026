"""
Multi-Head Self-Attention for Physiological Signal Processing

This module implements multi-head self-attention mechanisms specifically
designed for physiological signals, with support for positional encoding,
causal attention, and attention visualization.
"""

import tensorflow as tf
from tensorflow.keras import layers, Model
from typing import List, Optional, Tuple, Union, Dict
import numpy as np
import math


class MultiHeadSelfAttention(layers.Layer):
    """
    Multi-Head Self-Attention layer adapted for physiological signals.
    
    This layer implements scaled dot-product attention with multiple heads,
    designed specifically for temporal sequences in physiological signals.
    
    Args:
        num_heads (int): Number of attention heads
        key_dim (int): Dimension of key vectors
        value_dim (Optional[int]): Dimension of value vectors (default: key_dim)
        dropout (float): Dropout rate (default: 0.1)
        use_bias (bool): Whether to use bias in linear transformations (default: True)
        causal (bool): Whether to use causal attention (default: False)
        use_positional_encoding (bool): Whether to use positional encoding (default: True)
        positional_encoding_type (str): Type of positional encoding ('sinusoidal', 'learnable', 'relative')
        max_position (int): Maximum position for positional encoding (default: 10000)
        attention_scale (float): Scale factor for attention scores (default: 1.0)
        use_layer_norm (bool): Whether to use layer normalization (default: True)
        norm_epsilon (float): Epsilon for layer normalization (default: 1e-6)
    """
    
    def __init__(
        self,
        num_heads: int,
        key_dim: int,
        value_dim: Optional[int] = None,
        dropout: float = 0.1,
        use_bias: bool = True,
        causal: bool = False,
        use_positional_encoding: bool = True,
        positional_encoding_type: str = 'sinusoidal',
        max_position: int = 10000,
        attention_scale: float = 1.0,
        use_layer_norm: bool = True,
        norm_epsilon: float = 1e-6,
        **kwargs
    ):
        super(MultiHeadSelfAttention, self).__init__(**kwargs)
        
        self.num_heads = num_heads
        self.key_dim = key_dim
        self.value_dim = value_dim or key_dim
        self.dropout = dropout
        self.use_bias = use_bias
        self.causal = causal
        self.use_positional_encoding = use_positional_encoding
        self.positional_encoding_type = positional_encoding_type
        self.max_position = max_position
        self.attention_scale = attention_scale
        self.use_layer_norm = use_layer_norm
        self.norm_epsilon = norm_epsilon
        
        # Linear transformations for Q, K, V
        self.query_dense = layers.Dense(
            units=num_heads * key_dim,
            use_bias=use_bias,
            name='query_dense'
        )
        self.key_dense = layers.Dense(
            units=num_heads * key_dim,
            use_bias=use_bias,
            name='key_dense'
        )
        self.value_dense = layers.Dense(
            units=num_heads * value_dim,
            use_bias=use_bias,
            name='value_dense'
        )
        
        # Output projection
        self.output_dense = layers.Dense(
            units=num_heads * value_dim,
            use_bias=use_bias,
            name='output_dense'
        )
        
        # Dropout layers
        self.attention_dropout = layers.Dropout(dropout)
        self.output_dropout = layers.Dropout(dropout)
        
        # Layer normalization
        if use_layer_norm:
            self.layer_norm = layers.LayerNormalization(epsilon=norm_epsilon)
        else:
            self.layer_norm = None
        
        # Positional encoding
        if use_positional_encoding:
            self.positional_encoding = self._create_positional_encoding()
        else:
            self.positional_encoding = None
    
    def _create_positional_encoding(self):
        """Create positional encoding based on the specified type."""
        if self.positional_encoding_type == 'sinusoidal':
            return self._create_sinusoidal_encoding()
        elif self.positional_encoding_type == 'learnable':
            return self._create_learnable_encoding()
        elif self.positional_encoding_type == 'relative':
            return self._create_relative_encoding()
        else:
            raise ValueError(f"Unknown positional encoding type: {self.positional_encoding_type}")
    
    def _create_sinusoidal_encoding(self):
        """Create sinusoidal positional encoding."""
        def sinusoidal_encoding(positions, d_model):
            angle_rates = 1 / np.power(10000, (2 * (np.arange(d_model)[np.newaxis, :] // 2)) / np.float32(d_model))
            angle_rads = positions[:, np.newaxis] * angle_rates
            # Apply sin to even indices
            angle_rads[:, 0::2] = np.sin(angle_rads[:, 0::2])
            # Apply cos to odd indices
            angle_rads[:, 1::2] = np.cos(angle_rads[:, 1::2])
            return angle_rads
        
        return sinusoidal_encoding
    
    def _create_learnable_encoding(self):
        """Create learnable positional encoding."""
        return layers.Embedding(
            input_dim=self.max_position,
            output_dim=self.key_dim,
            name='positional_embedding'
        )
    
    def _create_relative_encoding(self):
        """Create relative positional encoding."""
        return layers.Dense(
            units=self.key_dim,
            use_bias=False,
            name='relative_position_encoding'
        )
    
    def _apply_positional_encoding(self, x, positions=None):
        """Apply positional encoding to the input."""
        if not self.use_positional_encoding or self.positional_encoding is None:
            return x
        
        seq_len = tf.shape(x)[1]
        
        if positions is None:
            positions = tf.range(seq_len, dtype=tf.float32)
        
        if self.positional_encoding_type == 'sinusoidal':
            # For sinusoidal encoding, we need to handle the sequence length
            if seq_len <= self.max_position:
                pos_encoding = self.positional_encoding(positions.numpy(), self.key_dim)
                pos_encoding = tf.constant(pos_encoding, dtype=x.dtype)
            else:
                # For longer sequences, we can interpolate or use a subset
                pos_encoding = self.positional_encoding(
                    tf.range(self.max_position, dtype=tf.float32).numpy(), 
                    self.key_dim
                )
                pos_encoding = tf.constant(pos_encoding, dtype=x.dtype)
                # Repeat or interpolate for longer sequences
                if seq_len > self.max_position:
                    pos_encoding = tf.tile(pos_encoding, [seq_len // self.max_position + 1, 1])[:seq_len]
        else:
            # For learnable or relative encoding
            pos_encoding = self.positional_encoding(positions)
        
        return x + pos_encoding
    
    def _create_attention_mask(self, seq_len, batch_size=None):
        """Create attention mask for causal attention."""
        if not self.causal:
            return None
        
        # Create causal mask
        mask = tf.linalg.band_part(
            tf.ones((seq_len, seq_len)), 
            -1, 0
        )
        mask = tf.cast(mask, dtype=tf.float32)
        
        if batch_size is not None:
            mask = tf.expand_dims(mask, 0)
            mask = tf.tile(mask, [batch_size, 1, 1])
        
        return mask
    
    def _scaled_dot_product_attention(self, query, key, value, mask=None):
        """Compute scaled dot-product attention."""
        # Calculate attention scores
        scores = tf.matmul(query, key, transpose_b=True)
        scores = scores / tf.sqrt(tf.cast(self.key_dim, tf.float32))
        
        # Apply attention scale
        scores = scores * self.attention_scale
        
        # Apply mask if provided
        if mask is not None:
            scores += (mask * -1e9)
        
        # Apply softmax
        attention_weights = tf.nn.softmax(scores, axis=-1)
        
        # Apply dropout
        attention_weights = self.attention_dropout(attention_weights, training=self._get_training_flag())
        
        # Apply attention to values
        output = tf.matmul(attention_weights, value)
        
        return output, attention_weights
    
    def _get_training_flag(self):
        """Get the training flag from the current context."""
        return tf.keras.backend.learning_phase()
    
    def call(self, inputs, training=None, mask=None):
        """
        Forward pass through the multi-head attention layer.
        
        Args:
            inputs: Input tensor of shape (batch_size, seq_len, d_model)
            training: Whether in training mode
            mask: Optional attention mask
            
        Returns:
            Output tensor of shape (batch_size, seq_len, d_model)
        """
        batch_size = tf.shape(inputs)[0]
        seq_len = tf.shape(inputs)[1]
        
        # Apply positional encoding
        x = self._apply_positional_encoding(inputs)
        
        # Apply layer normalization (pre-norm)
        if self.layer_norm:
            x = self.layer_norm(x)
        
        # Linear transformations
        query = self.query_dense(x)
        key = self.key_dense(x)
        value = self.value_dense(x)
        
        # Reshape for multi-head attention
        query = tf.reshape(query, [batch_size, seq_len, self.num_heads, self.key_dim])
        key = tf.reshape(key, [batch_size, seq_len, self.num_heads, self.key_dim])
        value = tf.reshape(value, [batch_size, seq_len, self.num_heads, self.value_dim])
        
        # Transpose for attention computation
        query = tf.transpose(query, [0, 2, 1, 3])  # (batch_size, num_heads, seq_len, key_dim)
        key = tf.transpose(key, [0, 2, 1, 3])
        value = tf.transpose(value, [0, 2, 1, 3])
        
        # Create causal mask if needed
        attention_mask = self._create_attention_mask(seq_len, batch_size)
        if mask is not None:
            if attention_mask is not None:
                attention_mask = tf.minimum(attention_mask, mask)
            else:
                attention_mask = mask
        
        # Apply attention
        attended, attention_weights = self._scaled_dot_product_attention(
            query, key, value, attention_mask
        )
        
        # Transpose back
        attended = tf.transpose(attended, [0, 2, 1, 3])
        
        # Reshape and apply output projection
        attended = tf.reshape(attended, [batch_size, seq_len, self.num_heads * self.value_dim])
        output = self.output_dense(attended)
        
        # Apply output dropout
        output = self.output_dropout(output, training=training)
        
        # Store attention weights for visualization
        self._attention_weights = attention_weights
        
        return output
    
    def get_attention_weights(self):
        """Get the attention weights from the last forward pass."""
        return getattr(self, '_attention_weights', None)
    
    def get_config(self):
        """Get layer configuration for serialization."""
        config = super(MultiHeadSelfAttention, self).get_config()
        config.update({
            'num_heads': self.num_heads,
            'key_dim': self.key_dim,
            'value_dim': self.value_dim,
            'dropout': self.dropout,
            'use_bias': self.use_bias,
            'causal': self.causal,
            'use_positional_encoding': self.use_positional_encoding,
            'positional_encoding_type': self.positional_encoding_type,
            'max_position': self.max_position,
            'attention_scale': self.attention_scale,
            'use_layer_norm': self.use_layer_norm,
            'norm_epsilon': self.norm_epsilon
        })
        return config


class PositionalEncoding(layers.Layer):
    """
    Positional encoding layer for temporal sequences.
    
    Args:
        d_model (int): Model dimension
        max_position (int): Maximum position for encoding
        encoding_type (str): Type of encoding ('sinusoidal', 'learnable')
    """
    
    def __init__(
        self,
        d_model: int,
        max_position: int = 10000,
        encoding_type: str = 'sinusoidal',
        **kwargs
    ):
        super(PositionalEncoding, self).__init__(**kwargs)
        
        self.d_model = d_model
        self.max_position = max_position
        self.encoding_type = encoding_type
        
        if encoding_type == 'learnable':
            self.embedding = layers.Embedding(
                input_dim=max_position,
                output_dim=d_model,
                name='positional_embedding'
            )
        else:
            self.embedding = None
    
    def call(self, inputs):
        """Apply positional encoding to inputs."""
        seq_len = tf.shape(inputs)[1]
        
        if self.encoding_type == 'sinusoidal':
            positions = tf.range(seq_len, dtype=tf.float32)
            angle_rates = 1 / tf.pow(10000.0, (2 * (tf.range(self.d_model, dtype=tf.float32) // 2)) / tf.cast(self.d_model, tf.float32))
            angle_rads = positions[:, tf.newaxis] * angle_rates[tf.newaxis, :]
            
            # Apply sin to even indices
            sines = tf.sin(angle_rads[:, 0::2])
            # Apply cos to odd indices
            cosines = tf.cos(angle_rads[:, 1::2])
            
            # Interleave sines and cosines
            pos_encoding = tf.reshape(
                tf.stack([sines, cosines], axis=-1),
                [seq_len, self.d_model]
            )
            
            return inputs + pos_encoding
        
        else:  # learnable
            positions = tf.range(seq_len)
            pos_encoding = self.embedding(positions)
            return inputs + pos_encoding
    
    def get_config(self):
        """Get layer configuration for serialization."""
        config = super(PositionalEncoding, self).get_config()
        config.update({
            'd_model': self.d_model,
            'max_position': self.max_position,
            'encoding_type': self.encoding_type
        })
        return config


class AttentionBlock(layers.Layer):
    """
    Complete attention block with residual connections and layer normalization.
    
    Args:
        num_heads (int): Number of attention heads
        key_dim (int): Dimension of key vectors
        value_dim (Optional[int]): Dimension of value vectors
        dropout (float): Dropout rate
        causal (bool): Whether to use causal attention
        use_positional_encoding (bool): Whether to use positional encoding
        positional_encoding_type (str): Type of positional encoding
        max_position (int): Maximum position for positional encoding
        use_layer_norm (bool): Whether to use layer normalization
    """
    
    def __init__(
        self,
        num_heads: int,
        key_dim: int,
        value_dim: Optional[int] = None,
        dropout: float = 0.1,
        causal: bool = False,
        use_positional_encoding: bool = True,
        positional_encoding_type: str = 'sinusoidal',
        max_position: int = 10000,
        use_layer_norm: bool = True,
        **kwargs
    ):
        super(AttentionBlock, self).__init__(**kwargs)
        
        # Multi-head attention
        self.attention = MultiHeadSelfAttention(
            num_heads=num_heads,
            key_dim=key_dim,
            value_dim=value_dim,
            dropout=dropout,
            causal=causal,
            use_positional_encoding=use_positional_encoding,
            positional_encoding_type=positional_encoding_type,
            max_position=max_position,
            use_layer_norm=use_layer_norm
        )
        
        # Layer normalization
        if use_layer_norm:
            self.layer_norm1 = layers.LayerNormalization()
            self.layer_norm2 = layers.LayerNormalization()
        else:
            self.layer_norm1 = None
            self.layer_norm2 = None
        
        # Feed-forward network
        self.ffn = layers.Dense(units=key_dim * 4, activation='relu')
        self.ffn_output = layers.Dense(units=key_dim)
        self.ffn_dropout = layers.Dropout(dropout)
    
    def call(self, inputs, training=None, mask=None):
        """Forward pass through the attention block."""
        # Self-attention with residual connection
        if self.layer_norm1:
            norm_inputs = self.layer_norm1(inputs)
        else:
            norm_inputs = inputs
        
        attended = self.attention(norm_inputs, training=training, mask=mask)
        x = inputs + attended
        
        # Feed-forward network with residual connection
        if self.layer_norm2:
            norm_x = self.layer_norm2(x)
        else:
            norm_x = x
        
        ffn_output = self.ffn(norm_x)
        ffn_output = self.ffn_output(ffn_output)
        ffn_output = self.ffn_dropout(ffn_output, training=training)
        
        output = x + ffn_output
        
        return output
    
    def get_attention_weights(self):
        """Get attention weights from the attention layer."""
        return self.attention.get_attention_weights()
    
    def get_config(self):
        """Get layer configuration for serialization."""
        config = super(AttentionBlock, self).get_config()
        config.update({
            'num_heads': self.attention.num_heads,
            'key_dim': self.attention.key_dim,
            'value_dim': self.attention.value_dim,
            'dropout': self.attention.dropout,
            'causal': self.attention.causal,
            'use_positional_encoding': self.attention.use_positional_encoding,
            'positional_encoding_type': self.attention.positional_encoding_type,
            'max_position': self.attention.max_position,
            'use_layer_norm': self.attention.use_layer_norm
        })
        return config
