import os
from typing import Dict, Any, Tuple, Optional, Union

# Configure TensorFlow logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Only show warnings and errors
import tensorflow as tf
from tensorflow import keras
layers = keras.layers

# Disable TensorFlow debug logs
tf.get_logger().setLevel('ERROR')

class TEANetModel:
    """
    TEANet: Transpose-Enhanced Autoencoder Network for Wearable Stress Monitoring
    Following the exact architecture specifications from the paper
    
    This model supports dynamic configuration through config dictionaries,
    allowing flexible input shapes, number of classes, and TEA layers.
    """
    
    def __init__(
        self, 
        input_shape: Tuple[int, int] = (1920, 1), 
        num_classes: int = 2,
        config: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize TEANet model
        
        Args:
            input_shape: Input shape (samples_per_window, channels). 
                        Can be overridden by config if provided.
            num_classes: Number of output classes. Can be overridden by config if provided.
            config: Optional configuration dictionary. If provided, will extract:
                   - model.input_shape or dataset.samples_per_window + model.input_channels
                   - model.num_classes
                   - model.tea_layers (used in build_model)
                   
        Raises:
            ValueError: If input_shape validation fails
        """
        # Process config if provided
        if config is not None:
            input_shape = self._extract_input_shape_from_config(config, input_shape)
            num_classes = config.get('model', {}).get('num_classes', num_classes)
        
        # Validate input shape
        self._validate_input_shape(input_shape)
        
        self.input_shape = input_shape
        self.num_classes = num_classes
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
    def from_config(config: Dict[str, Any]) -> 'TEANetModel':
        """
        Create TEANetModel instance from configuration dictionary.
        
        Args:
            config: Configuration dictionary containing model parameters
            
        Returns:
            TEANetModel instance configured from the provided config
            
        Example:
            >>> config = {
            ...     'dataset': {'samples_per_window': 1920},
            ...     'model': {'input_channels': 1, 'num_classes': 2, 'tea_layers': 5}
            ... }
            >>> model = TEANetModel.from_config(config)
        """
        return TEANetModel(config=config)
        
    def build_model(self, tea_layers: Optional[int] = None) -> keras.Model:
        """
        Build TEANet model with specified number of TEA layers.
        
        Args:
            tea_layers: Number of TEA layers. If None, will try to read from config,
                       otherwise defaults to 5 for TEA-5 configuration.
            
        Returns:
            Compiled Keras model
            
        Raises:
            ValueError: If tea_layers is invalid
        """
        # Get tea_layers from config if not provided
        if tea_layers is None:
            if self.config is not None:
                tea_layers = self.config.get('model', {}).get('tea_layers', 5)
            else:
                tea_layers = 5
        
        # Validate tea_layers
        if not isinstance(tea_layers, int) or tea_layers <= 0:
            raise ValueError(
                f"tea_layers must be a positive integer, got {tea_layers}"
            )
        
        inputs = layers.Input(shape=self.input_shape)
        
        # Down-sampling block (as per TEANet paper)
        x = self._downsampling_block(inputs)
        
        # Stack TEA layers
        for i in range(tea_layers):
            x = self._tea_layer(x, layer_num=i+1)
        
        # Classification block
        x = self._classification_block(x)
        
        # Output layer
        outputs = layers.Dense(self.num_classes, activation='softmax')(x)
        
        # Create model
        self.model = keras.Model(inputs=inputs, outputs=outputs)
        
        return self.model
    
    def _downsampling_block(self, inputs: tf.Tensor) -> tf.Tensor:
        """
        Down-sampling block as per TEANet paper:
        - Conv1D(128, kernel=5, stride=4)
        - MaxPool1D(2)
        - BatchNormalization
        - ReLU
        
        Args:
            inputs: Input tensor of shape (batch, sequence_length, features)
            
        Returns:
            Output tensor after down-sampling
        """
        x = layers.Conv1D(128, kernel_size=5, strides=4, padding='same')(inputs)
        x = layers.MaxPooling1D(pool_size=2, padding='same')(x)
        x = layers.BatchNormalization()(x)
        x = layers.ReLU()(x)
        return x
    
    def _tea_layer(self, inputs: tf.Tensor, layer_num: int) -> tf.Tensor:
        """
        TEA layer containing:
        1. Transpose-Enhanced path: Conv1DTranspose -> Conv1D -> Autoencoder block -> Conv1D -> MaxPool1D
        2. Convolutional path: Two Conv1D blocks with dynamic shape matching
        3. Concatenate both paths after ensuring matching dimensions
        
        Args:
            inputs: Input tensor of shape (batch, sequence_length, features)
            layer_num: Current TEA layer number (1-indexed)
            
        Returns:
            Output tensor after TEA layer processing
        """
        # Transpose-Enhanced path
        transpose_path = self._transpose_enhanced_path(inputs, layer_num)
        
        # Convolutional path
        conv_path = self._convolutional_path(inputs, layer_num)
        
        # Match sequence dimensions using dynamic shape matching with layer number
        transpose_path, conv_path = self._match_sequence_dimensions(
            transpose_path,
            conv_path,
            layer_num=layer_num
        )
        
        # Concatenate both paths
        concatenated = layers.Concatenate(name=f'tea_concat_{layer_num}')(
            [transpose_path, conv_path]
        )
        
        return concatenated
    
    def _transpose_enhanced_path(self, inputs: tf.Tensor, layer_num: int) -> tf.Tensor:
        """
        Transpose-Enhanced path:
        - Conv1DTranspose
        - Conv1D
        - Autoencoder block (3 Conv1D + MaxPool1D stages)
        - Conv1D
        - MaxPool1D
        
        Args:
            inputs: Input tensor of shape (batch, sequence_length, features)
            layer_num: Current TEA layer number (1-indexed)
            
        Returns:
            Output tensor from transpose-enhanced path
        """
        # Filter sizes from Table III of TEANet paper
        filter_sizes = [64, 128, 256, 512, 1024]  # For TEA-1 to TEA-5
        filters = filter_sizes[min(layer_num - 1, len(filter_sizes) - 1)]
        
        # Conv1DTranspose
        x = layers.Conv1DTranspose(filters, kernel_size=3, padding='same')(inputs)
        x = layers.BatchNormalization()(x)
        x = layers.ReLU()(x)
        
        # Conv1D
        x = layers.Conv1D(filters, kernel_size=3, padding='same')(x)
        x = layers.BatchNormalization()(x)
        x = layers.ReLU()(x)
        
        # Autoencoder block (3 stages)
        x = self._autoencoder_block(x, filters)
        
        # Final Conv1D
        x = layers.Conv1D(filters, kernel_size=3, padding='same')(x)
        x = layers.BatchNormalization()(x)
        x = layers.ReLU()(x)
        
        # MaxPool1D
        x = layers.MaxPooling1D(pool_size=2, padding='same')(x)
        
        return x
    
    def _autoencoder_block(self, inputs: tf.Tensor, filters: int) -> tf.Tensor:
        """
        Autoencoder block with 3 Conv1D + MaxPool1D stages.
        
        Args:
            inputs: Input tensor of shape (batch, sequence_length, features)
            filters: Number of filters for Conv1D layers
            
        Returns:
            Output tensor after autoencoder processing
        """
        x = inputs
        
        for i in range(3):
            # Conv1D
            x = layers.Conv1D(filters, kernel_size=3, padding='same')(x)
            x = layers.BatchNormalization()(x)
            x = layers.ReLU()(x)
            
            # MaxPool1D
            x = layers.MaxPooling1D(pool_size=2, padding='same')(x)
        
        return x
    
    def _convolutional_path(self, inputs: tf.Tensor, layer_num: int) -> tf.Tensor:
        """
        Convolutional path with two Conv1D blocks and dynamic shape matching preparation.
        The final shape matching is handled by _match_sequence_dimensions.
        
        Args:
            inputs: Input tensor of shape (batch, sequence_length, features)
            layer_num: Current TEA layer number (1-indexed)
            
        Returns:
            Output tensor from convolutional path
        """
        # Filter sizes from Table III of TEANet paper
        filter_sizes = [64, 128, 256, 512, 1024]  # For TEA-1 to TEA-5
        filters = filter_sizes[min(layer_num - 1, len(filter_sizes) - 1)]
        
        x = inputs
        
        # First Conv1D block with residual connection
        shortcut = x
        x = layers.Conv1D(filters, kernel_size=3, padding='same')(x)
        x = layers.BatchNormalization()(x)
        x = layers.ReLU()(x)
        
        # Second Conv1D block
        x = layers.Conv1D(filters, kernel_size=3, padding='same')(x)
        x = layers.BatchNormalization()(x)
        x = layers.ReLU()(x)
        
        # Add residual connection if shapes match
        if shortcut.shape[-1] == x.shape[-1]:
            x = layers.Add()([x, shortcut])
        
        # Note: Dynamic shape matching will be handled by _match_sequence_dimensions
        # during the TEA layer concatenation
        
        return x
    
    def _match_sequence_dimensions(
        self, 
        transpose_path: tf.Tensor, 
        conv_path: tf.Tensor, 
        layer_num: int = 1
    ) -> Tuple[tf.Tensor, tf.Tensor]:
        """
        Match sequence dimensions between transpose-enhanced and convolutional paths
        using adaptive pooling approach. Handles variable feature dimensions dynamically.
        
        Args:
            transpose_path: Output tensor from transpose-enhanced path
            conv_path: Output tensor from convolutional path
            layer_num: Current TEA layer number for unique layer naming
            
        Returns:
            Tuple of (transpose_path, aligned_conv_path) tensors with matching sequence dimensions
        """
        # Get target sequence length from transpose_path
        target_seq_length = tf.shape(transpose_path)[1]
        
        # Get current sequence length from conv_path
        current_seq_length = tf.shape(conv_path)[1]
        
        # Get feature dimensions
        transpose_features = transpose_path.shape[-1]
        conv_features = conv_path.shape[-1]
        
        # Apply GlobalAveragePooling1D to conv_path to reduce to (batch, features) shape
        pooled_conv = layers.GlobalAveragePooling1D(name=f'conv_path_pool_{layer_num}')(conv_path)
        
        # Project pooled features using Dense layer
        projected_conv = layers.Dense(
            units=conv_features,
            activation='relu',
            name=f'conv_path_projection_{layer_num}'
        )(pooled_conv)
        
        # Expand pooled features to match transpose_path sequence length using tf.tile
        # pooled_conv shape: (batch, features) -> expand to (batch, seq_len, features)
        projected_conv_expanded = tf.expand_dims(projected_conv, axis=1)  # (batch, 1, features)
        expanded_conv = tf.tile(
            projected_conv_expanded,
            [1, target_seq_length, 1],
            name=f'conv_path_repeat_{layer_num}'
        )
        
        # Apply Conv1D projection if feature dimensions don't match between paths
        if conv_features != transpose_features:
            aligned_conv = layers.Conv1D(
                filters=transpose_features,
                kernel_size=1,
                padding='same',
                name=f'conv_path_align_{layer_num}'
            )(expanded_conv)
        else:
            aligned_conv = expanded_conv
        
        return transpose_path, aligned_conv

    def _classification_block(self, inputs: tf.Tensor) -> tf.Tensor:
        """
        Classification block as per TEANet paper:
        - Three Conv1D layers (96, 64, 32 filters)
        - Each followed by: BatchNorm, ReLU, MaxPool1D(2), Dropout(0.3)
        - GlobalAveragePooling
        
        Args:
            inputs: Input tensor of shape (batch, sequence_length, features)
            
        Returns:
            Output tensor after classification block processing
        """
        x = inputs
        
        # First Conv1D layer (96 filters)
        x = layers.Conv1D(96, kernel_size=3, padding='same')(x)
        x = layers.BatchNormalization()(x)
        x = layers.ReLU()(x)
        x = layers.MaxPooling1D(pool_size=2, padding='same')(x)
        x = layers.Dropout(0.3)(x)
        
        # Second Conv1D layer (64 filters)
        x = layers.Conv1D(64, kernel_size=3, padding='same')(x)
        x = layers.BatchNormalization()(x)
        x = layers.ReLU()(x)
        x = layers.MaxPooling1D(pool_size=2, padding='same')(x)
        x = layers.Dropout(0.3)(x)
        
        # Third Conv1D layer (32 filters)
        x = layers.Conv1D(32, kernel_size=3, padding='same')(x)
        x = layers.BatchNormalization()(x)
        x = layers.ReLU()(x)
        x = layers.MaxPooling1D(pool_size=2, padding='same')(x)
        x = layers.Dropout(0.3)(x)
        
        # Global average pooling
        x = layers.GlobalAveragePooling1D()(x)
        
        return x
    
    def compile_model(self, learning_rate: float = 1e-4) -> keras.Model:
        """
        Compile the model with specified optimizer and loss.
        
        Args:
            learning_rate: Learning rate for RMSprop optimizer
            
        Returns:
            Compiled Keras model
            
        Raises:
            ValueError: If model has not been built yet
        """
        if self.model is None:
            raise ValueError("Model must be built before compilation")
        
        # RMSprop optimizer as per TEANet paper
        optimizer = keras.optimizers.RMSprop(learning_rate=learning_rate)
        
        # Sparse categorical crossentropy loss
        loss = 'sparse_categorical_crossentropy'
        
        # Compile model
        self.model.compile(
            optimizer=optimizer,
            loss=loss,
            metrics=['accuracy']
        )
        
        return self.model
    
    def get_model_summary(self) -> Optional[str]:
        """
        Get model summary as a string.
        
        Returns:
            Model summary string, or "Model not built yet" if model hasn't been built
        """
        if self.model is None:
            return "Model not built yet"
        return self.model.summary()
    
    def get_feature_extractor(self) -> keras.Model:
        """
        Get feature extractor model (outputs features before classification).
        Useful for UMAP visualization and explainability.
        
        Returns:
            Keras model that outputs features before the final classification layer
            
        Raises:
            ValueError: If model has not been built yet
        """
        if self.model is None:
            raise ValueError("Model must be built before getting feature extractor")
        
        # Find the GlobalAveragePooling1D layer reliably
        gap_layer = None
        for layer in reversed(self.model.layers):
            if isinstance(layer, layers.GlobalAveragePooling1D):
                gap_layer = layer
                break
        if gap_layer is None:
            # Fallback: use the penultimate layer
            gap_layer = self.model.layers[-2]
        
        feature_model = keras.Model(inputs=self.model.input, outputs=gap_layer.output)
        return feature_model
