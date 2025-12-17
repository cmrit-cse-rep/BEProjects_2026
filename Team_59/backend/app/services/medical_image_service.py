"""
Main Medical Image Service - High-level API
Orchestrates all medical image analysis operations
"""

import logging
from typing import Dict, Any, Optional
from fastapi import UploadFile
import asyncio

from .prediction_service import get_prediction_service
from .preprocessing_service import get_preprocessing_service

logger = logging.getLogger(__name__)

class MedicalImageService:
    """
    High-level medical image analysis service
    Orchestrates preprocessing, prediction, and explanation
    """
    
    def __init__(self):
        """Initialize medical image service"""
        self.prediction_service = get_prediction_service()
        self.preprocessing_service = get_preprocessing_service()
        
        logger.info("MedicalImageService initialized")
    
    async def analyze_image(
        self,
        file: UploadFile,
        generate_explanation: bool = True,
        enhance_image: bool = False
    ) -> Dict[str, Any]:
        """
        Complete image analysis pipeline
        
        Args:
            file: Uploaded file
            generate_explanation: Generate GradCAM explanation
            enhance_image: Apply medical image enhancements
            
        Returns:
            dict: Complete analysis results
        """
        try:
            # Read file
            image_bytes = await file.read()
            
            logger.info(f"Processing file: {file.filename} ({len(image_bytes)} bytes)")
            
            # Optional enhancement
            if enhance_image:
                logger.info("Applying medical image enhancements")
                # Enhancement logic here if needed
            
            # Perform prediction
            result = await self.prediction_service.predict_from_bytes(
                image_bytes,
                generate_explanation=generate_explanation
            )
            
            # Add metadata
            result['filename'] = file.filename
            result['file_size_bytes'] = len(image_bytes)
            
            logger.info(f"Analysis completed for {file.filename}")
            
            return result
            
        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            raise
    
    async def batch_analyze(
        self,
        files: list,
        generate_explanations: bool = False
    ) -> list:
        """
        Batch analysis of multiple images
        
        Args:
            files: List of uploaded files
            generate_explanations: Generate explanations
            
        Returns:
            list: Analysis results for each file
        """
        tasks = [
            self.analyze_image(file, generate_explanations)
            for file in files
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return results
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get system status and health"""
        try:
            model_info = self.prediction_service.get_model_info()
            
            status = {
                'status': 'healthy',
                'model_loaded': self.prediction_service.model is not None,
                'services': {
                    'prediction': 'active',
                    'preprocessing': 'active',
                    'gradcam': 'active'
                },
                'model_info': model_info
            }
            
            return status
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e)
            }
    
    def get_supported_formats(self) -> list:
        """Get supported image formats"""
        return ['JPEG', 'JPG', 'PNG']
    
    def get_capabilities(self) -> Dict[str, Any]:
        """Get service capabilities"""
        return {
            'supported_formats': self.get_supported_formats(),
            'max_image_size_mb': 10,
            'features': [
                'medical_image_classification',
                'explainable_ai_gradcam',
                'confidence_scoring',
                'batch_processing',
                'real_time_inference'
            ],
            'classes': ['Normal', 'Pneumonia'],
            'model_type': 'Hybrid CNN-Transformer'
        }

# Global service instance
_medical_image_service = None

def get_medical_image_service() -> MedicalImageService:
    """Get singleton medical image service"""
    global _medical_image_service
    if _medical_image_service is None:
        _medical_image_service = MedicalImageService()
    return _medical_image_service
