import torch
import logging
from pathlib import Path
from typing import Optional, Dict, Any
import json

from .hybrid_cnn_vit import ImprovedHybridCNNViT
from .mobilenetv2_model import SmallMedNet  # Your new MobileNetV2 model class

logger = logging.getLogger(__name__)

class ModelLoader:
    """Manages model loading and caching"""

    def __init__(
        self,
        model_path: str,
        device: Optional[str] = None,
        model_type: str = "mobilenetv2",  # 'mobilenetv2' or 'hybrid_cnn_vit'
    ):
        self.model_path = Path(model_path)
        self.device = device or ('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.model_info = {}
        self.model_type = model_type.lower()
        logger.info(f"ModelLoader initialized - Device: {self.device}, Model type: {self.model_type}")

    def load_model(self, num_classes: int = 2):
        logger.info(f"Loading model from {self.model_path} of type {self.model_type}")

        if self.model_type == "hybrid_cnn_vit":
            model = ImprovedHybridCNNViT(num_classes=num_classes)
        elif self.model_type == "mobilenetv2":
            model = SmallMedNet(num_classes=num_classes)
        else:
            raise ValueError(f"Unsupported model type: {self.model_type}")

        if not self.model_path.exists():
            raise FileNotFoundError(f"Model checkpoint not found: {self.model_path}")

        checkpoint = torch.load(self.model_path, map_location=self.device)

        if self.model_type == "hybrid_cnn_vit":
            # Expected to be a dict with 'model_state_dict'
            model.load_state_dict(checkpoint['model_state_dict'])
            self.model_info = {
                'epoch': checkpoint.get('epoch', 'unknown'),
                'val_acc': checkpoint.get('val_acc', 'unknown'),
                'val_f1': checkpoint.get('val_f1', 'unknown'),
            }
        else:
            # For MobileNetV2, checkpoint is typically the model state_dict itself
            model.load_state_dict(checkpoint)
            self.model_info = {}

        model.to(self.device)
        model.eval()

        self.model = model
        logger.info("Model loaded successfully")
        return model

    def get_model(self):
        if self.model is None:
            self.load_model()
        return self.model

    def get_model_info(self) -> Dict[str, Any]:
        return self.model_info

    def save_model_metadata(self, output_path: str = "trained_models/model_metadata.json"):
        metadata = {
            'model_type': self.model_type,
            'training': self.model_info,
            'classes': ['NORMAL', 'PNEUMONIA'],
        }

        if self.model_type == "hybrid_cnn_vit":
            metadata['architecture'] = {
                'backbone_cnn': 'EfficientNet-B0',
                'transformer': 'Vision Transformer',
                'fusion': 'Cross-Attention'
            }
        elif self.model_type == "mobilenetv2":
            metadata['architecture'] = 'MobileNetV2 with custom classifier'

        with open(output_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        logger.info(f"Model metadata saved to {output_path}")


# Singleton instance - You may want to support multiple loaders separately if needed
_model_loader = None

def get_model_loader(
    model_path="trained_models/mobilenetv2_small_model.pth",
    device=None,
    model_type="mobilenetv2"
) -> ModelLoader:
    global _model_loader
    if _model_loader is None or _model_loader.model_type != model_type or str(_model_loader.model_path) != model_path:
        _model_loader = ModelLoader(model_path=model_path, device=device, model_type=model_type)
    return _model_loader

# # Load Hybrid CNN-ViT
# loader_hybrid = get_model_loader(
#     model_path="trained_models/enhanced_hybrid_model.pth",
#     model_type="hybrid_cnn_vit"
# )
# hybrid_model = loader_hybrid.get_model()

# # Load MobileNetV2
# loader_mobilenet = get_model_loader(
#     model_path="trained_models/mobilenetv2_small_model.pth",
#     model_type="mobilenetv2"
# )
# mobilenet_model = loader_mobilenet.get_model()
