"""
Image Preprocessing Service for Medical Images
Handles image loading, validation, and transformation
"""

import torch
import numpy as np
from PIL import Image
import io
import cv2
from torchvision import transforms
from typing import Union, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class ImagePreprocessingService:
    """Handles preprocessing of medical images for model inference"""
    
    def __init__(self):
        """Initialize preprocessing transformations"""
        # Standard ImageNet normalization (as used in training)
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
        
        # Transform without normalization (for visualization)
        self.transform_no_norm = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor()
        ])
        
        logger.info("ImagePreprocessingService initialized")
    
    def validate_image(self, image_bytes: bytes) -> bool:
        """
        Validate image format and content
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            bool: True if valid
        """
        try:
            img = Image.open(io.BytesIO(image_bytes))
            
            # Check format
            if img.format not in ['JPEG', 'PNG', 'JPG']:
                logger.warning(f"Unsupported format: {img.format}")
                return False
            
            # Check size
            if img.size[0] < 50 or img.size[1] < 50:
                logger.warning(f"Image too small: {img.size}")
                return False
            
            # Check if corrupted
            img.verify()
            
            return True
            
        except Exception as e:
            logger.error(f"Image validation failed: {e}")
            return False
    
    def load_image_from_bytes(
        self, 
        image_bytes: bytes
    ) -> Tuple[Image.Image, Image.Image]:
        """
        Load image from bytes
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            tuple: (original_image, resized_image)
        """
        try:
            # Load image
            img = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Keep original
            original = img.copy()
            
            # Resize for processing
            resized = img.resize((224, 224), Image.BILINEAR)
            
            logger.info(f"Image loaded: {original.size} -> {resized.size}")
            
            return original, resized
            
        except Exception as e:
            logger.error(f"Failed to load image: {e}")
            raise ValueError(f"Invalid image data: {e}")
    
    def preprocess_for_model(
        self, 
        image: Union[Image.Image, np.ndarray]
    ) -> torch.Tensor:
        """
        Preprocess image for model inference
        
        Args:
            image: PIL Image or numpy array
            
        Returns:
            tensor: Preprocessed image tensor [1, 3, 224, 224]
        """
        try:
            # Convert numpy to PIL if needed
            if isinstance(image, np.ndarray):
                image = Image.fromarray(image)
            
            # Apply transformations
            tensor = self.transform(image)
            
            # Add batch dimension
            tensor = tensor.unsqueeze(0)
            
            logger.debug(f"Preprocessed tensor shape: {tensor.shape}")
            
            return tensor
            
        except Exception as e:
            logger.error(f"Preprocessing failed: {e}")
            raise ValueError(f"Failed to preprocess image: {e}")
    
    def enhance_medical_image(
        self, 
        image: Image.Image,
        clahe: bool = True,
        denoise: bool = True
    ) -> Image.Image:
        """
        Apply medical-specific enhancements
        
        Args:
            image: Input image
            clahe: Apply CLAHE enhancement
            denoise: Apply denoising
            
        Returns:
            enhanced_image: Enhanced image
        """
        try:
            # Convert to numpy
            img_array = np.array(image)
            
            # Convert to grayscale for processing
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
            
            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
            if clahe:
                clahe_obj = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
                gray = clahe_obj.apply(gray)
            
            # Apply denoising
            if denoise:
                gray = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
            
            # Convert back to RGB
            enhanced = cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)
            
            # Convert to PIL
            enhanced_img = Image.fromarray(enhanced)
            
            logger.info("Image enhancement completed")
            
            return enhanced_img
            
        except Exception as e:
            logger.warning(f"Enhancement failed, returning original: {e}")
            return image
    
    def get_image_statistics(self, image: Image.Image) -> dict:
        """
        Get statistical information about the image
        
        Args:
            image: Input image
            
        Returns:
            dict: Image statistics
        """
        img_array = np.array(image)
        
        stats = {
            'size': image.size,
            'mode': image.mode,
            'mean': float(np.mean(img_array)),
            'std': float(np.std(img_array)),
            'min': float(np.min(img_array)),
            'max': float(np.max(img_array)),
            'shape': img_array.shape
        }
        
        return stats

# Global service instance
_preprocessing_service = None

def get_preprocessing_service() -> ImagePreprocessingService:
    """Get singleton preprocessing service"""
    global _preprocessing_service
    if _preprocessing_service is None:
        _preprocessing_service = ImagePreprocessingService()
    return _preprocessing_service
