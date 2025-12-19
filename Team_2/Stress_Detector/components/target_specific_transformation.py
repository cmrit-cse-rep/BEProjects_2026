"""
Target-Specific Transformation (TST) for Physiological Signal Processing

This module implements target-specific transformation layers adapted from TNet-ATT
for physiological signals, enabling personalized stress detection by conditioning
feature representations on individual-specific or context-specific information.
"""

import tensorflow as tf
from tensorflow.keras import layers, Model
from typing import List, Optional, Tuple, Union, Dict
import numpy as np


class TargetSpecificTransformation(layers.Layer):
    """
    Target-Specific Transformation layer adapted from TNet-ATT for physiological signals.
    
    This layer conditions feature representations based on target information such as
    individual characteristics, baseline physiological state, or contextual information.
    
    Args:
        feature_dim (int): Dimension of input features
        target_dim (int): Dimension of target information
        transformation_dim (int): Dimension of transformation space (default: feature_dim)
        use_context_preserving (bool): Whether to use context-preserving mechanisms (default: True)
        use_adaptive_scaling (bool): Whether to use adaptive scaling (default: True)
        use_residual (bool): Whether to use residual connections (default: True)
        dropout_rate (float): Dropout rate (default: 0.1)
        activation (str): Activation function (default: 'relu')
        use_batch_norm (bool): Whether to use batch normalization (default: True)
        target_types (List[str]): Types of targets to handle (default: ['demographic', 'baseline', 'context'])
    """
    
    def __init__(
        self,
        feature_dim: int,
        target_dim: int,
        transformation_dim: Optional[int] = None,
        use_context_preserving: bool = True,
        use_adaptive_scaling: bool = True,
        use_residual: bool = True,
        dropout_rate: float = 0.1,
        activation: str = 'relu',
        use_batch_norm: bool = True,
        target_types: List[str] = ['demographic', 'baseline', 'context'],
        **kwargs
    ):
        super(TargetSpecificTransformation, self).__init__(**kwargs)
        
        self.feature_dim = feature_dim
        self.target_dim = target_dim
        self.transformation_dim = transformation_dim or feature_dim
        self.use_context_preserving = use_context_preserving
        self.use_adaptive_scaling = use_adaptive_scaling
        self.use_residual = use_residual
        self.dropout_rate = dropout_rate
        self.activation = activation
        self.use_batch_norm = use_batch_norm
        self.target_types = target_types
        
        # Target embedding layers for different target types
        self.target_embeddings = {}
        for target_type in target_types:
            self.target_embeddings[target_type] = layers.Dense(
                units=self.transformation_dim,
                activation=activation,
                name=f'target_embedding_{target_type}'
            )
        
        # Feature transformation layers
        self.feature_transform = layers.Dense(
            units=self.transformation_dim,
            activation=activation,
            name='feature_transform'
        )
        
        # Context-preserving mechanisms
        if use_context_preserving:
            self.context_gate = layers.Dense(
                units=self.feature_dim,
                activation='sigmoid',
                name='context_gate'
            )
            self.context_transform = layers.Dense(
                units=self.feature_dim,
                activation=activation,
                name='context_transform'
            )
        
        # Adaptive scaling
        if use_adaptive_scaling:
            self.scaling_network = layers.Dense(
                units=self.feature_dim,
                activation='tanh',
                name='scaling_network'
            )
            self.scaling_gate = layers.Dense(
                units=self.feature_dim,
                activation='sigmoid',
                name='scaling_gate'
            )
        
        # Target-specific transformation matrices
        self.transformation_matrices = {}
        for target_type in target_types:
            self.transformation_matrices[target_type] = layers.Dense(
                units=self.transformation_dim,
                activation=activation,
                name=f'transformation_matrix_{target_type}'
            )
        
        # Fusion layer for combining target-specific transformations
        self.fusion_layer = layers.Dense(
            units=self.feature_dim,
            activation=activation,
            name='fusion_layer'
        )
        
        # Regularization
        self.dropout = layers.Dropout(dropout_rate)
        
        # Batch normalization
        if use_batch_norm:
            self.batch_norm = layers.BatchNormalization()
        else:
            self.batch_norm = None
        
        # Residual connection
        if use_residual:
            self.residual_transform = layers.Dense(
                units=self.feature_dim,
                name='residual_transform'
            )
    
    def _process_targets(self, targets):
        """
        Process target information for different target types.
        
        Args:
            targets: Dictionary of target information or single target tensor
            
        Returns:
            Processed target embeddings
        """
        if isinstance(targets, dict):
            # Handle multiple target types
            target_embeddings = []
            for target_type, target_value in targets.items():
                if target_type in self.target_embeddings:
                    embedding = self.target_embeddings[target_type](target_value)
                    target_embeddings.append(embedding)
            
            if target_embeddings:
                return tf.concat(target_embeddings, axis=-1)
            else:
                # Fallback to first target type if available
                first_target = list(targets.values())[0]
                return self.target_embeddings[self.target_types[0]](first_target)
        else:
            # Handle single target tensor
            return self.target_embeddings[self.target_types[0]](targets)
    
    def _apply_context_preserving(self, features, target_embedding):
        """
        Apply context-preserving mechanisms to maintain original signal information.
        
        Args:
            features: Input features
            target_embedding: Target embedding
            
        Returns:
            Context-preserved features
        """
        if not self.use_context_preserving:
            return features
        
        # Context gate to control information flow
        context_gate = self.context_gate(target_embedding)
        
        # Context transformation
        context_transform = self.context_transform(target_embedding)
        
        # Apply context-preserving transformation
        context_preserved = features * context_gate + context_transform
        
        return context_preserved
    
    def _apply_adaptive_scaling(self, features, target_embedding):
        """
        Apply adaptive scaling based on target information.
        
        Args:
            features: Input features
            target_embedding: Target embedding
            
        Returns:
            Adaptively scaled features
        """
        if not self.use_adaptive_scaling:
            return features
        
        # Scaling network
        scaling_factor = self.scaling_network(target_embedding)
        scaling_gate = self.scaling_gate(target_embedding)
        
        # Apply adaptive scaling
        scaled_features = features * scaling_factor * scaling_gate
        
        return scaled_features
    
    def _apply_target_specific_transformation(self, features, target_embedding):
        """
        Apply target-specific transformation matrices.
        
        Args:
            features: Input features
            target_embedding: Target embedding
            
        Returns:
            Target-specific transformed features
        """
        # Transform features
        transformed_features = self.feature_transform(features)
        
        # Apply target-specific transformations
        target_transformations = []
        for target_type, transformation_matrix in self.transformation_matrices.items():
            target_specific = transformation_matrix(target_embedding)
            transformed = transformed_features * target_specific
            target_transformations.append(transformed)
        
        # Fuse target-specific transformations
        if len(target_transformations) > 1:
            fused = tf.concat(target_transformations, axis=-1)
        else:
            fused = target_transformations[0]
        
        # Final fusion
        output = self.fusion_layer(fused)
        
        return output
    
    def call(self, inputs, targets, training=None):
        """
        Forward pass through the target-specific transformation layer.
        
        Args:
            inputs: Input features of shape (batch_size, sequence_length, feature_dim)
            targets: Target information (dict or tensor)
            training: Whether in training mode
            
        Returns:
            Transformed features of shape (batch_size, sequence_length, feature_dim)
        """
        # Process target information
        target_embedding = self._process_targets(targets)
        
        # Apply context-preserving mechanisms
        context_preserved = self._apply_context_preserving(inputs, target_embedding)
        
        # Apply adaptive scaling
        scaled_features = self._apply_adaptive_scaling(context_preserved, target_embedding)
        
        # Apply target-specific transformation
        transformed = self._apply_target_specific_transformation(scaled_features, target_embedding)
        
        # Apply batch normalization
        if self.batch_norm:
            transformed = self.batch_norm(transformed, training=training)
        
        # Apply dropout
        transformed = self.dropout(transformed, training=training)
        
        # Apply residual connection
        if self.use_residual:
            residual = self.residual_transform(inputs)
            transformed = transformed + residual
        
        return transformed
    
    def get_config(self):
        """Get layer configuration for serialization."""
        config = super(TargetSpecificTransformation, self).get_config()
        config.update({
            'feature_dim': self.feature_dim,
            'target_dim': self.target_dim,
            'transformation_dim': self.transformation_dim,
            'use_context_preserving': self.use_context_preserving,
            'use_adaptive_scaling': self.use_adaptive_scaling,
            'use_residual': self.use_residual,
            'dropout_rate': self.dropout_rate,
            'activation': self.activation,
            'use_batch_norm': self.use_batch_norm,
            'target_types': self.target_types
        })
        return config


class MultiModalTargetTransformation(layers.Layer):
    """
    Multi-modal target-specific transformation for different physiological signal modalities.
    
    Args:
        feature_dims (Dict[str, int]): Dictionary mapping modality names to feature dimensions
        target_dim (int): Dimension of target information
        transformation_dim (int): Dimension of transformation space
        use_modality_specific (bool): Whether to use modality-specific transformations
        use_cross_modal_attention (bool): Whether to use cross-modal attention
        attention_heads (int): Number of attention heads for cross-modal attention
        dropout_rate (float): Dropout rate
        activation (str): Activation function
    """
    
    def __init__(
        self,
        feature_dims: Dict[str, int],
        target_dim: int,
        transformation_dim: int,
        use_modality_specific: bool = True,
        use_cross_modal_attention: bool = True,
        attention_heads: int = 4,
        dropout_rate: float = 0.1,
        activation: str = 'relu',
        **kwargs
    ):
        super(MultiModalTargetTransformation, self).__init__(**kwargs)
        
        self.feature_dims = feature_dims
        self.target_dim = target_dim
        self.transformation_dim = transformation_dim
        self.use_modality_specific = use_modality_specific
        self.use_cross_modal_attention = use_cross_modal_attention
        self.attention_heads = attention_heads
        self.dropout_rate = dropout_rate
        self.activation = activation
        
        # Modality-specific transformations
        if use_modality_specific:
            self.modality_transformations = {}
            for modality, feature_dim in feature_dims.items():
                self.modality_transformations[modality] = TargetSpecificTransformation(
                    feature_dim=feature_dim,
                    target_dim=target_dim,
                    transformation_dim=transformation_dim,
                    dropout_rate=dropout_rate,
                    activation=activation
                )
        else:
            # Shared transformation for all modalities
            self.shared_transformation = TargetSpecificTransformation(
                feature_dim=sum(feature_dims.values()),
                target_dim=target_dim,
                transformation_dim=transformation_dim,
                dropout_rate=dropout_rate,
                activation=activation
            )
        
        # Cross-modal attention
        if use_cross_modal_attention:
            self.cross_modal_attention = layers.MultiHeadAttention(
                num_heads=attention_heads,
                key_dim=transformation_dim // attention_heads
            )
            self.attention_norm = layers.LayerNormalization()
            self.attention_dropout = layers.Dropout(dropout_rate)
        
        # Modality fusion
        self.modality_fusion = layers.Dense(
            units=transformation_dim,
            activation=activation,
            name='modality_fusion'
        )
    
    def call(self, inputs, targets, training=None):
        """
        Forward pass through the multi-modal target transformation.
        
        Args:
            inputs: Dictionary of modality features
            targets: Target information
            training: Whether in training mode
            
        Returns:
            Fused transformed features
        """
        transformed_modalities = {}
        
        # Apply modality-specific transformations
        if self.use_modality_specific:
            for modality, features in inputs.items():
                if modality in self.modality_transformations:
                    transformed = self.modality_transformations[modality](
                        features, targets, training=training
                    )
                    transformed_modalities[modality] = transformed
        else:
            # Concatenate all modalities and apply shared transformation
            concatenated = tf.concat(list(inputs.values()), axis=-1)
            transformed = self.shared_transformation(concatenated, targets, training=training)
            # Split back into modalities (approximate)
            start_idx = 0
            for modality, feature_dim in self.feature_dims.items():
                end_idx = start_idx + feature_dim
                transformed_modalities[modality] = transformed[:, :, start_idx:end_idx]
                start_idx = end_idx
        
        # Apply cross-modal attention if enabled
        if self.use_cross_modal_attention and len(transformed_modalities) > 1:
            modality_list = list(transformed_modalities.values())
            modality_names = list(transformed_modalities.keys())
            
            # Apply attention between modalities
            attended_modalities = []
            for i, modality_features in enumerate(modality_list):
                # Use other modalities as key and value
                other_modalities = [modality_list[j] for j in range(len(modality_list)) if j != i]
                if other_modalities:
                    other_features = tf.concat(other_modalities, axis=-1)
                    attended = self.cross_modal_attention(
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
            
            # Update transformed modalities
            for i, modality_name in enumerate(modality_names):
                transformed_modalities[modality_name] = attended_modalities[i]
        
        # Fuse all modalities
        fused_features = tf.concat(list(transformed_modalities.values()), axis=-1)
        fused_features = self.modality_fusion(fused_features)
        
        return fused_features
    
    def get_config(self):
        """Get layer configuration for serialization."""
        config = super(MultiModalTargetTransformation, self).get_config()
        config.update({
            'feature_dims': self.feature_dims,
            'target_dim': self.target_dim,
            'transformation_dim': self.transformation_dim,
            'use_modality_specific': self.use_modality_specific,
            'use_cross_modal_attention': self.use_cross_modal_attention,
            'attention_heads': self.attention_heads,
            'dropout_rate': self.dropout_rate,
            'activation': self.activation
        })
        return config


class AdaptiveTargetTransformation(layers.Layer):
    """
    Adaptive target-specific transformation that learns to adapt based on input characteristics.
    
    Args:
        feature_dim (int): Dimension of input features
        target_dim (int): Dimension of target information
        adaptation_dim (int): Dimension of adaptation space
        num_adaptation_layers (int): Number of adaptation layers
        dropout_rate (float): Dropout rate
        activation (str): Activation function
    """
    
    def __init__(
        self,
        feature_dim: int,
        target_dim: int,
        adaptation_dim: int = 64,
        num_adaptation_layers: int = 2,
        dropout_rate: float = 0.1,
        activation: str = 'relu',
        **kwargs
    ):
        super(AdaptiveTargetTransformation, self).__init__(**kwargs)
        
        self.feature_dim = feature_dim
        self.target_dim = target_dim
        self.adaptation_dim = adaptation_dim
        self.num_adaptation_layers = num_adaptation_layers
        self.dropout_rate = dropout_rate
        self.activation = activation
        
        # Adaptation network
        self.adaptation_layers = []
        for i in range(num_adaptation_layers):
            layer = layers.Dense(
                units=adaptation_dim,
                activation=activation,
                name=f'adaptation_layer_{i}'
            )
            self.adaptation_layers.append(layer)
        
        # Target-specific adaptation
        self.target_adaptation = layers.Dense(
            units=adaptation_dim,
            activation=activation,
            name='target_adaptation'
        )
        
        # Feature adaptation
        self.feature_adaptation = layers.Dense(
            units=adaptation_dim,
            activation=activation,
            name='feature_adaptation'
        )
        
        # Adaptive transformation
        self.adaptive_transform = layers.Dense(
            units=feature_dim,
            activation=activation,
            name='adaptive_transform'
        )
        
        # Dropout
        self.dropout = layers.Dropout(dropout_rate)
    
    def call(self, inputs, targets, training=None):
        """
        Forward pass through the adaptive target transformation.
        
        Args:
            inputs: Input features
            targets: Target information
            training: Whether in training mode
            
        Returns:
            Adaptively transformed features
        """
        # Process target information
        target_adapted = self.target_adaptation(targets)
        
        # Process feature information
        feature_adapted = self.feature_adaptation(inputs)
        
        # Combine target and feature information
        combined = target_adapted + feature_adapted
        
        # Apply adaptation layers
        adapted = combined
        for layer in self.adaptation_layers:
            adapted = layer(adapted)
            adapted = self.dropout(adapted, training=training)
        
        # Apply adaptive transformation
        transformed = self.adaptive_transform(adapted)
        
        return transformed
    
    def get_config(self):
        """Get layer configuration for serialization."""
        config = super(AdaptiveTargetTransformation, self).get_config()
        config.update({
            'feature_dim': self.feature_dim,
            'target_dim': self.target_dim,
            'adaptation_dim': self.adaptation_dim,
            'num_adaptation_layers': self.num_adaptation_layers,
            'dropout_rate': self.dropout_rate,
            'activation': self.activation
        })
        return config
