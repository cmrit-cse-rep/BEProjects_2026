"""
TNet-ATT Inspired Components for Physiological Signal Processing

This module contains neural network components adapted from TNet-ATT architecture
for physiological signal processing and stress detection. The components are designed
to work with the existing TEANet architecture while providing enhanced temporal
modeling capabilities.

Components:
- BiTCN: Bidirectional Temporal Convolutional Network
- BiGRU: Bidirectional GRU for long-term dependency modeling
- MultiHeadSelfAttention: Multi-head attention for physiological signals
- TargetSpecificTransformation: Target-specific feature conditioning
- FusionLayers: Various fusion strategies for component outputs
- Utils: Utility functions and helper classes

Version: 1.0.0
Author: Stress Detection Team
"""

import logging
from tensorflow.keras import layers
from typing import Dict, Any, Optional

# Setup logging
logger = logging.getLogger(__name__)

# Initialize component availability tracking
components_available = False
_component_status: Dict[str, bool] = {}

def create_dummy_layer(name: str) -> type:
    """Create a dummy layer class that logs when used."""
    class DummyLayer(layers.Layer):
        def __init__(self, *args, **kwargs):
            super().__init__()
            logger.warning(f"{name} component not available, using dummy layer")
        def call(self, inputs, **kwargs):
            return inputs
    DummyLayer.__name__ = name
    return DummyLayer

# Component imports with individual try/except blocks
try:
    from .bi_tcn import BiTCNLayer
    _component_status['BiTCNLayer'] = True
except ImportError as e:
    logger.warning(f"BiTCNLayer import failed: {e}")
    BiTCNLayer = create_dummy_layer('BiTCNLayer')
    _component_status['BiTCNLayer'] = False

try:
    from .bi_gru import BiGRULayer
    _component_status['BiGRULayer'] = True
except ImportError as e:
    logger.warning(f"BiGRULayer import failed: {e}")
    BiGRULayer = create_dummy_layer('BiGRULayer')
    _component_status['BiGRULayer'] = False

try:
    from .multi_head_attention import MultiHeadSelfAttention
    _component_status['MultiHeadSelfAttention'] = True
except ImportError as e:
    logger.warning(f"MultiHeadSelfAttention import failed: {e}")
    MultiHeadSelfAttention = create_dummy_layer('MultiHeadSelfAttention')
    _component_status['MultiHeadSelfAttention'] = False

try:
    from .target_specific_transformation import TargetSpecificTransformation
    _component_status['TargetSpecificTransformation'] = True
except ImportError as e:
    logger.warning(f"TargetSpecificTransformation import failed: {e}")
    TargetSpecificTransformation = create_dummy_layer('TargetSpecificTransformation')
    _component_status['TargetSpecificTransformation'] = False

# Import fusion layers
try:
    from .fusion_layers import (
        FeatureFusion, ConcatenationFusion, AttentionFusion, GatedFusion,
        ResidualFusion, AdaptiveFusion, MultiModalFusion, TemporalFusion
    )
    for layer in ['FeatureFusion', 'ConcatenationFusion', 'AttentionFusion', 'GatedFusion',
                  'ResidualFusion', 'AdaptiveFusion', 'MultiModalFusion', 'TemporalFusion']:
        _component_status[layer] = True
except ImportError as e:
    logger.warning(f"Fusion layers import failed: {e}")
    for layer in ['FeatureFusion', 'ConcatenationFusion', 'AttentionFusion', 'GatedFusion',
                  'ResidualFusion', 'AdaptiveFusion', 'MultiModalFusion', 'TemporalFusion']:
        globals()[layer] = create_dummy_layer(layer)
        _component_status[layer] = False

# Import utility functions with fallback implementations
try:
    from .utils import (
        create_positional_encoding,
        create_attention_mask,
        create_causal_mask,
        validate_input_shape,
        visualize_attention_weights
    )
    _component_status['utils'] = True
except ImportError as e:
    logger.warning(f"Utility functions import failed: {e}")
    def dummy_function(*args, **kwargs): 
        logger.warning("Utility function not available")
        return None
    create_positional_encoding = dummy_function
    create_attention_mask = dummy_function
    create_causal_mask = dummy_function
    validate_input_shape = dummy_function
    visualize_attention_weights = dummy_function
    _component_status['utils'] = False

# Set overall component availability based on critical components
components_available = all([
    _component_status['BiTCNLayer'],
    _component_status['BiGRULayer'],
    _component_status['MultiHeadSelfAttention']
])

def get_component_status() -> Dict[str, bool]:
    """Get the availability status of all components."""
    return _component_status.copy()

__version__ = "1.0.0"
__all__ = [
    # Main components
    'BiTCNLayer',
    'BiGRULayer',
    'MultiHeadSelfAttention',
    'TargetSpecificTransformation',
    # Fusion layers
    'FeatureFusion',
    'ConcatenationFusion',
    'AttentionFusion',
    'GatedFusion',
    'ResidualFusion',
    'AdaptiveFusion',
    'MultiModalFusion',
    'TemporalFusion',
    # Utility functions
    'create_positional_encoding',
    'create_attention_mask',
    'create_causal_mask',
    'validate_input_shape',
    'visualize_attention_weights',
    # Status checks
    'components_available',
    'get_component_status'
]
