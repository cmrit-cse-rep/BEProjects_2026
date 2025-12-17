"""
Healthcare AR Platform - Backend Application
Version 2.0.0
"""

__version__ = "2.0.0"
__app_name__ = "Healthcare AR Platform"

# Import key model components only
from .hybrid_cnn_vit import ImprovedHybridCNNViT
from .gradcam import GradCAM
from .model_loader import ModelLoader
from .user import User
from .course import Course
from .enrollment import Enrollment

__all__ = [
    'ImprovedHybridCNNViT',
    'GradCAM',
    'ModelLoader',
    "User",
    "Course",
    "Enrollment",
    "Lesson",
]
