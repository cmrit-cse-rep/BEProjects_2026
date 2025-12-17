"""
GradCAM Implementation for Explainable AI
Generates attention heatmaps for medical image classification
"""

import torch
import torch.nn.functional as F
import numpy as np
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class GradCAM:
    """
    Gradient-weighted Class Activation Mapping (GradCAM)
    
    Generates visual explanations by highlighting regions that influence
    the model's prediction decision.
    """
    
    def __init__(self, model: torch.nn.Module):
        """
        Initialize GradCAM
        
        Args:
            model: The trained model
        """
        self.model = model
        self.model.eval()
        self.gradients = None
        self.activations = None
        
        logger.info("GradCAM initialized")
    
    def save_gradient(self, grad: torch.Tensor):
        """Hook function to save gradients"""
        self.gradients = grad
    
    def forward_pass(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass with gradient tracking
        
        Args:
            x: Input tensor [B, 3, 224, 224]
            
        Returns:
            logits: Model predictions
        """
        # Get features from model
        logits, _, cnn_features = self.model(x)
        
        # Store activations
        self.activations = cnn_features
        
        # Register hook for gradients
        if cnn_features.requires_grad:
            cnn_features.register_hook(self.save_gradient)
        
        return logits
    
    def generate_cam(
        self, 
        x: torch.Tensor, 
        target_class: Optional[int] = None
    ) -> np.ndarray:
        """
        Generate Class Activation Map
        
        Args:
            x: Input image tensor [1, 3, 224, 224]
            target_class: Target class index (if None, uses predicted class)
            
        Returns:
            cam: Normalized CAM heatmap [H, W]
        """
        # Forward pass
        logits = self.forward_pass(x)
        
        # Get target class
        if target_class is None:
            target_class = torch.argmax(logits, dim=1).item()
        
        # Zero gradients
        self.model.zero_grad()
        
        # Backward pass
        class_loss = logits[0, target_class]
        class_loss.backward()
        
        # Get gradients and activations
        gradients = self.gradients  # [1, C, H, W]
        activations = self.activations  # [1, C, H, W]
        
        # Calculate weights (global average pooling of gradients)
        weights = torch.mean(gradients, dim=[2, 3], keepdim=True)  # [1, C, 1, 1]
        
        # Weighted combination of activation maps
        cam = torch.sum(weights * activations, dim=1, keepdim=True)  # [1, 1, H, W]
        
        # Apply ReLU
        cam = F.relu(cam)
        
        # Upsample to input size
        cam = F.interpolate(
            cam, 
            size=(224, 224), 
            mode='bilinear', 
            align_corners=False
        )
        
        # Normalize to [0, 1]
        cam = cam.squeeze().cpu().detach().numpy()
        cam = cam - cam.min()
        if cam.max() > 0:
            cam = cam / cam.max()
        
        logger.info(f"Generated CAM for class {target_class}")
        
        return cam
    
    def generate_guided_gradcam(
        self, 
        x: torch.Tensor, 
        target_class: Optional[int] = None
    ) -> np.ndarray:
        """
        Generate Guided GradCAM for higher resolution
        
        Args:
            x: Input image tensor
            target_class: Target class index
            
        Returns:
            guided_cam: High-resolution attention map
        """
        # Generate standard CAM
        cam = self.generate_cam(x, target_class)
        
        # Get guided backpropagation (simplified version)
        # In production, implement full guided backprop
        guided_gradients = self.gradients.clamp(min=0)
        guided_cam = cam * guided_gradients.mean(dim=1).squeeze().cpu().numpy()
        
        # Normalize
        guided_cam = guided_cam - guided_cam.min()
        if guided_cam.max() > 0:
            guided_cam = guided_cam / guided_cam.max()
        
        return guided_cam
    
    def overlay_cam_on_image(
        self, 
        img: np.ndarray, 
        cam: np.ndarray, 
        alpha: float = 0.6
    ) -> np.ndarray:
        """
        Overlay CAM heatmap on original image
        
        Args:
            img: Original image [H, W, 3] in range [0, 255]
            cam: CAM heatmap [H, W] in range [0, 1]
            alpha: Blending factor
            
        Returns:
            overlay: Blended image with heatmap
        """
        import cv2
        
        # Convert CAM to heatmap
        heatmap = cv2.applyColorMap(
            np.uint8(255 * cam), 
            cv2.COLORMAP_JET
        )
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        
        # Ensure image is correct size
        if img.shape[:2] != (224, 224):
            img = cv2.resize(img, (224, 224))
        
        # Blend
        overlay = (alpha * heatmap + (1 - alpha) * img).astype(np.uint8)
        
        return overlay
