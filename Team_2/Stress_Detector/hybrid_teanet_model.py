import tensorflow as tf
from tensorflow.keras import layers, Model
from typing import Dict, Any, Tuple, Optional
from teanet_model import TEANetModel
from components.bi_gru import BiGRULayer
from components.fusion_layers import ResidualFusion


class HybridTEANetModel:
    """
    Hybrid TEANet-BiGRU model combining TEANet feature extraction with 
    bidirectional GRU temporal processing and feature fusion.
    
    This model supports dynamic configuration through config dictionaries,
    allowing flexible input shapes, feature dimensions, and architecture parameters.
    """
    
    def __init__(
        self, 
        input_shape: Tuple[int, int] = (1920, 1),
        num_classes: int = 2,
        gru_units: int = 128,
        gru_layers: int = 2,
        use_attention: bool = True,
        dropout_rate: float = 0.3,
        fusion_dim: int = 256,
        config: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize the Hybrid TEANet-BiGRU model.
        
        Args:
            input_shape: Input shape of the signal data (samples_per_window, channels).
                        Can be overridden by config if provided.
            num_classes: Number of output classes. Can be overridden by config if provided.
            gru_units: Number of units in each GRU layer. Can be overridden by config.
            gru_layers: Number of BiGRU layers. Can be overridden by config.
            use_attention: Whether to use attention in BiGRU. Can be overridden by config.
            dropout_rate: Dropout rate for dense layers. Can be overridden by config.
            fusion_dim: Output dimension for feature fusion. Can be overridden by config.
            config: Optional configuration dictionary. If provided, will extract:
                   - model.input_shape or dataset.samples_per_window + model.input_channels
                   - model.num_classes
                   - model.gru_units, model.gru_layers, model.use_attention
                   - model.fusion_dim, model.dropout_rate
                   
        Raises:
            ValueError: If input_shape validation fails
        """
        # Process config if provided
        if config is not None:
            input_shape = self._extract_input_shape_from_config(config, input_shape)
            model_config = config.get('model', {})
            num_classes = model_config.get('num_classes', num_classes)
            gru_units = model_config.get('gru_units', gru_units)
            gru_layers = model_config.get('gru_layers', gru_layers)
            use_attention = model_config.get('use_attention', use_attention)
            fusion_dim = model_config.get('fusion_dim', fusion_dim)
            dropout_rate = model_config.get('dropout_rate', dropout_rate)
        
        # Validate input shape
        self._validate_input_shape(input_shape)
        
        self.input_shape = input_shape
        self.num_classes = num_classes
        self.gru_units = gru_units
        self.gru_layers = gru_layers
        self.use_attention = use_attention
        self.dropout_rate = dropout_rate
        self.fusion_dim = fusion_dim
        self.config = config
        self.model = None
    
    @staticmethod
    def _validate_input_shape(input_shape: Tuple[int, int]) -> None:
        """
        Validate input shape format and values.
        
        Args:
            input_shape: Input shape tuple to validate
            
        Raises:
            ValueError: If input_shape is invalid
        """
        if not isinstance(input_shape, (tuple, list)) or len(input_shape) != 2:
            raise ValueError(
                f"input_shape must be a tuple/list of length 2, got {input_shape}"
            )
        
        samples, channels = input_shape[0], input_shape[1]
        
        if not isinstance(samples, int) or samples <= 0:
            raise ValueError(
                f"input_shape[0] (samples_per_window) must be a positive integer, got {samples}"
            )
        
        if not isinstance(channels, int) or channels <= 0:
            raise ValueError(
                f"input_shape[1] (channels) must be a positive integer, got {channels}"
            )
    
    @staticmethod
    def _extract_input_shape_from_config(
        config: Dict[str, Any], 
        default_shape: Tuple[int, int]
    ) -> Tuple[int, int]:
        """
        Extract input shape from configuration dictionary.
        
        Args:
            config: Configuration dictionary
            default_shape: Default input shape to use if not found in config
            
        Returns:
            Input shape tuple (samples_per_window, channels)
        """
        # Try to get input_shape directly from model config
        model_config = config.get('model', {})
        if 'input_shape' in model_config:
            input_shape = model_config['input_shape']
            if isinstance(input_shape, (tuple, list)) and len(input_shape) == 2:
                return tuple(input_shape)
        
        # Try to construct from samples_per_window and input_channels
        dataset_config = config.get('dataset', {})
        samples_per_window = dataset_config.get('samples_per_window')
        input_channels = model_config.get('input_channels', 1)
        
        if samples_per_window is not None:
            return (int(samples_per_window), int(input_channels))
        
        # Fall back to default
        return default_shape
    
    @staticmethod
    def from_config(config: Dict[str, Any]) -> 'HybridTEANetModel':
        """
        Create HybridTEANetModel instance from configuration dictionary.
        
        Args:
            config: Configuration dictionary containing model parameters
            
        Returns:
            HybridTEANetModel instance configured from the provided config
            
        Example:
            >>> config = {
            ...     'dataset': {'samples_per_window': 1920},
            ...     'model': {
            ...         'input_channels': 1, 'num_classes': 2,
            ...         'gru_units': 128, 'gru_layers': 2,
            ...         'fusion_dim': 256
            ...     }
            ... }
            >>> model = HybridTEANetModel.from_config(config)
        """
        return HybridTEANetModel(config=config)
        
    def build_hybrid_model(self) -> Model:
        """
        Build the hybrid TEANet-BiGRU model architecture.
        Handles variable feature dimensions dynamically through the fusion layer.
        
        Returns:
            Compiled Keras model
            
        Raises:
            ValueError: If TEANet model structure is invalid
        """
        # Initialize and build base TEANet model with config support
        tea_layers = None
        if self.config is not None:
            tea_layers = self.config.get('model', {}).get('tea_layers')
        
        teanet = TEANetModel(
            input_shape=self.input_shape, 
            num_classes=self.num_classes,
            config=self.config
        )
        teanet.build_model(tea_layers=tea_layers)
        
        # Get the pre-GAP features for temporal processing
        # Safe iteration with explicit loop and error handling
        gap_layer = None
        for layer in reversed(teanet.model.layers):
            if isinstance(layer, layers.GlobalAveragePooling1D):
                gap_layer = layer
                break
        
        # Validate that GAP layer was found
        if gap_layer is None:
            raise ValueError(
                "No GlobalAveragePooling1D layer found in TEANet model. "
                "Ensure TEANet is built with the classification block. "
                "Check that TEANet.build_model() was called successfully."
            )
        
        teanet_seq_features = gap_layer.input
        
        # Get the input tensor
        inputs = teanet.model.input
        
        # Add BiGRU temporal processing with sequence output
        # BiGRU handles variable feature dimensions automatically
        bigru_layer = BiGRULayer(
            units=self.gru_units,
            num_layers=self.gru_layers,
            use_attention=self.use_attention,
            return_sequences=True
        )
        temporal_features = bigru_layer(teanet_seq_features)
        
        # Fuse TEANet and BiGRU features using ResidualFusion
        # ResidualFusion handles variable feature dimensions dynamically
        fusion_layer = ResidualFusion(
            output_dim=self.fusion_dim, 
            dropout_rate=self.dropout_rate
        )
        fused_features = fusion_layer([teanet_seq_features, temporal_features])
        
        # Add named identity layer for feature extraction
        fused_features = layers.Identity(name='fused_features')(fused_features)
        
        # Global pooling after fusion
        pooled_features = layers.GlobalAveragePooling1D(name='fused_gap')(fused_features)
        
        # Enhanced classification head
        x = layers.Dense(self.fusion_dim)(pooled_features)
        x = layers.BatchNormalization()(x)
        x = layers.Activation('relu')(x)
        x = layers.Dropout(self.dropout_rate)(x)
        
        x = layers.Dense(128)(x)
        x = layers.BatchNormalization()(x)
        x = layers.Activation('relu')(x)
        x = layers.Dropout(self.dropout_rate)(x)
        
        # Final classification layer
        outputs = layers.Dense(self.num_classes, activation='softmax')(x)
        
        # Create the hybrid model
        self.model = Model(inputs=inputs, outputs=outputs, name='HybridTEANet-BiGRU')
        return self.model
    
    def compile_model(
        self, 
        learning_rate: float = 0.001, 
        loss: str = 'sparse_categorical_crossentropy'
    ) -> Model:
        """
        Compile the hybrid model with optimizer and loss function.
        
        Args:
            learning_rate: Learning rate for Adam optimizer (default: 0.001)
            loss: Loss function to use (default: 'sparse_categorical_crossentropy' to match TEANet)
            
        Returns:
            Compiled Keras model
            
        Raises:
            ValueError: If model has not been built yet
        """
        if self.model is None:
            raise ValueError("Model not built. Call build_hybrid_model() first.")
            
        optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)
        self.model.compile(
            optimizer=optimizer,
            loss=loss,
            metrics=['accuracy']
        )
    
    def get_model_summary(self) -> Optional[str]:
        """
        Get the model summary.
        
        Returns:
            Model summary string
            
        Raises:
            ValueError: If model has not been built yet
        """
        if self.model is None:
            raise ValueError("Model not built. Call build_hybrid_model() first.")
        return self.model.summary()
    
    def get_feature_extractor(self) -> Model:
        """
        Get a feature extraction model that outputs the fused features
        before the classification head.
        
        Returns:
            Keras model that outputs fused features before classification
            
        Raises:
            ValueError: If model has not been built yet
        """
        if self.model is None:
            raise ValueError("Model not built. Call build_hybrid_model() first.")
            
        # Get the model up to the named fusion features layer
        feature_model = Model(
            inputs=self.model.input,
            outputs=self.model.get_layer('fused_features').output,
            name='HybridTEANet-BiGRU-FeatureExtractor'
        )
        return feature_model

    @staticmethod
    def create_model(config: Optional[Dict[str, Any]] = None) -> 'HybridTEANetModel':
        """
        Static method to create and configure a HybridTEANetModel instance.
        Supports both flat config dicts (for backward compatibility) and nested configs.
        
        Args:
            config: Optional dictionary with model configuration parameters.
                   Can be a flat dict or nested dict matching config.yaml structure.
                   
        Returns:
            HybridTEANetModel instance that has been built and compiled
            
        Example:
            >>> # Using nested config (preferred)
            >>> config = {
            ...     'dataset': {'samples_per_window': 1920},
            ...     'model': {
            ...         'input_channels': 1, 'num_classes': 2,
            ...         'gru_units': 128, 'fusion_dim': 256
            ...     },
            ...     'training': {'learning_rate': 0.001}
            ... }
            >>> model = HybridTEANetModel.create_model(config)
            
            >>> # Using flat config (backward compatible)
            >>> config = {
            ...     'input_shape': (1920, 1),
            ...     'num_classes': 2,
            ...     'gru_units': 128,
            ...     'learning_rate': 0.001
            ... }
            >>> model = HybridTEANetModel.create_model(config)
        """
        if config is None:
            config = {}
        
        # Handle flat config format (backward compatibility)
        # Check if it's a flat config by looking for top-level keys
        is_flat_config = any(key in config for key in [
            'input_shape', 'num_classes', 'gru_units', 'gru_layers'
        ])
        
        if is_flat_config:
            # Convert flat config to nested format
            nested_config = {
                'model': {
                    'input_shape': config.get('input_shape', (1920, 1)),
                    'num_classes': config.get('num_classes', 2),
                    'gru_units': config.get('gru_units', 128),
                    'gru_layers': config.get('gru_layers', 2),
                    'use_attention': config.get('use_attention', True),
                    'dropout_rate': config.get('dropout_rate', 0.3),
                    'fusion_dim': config.get('fusion_dim', 256),
                },
                'dataset': {
                    'samples_per_window': config.get('samples_per_window')
                },
                'training': {
                    'learning_rate': config.get('learning_rate', 0.001),
                    'loss': config.get('loss', 'sparse_categorical_crossentropy')
                }
            }
            config = nested_config
        
        # Extract learning_rate and loss from training config if available
        training_config = config.get('training', {})
        learning_rate = training_config.get('learning_rate', 0.001)
        loss = training_config.get('loss', 'sparse_categorical_crossentropy')
        
        # Create and build model
        model = HybridTEANetModel(config=config)
        model.build_hybrid_model()
        model.compile_model(learning_rate=learning_rate, loss=loss)
        
        return model