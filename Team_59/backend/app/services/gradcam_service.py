import torch
import numpy as np
from PIL import Image
import cv2
import io
import base64
from typing import Tuple, Optional
import logging

from ..models.gradcam import GradCAM

logger = logging.getLogger(__name__)

class GradCAMService:
    """Service for generating GradCAM visualizations"""

    def __init__(self, model: torch.nn.Module):
        """
        Initialize GradCAM service
        Args:
            model: Trained model
        """
        self.gradcam = GradCAM(model)
        logger.info("GradCAMService initialized")

    def generate_heatmap(
        self,
        image_tensor: torch.Tensor,
        target_class: Optional[int] = None
    ) -> np.ndarray:
        """
        Generate GradCAM heatmap
        """
        try:
            heatmap = self.gradcam.generate_cam(image_tensor, target_class)
            # Normalize heatmap to [0,1] for full contrast
            heatmap = cv2.normalize(heatmap, None, 0, 1, cv2.NORM_MINMAX)
            logger.info(f"Generated and normalized heatmap for class {target_class}")
            print("DEBUG heatmap shape:", heatmap.shape, "min/max:", heatmap.min(), heatmap.max())
            return heatmap
        except Exception as e:
            logger.error(f"Heatmap generation failed: {e}")
            raise

    def create_overlay(
        self,
        original_image: Image.Image,
        heatmap: np.ndarray,
        alpha: float = 0.75,  # Increased default for more visible GradCAM
        colormap: int = cv2.COLORMAP_JET
    ) -> Tuple[Image.Image, Image.Image]:
        """
        Create heatmap overlay on original image
        """
        try:
            # Resize original image to 224x224 with bilinear interpolation
            img_resized = original_image.resize((224, 224), Image.BILINEAR)
            img_array = np.array(img_resized)
            print("DEBUG img_array shape:", img_array.shape, "dtype:", img_array.dtype, "min/max:", img_array.min(), img_array.max())

            # Convert normalized heatmap to [0,255] uint8
            heatmap_uint8 = np.uint8(255 * heatmap)
            heatmap_colored = cv2.applyColorMap(heatmap_uint8, colormap)
            heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

            # Sharper Grad-CAM overlay
            superimposed = (
                alpha * heatmap_colored + (1 - alpha) * img_array
            ).astype(np.uint8)

            # Convert both images to PIL format
            heatmap_img = Image.fromarray(heatmap_colored)
            superimposed_img = Image.fromarray(superimposed)

            # Save images for manual debug (delete later in prod)
            heatmap_img.save("debug_heatmap.png")
            superimposed_img.save("debug_superimposed.png")
            print("Saved debug PNGs. Image sizes:", heatmap_img.size, superimposed_img.size)

            logger.info("Overlay created successfully")

            return heatmap_img, superimposed_img
        except Exception as e:
            logger.error(f"Overlay creation failed: {e}")
            raise

    def image_to_base64(self, image: Image.Image) -> str:
        """
        Convert PIL image to base64 string
        """
        try:
            buffer = io.BytesIO()
            image.save(buffer, format='PNG')
            img_bytes = buffer.getvalue()
            print("DEBUG encoded PNG size:", len(img_bytes), "First bytes:", img_bytes[:20])
            base64_str = base64.b64encode(img_bytes).decode('utf-8')
            return f"data:image/png;base64,{base64_str}"
        except Exception as e:
            logger.error(f"Base64 encoding failed: {e}")
            raise

    def generate_explanation(
        self,
        original_image: Image.Image,
        image_tensor: torch.Tensor,
        predicted_class: int,
        confidence: float,
        class_names: list
    ) -> dict:
        """
        Generate complete explanation package
        """
        try:
            # Generate normalized heatmap
            heatmap = self.generate_heatmap(image_tensor, predicted_class)

            # Create overlays
            heatmap_img, superimposed_img = self.create_overlay(
                original_image,
                heatmap
            )

            # Convert both images to base64
            heatmap_b64 = self.image_to_base64(heatmap_img)
            superimposed_b64 = self.image_to_base64(superimposed_img)

            # Generate textual explanation
            explanation_text = self._generate_explanation_text(
                predicted_class,
                confidence,
                class_names
            )

            explanation_data = {
                'heatmap': heatmap_b64,
                'superimposed': superimposed_b64,
                'explanation': explanation_text,
                'confidence': confidence,
                'predicted_class': class_names[predicted_class]
            }

            logger.info("Complete explanation generated")

            return explanation_data
        except Exception as e:
            logger.error(f"Explanation generation failed: {e}")
            raise

    def _generate_explanation_text(
        self,
        predicted_class: int,
        confidence: float,
        class_names: list
    ) -> str:
        """Generate human-readable explanation"""
        confidence_pct = confidence * 100
        class_name = class_names[predicted_class]

        if confidence_pct >= 95:
            certainty = "very high confidence"
        elif confidence_pct >= 85:
            certainty = "high confidence"
        elif confidence_pct >= 75:
            certainty = "moderate confidence"
        else:
            certainty = "low confidence"

        explanation = (
            f"The model predicts this image shows {class_name} with "
            f"{certainty} ({confidence_pct:.1f}%). "
            f"The highlighted regions in the heatmap indicate the areas "
            f"that most influenced this diagnosis. Brighter colors (red/yellow) "
            f"show higher importance, while darker colors (blue/purple) show "
            f"lower importance in the decision-making process."
        )

        return explanation


# Global service instance
_gradcam_service = None

def get_gradcam_service(model: torch.nn.Module) -> GradCAMService:
    """Get or create GradCAM service"""
    global _gradcam_service
    if _gradcam_service is None:
        _gradcam_service = GradCAMService(model)
    return _gradcam_service
