import torch
import torch.nn.functional as F
from typing import Dict, Any, List
import logging
from PIL import Image
import time

from ..models.model_loader import get_model_loader
from .preprocessing_service import get_preprocessing_service
from .gradcam_service import get_gradcam_service

logger = logging.getLogger(__name__)

class PredictionService:
    def __init__(self, model_type: str = "mobilenetv2"):
        """
        Initialize PredictionService.

        Args:
            model_type: "mobilenetv2" or "hybrid_cnn_vit"
        """
        self.model_type = model_type.lower()
        self.class_names = ['Normal', 'Pneumonia']  # Update if your classes differ
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model_loader = None
        self.model = None
        self.gradcam_service = None
        self.preprocessing_service = get_preprocessing_service()
        logger.info(f"PredictionService initialized on {self.device} with model type {self.model_type}")

    def load_model(self):
        if self.model_loader is None or self.model_loader.model_type != self.model_type:
            # Define appropriate checkpoint path per model type
            if self.model_type == "hybrid_cnn_vit":
                checkpoint_path = "trained_models/enhanced_hybrid_model.pth"
            elif self.model_type == "mobilenetv2":
                checkpoint_path = "trained_models/mobilenetv2_small_model.pth"
            else:
                raise ValueError(f"Unsupported model type: {self.model_type}")

            self.model_loader = get_model_loader(
                model_path=checkpoint_path,
                device=str(self.device),
                model_type=self.model_type
            )
            self.model = self.model_loader.get_model()
            if self.model_type == "hybrid_cnn_vit":
                self.gradcam_service = get_gradcam_service(self.model)
            else:
                self.gradcam_service = None  # Not implemented for MobileNetV2 yet
            logger.info("Model and auxiliary services loaded")

    async def predict_from_bytes(self, image_bytes: bytes, generate_explanation: bool = True) -> Dict[str, Any]:
        start_time = time.time()
        self.load_model()

        if not self.preprocessing_service.validate_image(image_bytes):
            raise ValueError("Invalid image format or content")

        original_image, resized_image = self.preprocessing_service.load_image_from_bytes(image_bytes)
        image_tensor = self.preprocessing_service.preprocess_for_model(resized_image)
        image_tensor = image_tensor.to(self.device)

        with torch.no_grad():
            if self.model_type == "hybrid_cnn_vit":
                logits, attention_weights, _ = self.model(image_tensor)
            else:  # MobileNetV2 returns only logits
                logits = self.model(image_tensor)
                attention_weights = None

            probabilities = F.softmax(logits, dim=1)
            predicted_class = torch.argmax(probabilities, dim=1).item()
            confidence = probabilities[0, predicted_class].item()

        response = {
            'success': True,
            'prediction': int(predicted_class),
            'class_name': self.class_names[predicted_class],
            'confidence': float(confidence),
            'probabilities': {name: float(prob) for name, prob in zip(self.class_names, probabilities[0].cpu().tolist())},
            'inference_time_ms': 0
        }

        if generate_explanation and self.gradcam_service and attention_weights is not None:
            explanation_data = self.gradcam_service.generate_explanation(
                original_image,
                image_tensor,
                predicted_class,
                confidence,
                self.class_names
            )
            response.update(explanation_data)

        total_time = (time.time() - start_time) * 1000
        response['inference_time_ms'] = round(total_time, 2)

        logger.info(f"Prediction: {response['class_name']} ({confidence*100:.1f}%) in {total_time:.0f} ms")
        return response

    def get_model_info(self) -> Dict[str, Any]:
        self.load_model()
        model_info = self.model_loader.get_model_info()

        if self.model_type == "hybrid_cnn_vit":
            architecture = {
                'backbone_cnn': 'EfficientNet-B0',
                'transformer': 'Vision Transformer (ViT)',
                'fusion_method': 'Cross-Attention',
                'parameters': '15.6M'
            }
        else:
            architecture = 'MobileNetV2 with custom classifier'

        return {
            'model_type': self.model_type,
            'architecture': architecture,
            'training_info': model_info,
            'classes': self.class_names,
            'device': str(self.device)
        }

    def batch_predict(self, image_bytes_list: List[bytes], generate_explanations: bool = False) -> List[Dict[str, Any]]:
        results = []
        for i, image_bytes in enumerate(image_bytes_list):
            try:
                result = torch.run(self.predict_from_bytes(image_bytes, generate_explanations))
                results.append(result)
                logger.info(f"Batch prediction {i+1}/{len(image_bytes_list)} completed")
            except Exception as e:
                logger.error(f"Batch prediction {i+1} failed: {e}")
                results.append({'success': False, 'error': str(e)})
        return results


_prediction_service = None

def get_prediction_service(model_type: str = "mobilenetv2") -> PredictionService:
    global _prediction_service
    if _prediction_service is None or _prediction_service.model_type != model_type:
        _prediction_service = PredictionService(model_type=model_type)
    return _prediction_service
