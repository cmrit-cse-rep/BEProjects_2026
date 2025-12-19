"""
GPU Detection and Memory Management Utilities

This module provides utilities for GPU detection, memory management,
and TensorFlow device configuration.
"""

import os
import logging
import tensorflow as tf
from typing import Optional, Dict, List, Tuple
import gc

# Optional dependency for system memory info
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

logger = logging.getLogger(__name__)


class GPUManager:
    """
    Manager for GPU detection and memory management.
    """
    
    @staticmethod
    def detect_gpus() -> Dict[str, any]:
        """
        Detect available GPUs and return information.
        
        Returns:
            Dictionary containing GPU information:
            - available: bool, whether GPUs are available
            - count: int, number of GPUs
            - devices: list of GPU device names
            - memory_info: list of memory info for each GPU
        """
        gpu_info = {
            'available': False,
            'count': 0,
            'devices': [],
            'memory_info': []
        }
        
        try:
            gpus = tf.config.list_physical_devices('GPU')
            gpu_info['available'] = len(gpus) > 0
            gpu_info['count'] = len(gpus)
            gpu_info['devices'] = [gpu.name for gpu in gpus]
            
            if gpu_info['available']:
                logger.info(f"Found {len(gpus)} GPU(s): {[gpu.name for gpu in gpus]}")
                
                # Get memory info for each GPU
                for i, gpu in enumerate(gpus):
                    try:
                        tf.config.experimental.set_memory_growth(gpu, True)
                        memory_info = tf.config.experimental.get_memory_info(gpu.name)
                        gpu_info['memory_info'].append({
                            'device': gpu.name,
                            'current': memory_info['current'] / (1024**3),  # GB
                            'peak': memory_info['peak'] / (1024**3)  # GB
                        })
                    except Exception as e:
                        logger.warning(f"Could not get memory info for {gpu.name}: {e}")
                        gpu_info['memory_info'].append({
                            'device': gpu.name,
                            'current': None,
                            'peak': None
                        })
            else:
                logger.info("No GPUs detected. Training will use CPU.")
                
        except Exception as e:
            logger.warning(f"Error detecting GPUs: {e}")
            gpu_info['available'] = False
            
        return gpu_info
    
    @staticmethod
    def configure_gpu_memory(growth: bool = True, limit: Optional[float] = None) -> bool:
        """
        Configure GPU memory settings.
        
        Args:
            growth: Whether to enable memory growth (default: True)
            limit: Optional memory limit in GB (default: None)
            
        Returns:
            True if configuration was successful, False otherwise
        """
        try:
            gpus = tf.config.list_physical_devices('GPU')
            
            if not gpus:
                logger.info("No GPUs available for memory configuration")
                return False
            
            for gpu in gpus:
                try:
                    if growth:
                        tf.config.experimental.set_memory_growth(gpu, True)
                        logger.info(f"Enabled memory growth for {gpu.name}")
                    
                    if limit is not None:
                        memory_limit = int(limit * 1024)  # Convert GB to MB
                        tf.config.experimental.set_virtual_device_configuration(
                            gpu,
                            [tf.config.experimental.VirtualDeviceConfiguration(
                                memory_limit=memory_limit
                            )]
                        )
                        logger.info(f"Set memory limit to {limit} GB for {gpu.name}")
                        
                except Exception as e:
                    logger.warning(f"Failed to configure {gpu.name}: {e}")
                    continue
            
            return True
            
        except Exception as e:
            logger.error(f"Error configuring GPU memory: {e}")
            return False
    
    @staticmethod
    def get_system_memory() -> Dict[str, Optional[float]]:
        """
        Get system memory information.
        
        Returns:
            Dictionary with memory info in GB:
            - total: Total system memory
            - available: Available memory
            - used: Used memory
            - percent: Usage percentage
        """
        if not PSUTIL_AVAILABLE:
            logger.debug("psutil not available, cannot get system memory info")
            return {
                'total': None,
                'available': None,
                'used': None,
                'percent': None
            }
        
        try:
            memory = psutil.virtual_memory()
            return {
                'total': memory.total / (1024**3),  # GB
                'available': memory.available / (1024**3),  # GB
                'used': memory.used / (1024**3),  # GB
                'percent': memory.percent
            }
        except Exception as e:
            logger.warning(f"Error getting system memory: {e}")
            return {
                'total': None,
                'available': None,
                'used': None,
                'percent': None
            }
    
    @staticmethod
    def clear_memory():
        """
        Clear GPU and system memory by forcing garbage collection.
        """
        gc.collect()
        tf.keras.backend.clear_session()
        logger.debug("Memory cleared (garbage collection and Keras session cleared)")
    
    @staticmethod
    def log_memory_status():
        """
        Log current memory status (GPU and system).
        """
        # System memory
        sys_mem = GPUManager.get_system_memory()
        if sys_mem['total'] is not None:
            logger.info(
                f"System Memory: {sys_mem['used']:.2f} GB / {sys_mem['total']:.2f} GB "
                f"({sys_mem['percent']:.1f}% used)"
            )
        
        # GPU memory
        gpu_info = GPUManager.detect_gpus()
        if gpu_info['available']:
            for mem_info in gpu_info['memory_info']:
                if mem_info['current'] is not None:
                    logger.info(
                        f"GPU Memory ({mem_info['device']}): "
                        f"Current: {mem_info['current']:.2f} GB, "
                        f"Peak: {mem_info['peak']:.2f} GB"
                    )


class TrainingException(Exception):
    """Base exception for training-related errors."""
    pass


class DataValidationError(TrainingException):
    """Exception raised when training data validation fails."""
    pass


class ModelBuildError(TrainingException):
    """Exception raised when model building fails."""
    pass


class CheckpointError(TrainingException):
    """Exception raised when checkpoint operations fail."""
    pass


class MemoryError(TrainingException):
    """Exception raised when memory-related errors occur."""
    pass

