import numpy as np
import pandas as pd
import os
import pickle
import h5py
from abc import ABC, abstractmethod
from sklearn.preprocessing import StandardScaler
from sklearn.utils import resample
from tqdm import tqdm
import warnings
warnings.filterwarnings('ignore')


class PhysiologicalDataProcessor(ABC):
    """
    Base class for physiological data processing
    
    Provides common functionality for:
    - Signal resampling and normalization
    - Window segmentation
    - Label mapping (binary/multi-class/regression)
    - Data augmentation
    - LOSO data preparation
    - Dataset balancing
    """
    
    def __init__(self, window_size=30, target_sample_rate=64, label_mapping=None, 
                 signal_type=None, feature_columns=None, label_column=None, 
                 subject_id_column=None, task_type='binary'):
        """
        Initialize physiological data processor
        
        Args:
            window_size: Window size in seconds
            target_sample_rate: Target sampling rate in Hz
            label_mapping: Dictionary mapping original labels to target labels
                          None = use identity mapping
            signal_type: Signal type(s) - single string or list for multi-channel
            feature_columns: List of feature column names (for CSV/DataFrame)
            label_column: Name of label column (for CSV/DataFrame)
            subject_id_column: Name of subject ID column (for CSV/DataFrame)
            task_type: Task type - 'binary', 'multiclass', or 'regression'
        """
        self.window_size = window_size
        self.target_sample_rate = target_sample_rate
        self.samples_per_window = int(window_size * target_sample_rate)
        self.label_mapping = label_mapping if label_mapping is not None else {}
        self.signal_type = signal_type
        self.feature_columns = feature_columns
        self.label_column = label_column
        self.subject_id_column = subject_id_column
        self.task_type = task_type
        
        # Determine input channels
        if isinstance(signal_type, list):
            self.input_channels = len(signal_type)
        elif signal_type is not None:
            self.input_channels = 1
        else:
            self.input_channels = 1  # Default to single channel
    
    @abstractmethod
    def load_data(self, dataset_path, subjects=None):
        """
        Load data from dataset
        
        Args:
            dataset_path: Path to dataset
            subjects: List of subject IDs to load (None for all)
            
        Returns:
            signals: List of signal windows (can be multi-channel)
            labels: List of corresponding labels
            subject_ids: List of subject IDs for each window
        """
        pass
    
    def apply_label_mapping(self, labels):
        """
        Apply label mapping to convert original labels to target labels
        
        Args:
            labels: Original labels (numpy array or list)
            
        Returns:
            mapped_labels: Mapped labels
        """
        labels = np.asarray(labels)
        
        if not self.label_mapping:
            # Identity mapping - return as is
            return labels
        
        mapped_labels = np.zeros_like(labels)
        for original_label, target_label in self.label_mapping.items():
            mask = labels == original_label
            mapped_labels[mask] = target_label
        
        # Handle unmapped labels
        unmapped_mask = ~np.isin(labels, list(self.label_mapping.keys()))
        if np.any(unmapped_mask):
            if self.task_type == 'regression':
                # For regression, use original value if unmapped
                mapped_labels[unmapped_mask] = labels[unmapped_mask]
            else:
                # For classification, default to 0 or first class
                mapped_labels[unmapped_mask] = 0
        
        return mapped_labels
    
    def _resample_signal(self, signal, original_rate, target_rate):
        """Resample signal to target rate"""
        if original_rate == target_rate:
            return signal
        
        # Simple resampling by interpolation
        original_time = np.arange(len(signal)) / original_rate
        target_time = np.arange(0, len(signal) / original_rate, 1/target_rate)
        
        # Ensure we don't exceed original signal length
        target_time = target_time[target_time < len(signal) / original_rate]
        
        # Linear interpolation
        resampled = np.interp(target_time, original_time, signal)
        return resampled
    
    def _resample_labels(self, labels, original_rate, target_rate):
        """Resample labels to match resampled signal"""
        if original_rate == target_rate:
            return labels
        
        # Simple resampling by interpolation
        original_time = np.arange(len(labels)) / original_rate
        target_time = np.arange(0, len(labels) / original_rate, 1/target_rate)
        
        # Ensure we don't exceed original labels length
        target_time = target_time[target_time < len(labels) / original_rate]
        
        # Nearest neighbor interpolation for labels
        resampled_indices = np.round(target_time * original_rate).astype(int)
        resampled_indices = np.clip(resampled_indices, 0, len(labels) - 1)
        resampled_labels = labels[resampled_indices]
        
        return resampled_labels

    def _resample_array_to_length(self, array, target_length, method='linear'):
        """Resample a 1D array to a specific length using interpolation."""
        array = np.asarray(array).squeeze()
        if len(array) == target_length:
            return array
        original_indices = np.arange(len(array))
        target_indices = np.linspace(0, len(array) - 1, num=target_length)
        if method == 'nearest':
            nearest_indices = np.round(target_indices).astype(int)
            nearest_indices = np.clip(nearest_indices, 0, len(array) - 1)
            return array[nearest_indices]
        else:
            return np.interp(target_indices, original_indices, array)
    
    def _segment_signal(self, signal, labels, window_overlap=0.0):
        """
        Segment signal into windows
        
        Args:
            signal: Signal array (can be 1D or 2D for multi-channel)
            labels: Label array
            window_overlap: Overlap ratio (0.0 = non-overlapping)
            
        Returns:
            windows: List of signal windows
            window_labels: List of window labels
        """
        windows = []
        window_labels = []
        
        # Handle multi-channel signals
        if signal.ndim == 2:
            signal_length = signal.shape[0]
        else:
            signal_length = len(signal)
        
        # Calculate step size based on overlap
        step_size = int(self.samples_per_window * (1 - window_overlap))
        if step_size < 1:
            step_size = 1
        
        # Calculate number of windows
        num_windows = (signal_length - self.samples_per_window) // step_size + 1
        
        for i in range(num_windows):
            start_idx = i * step_size
            end_idx = start_idx + self.samples_per_window
            
            if end_idx > signal_length:
                break
            
            if signal.ndim == 2:
                window = signal[start_idx:end_idx, :]
            else:
                window = signal[start_idx:end_idx]
            
            # Use majority label in window (for classification) or mean (for regression)
            window_label_slice = labels[start_idx:end_idx]
            if self.task_type == 'regression':
                window_label = np.mean(window_label_slice)
            else:
                window_label = np.argmax(np.bincount(window_label_slice.astype(int)))
            
            windows.append(window)
            window_labels.append(window_label)
        
        return windows, window_labels
    
    def _normalize_window(self, window, normalization='z-score'):
        """
        Apply normalization to a single window
        
        Args:
            window: Signal window (1D or 2D)
            normalization: Normalization method ('z-score', 'min-max', 'robust')
            
        Returns:
            normalized_window: Normalized window
        """
        window = np.asarray(window)
        
        if normalization == 'z-score':
            if window.ndim == 2:
                # Multi-channel: normalize each channel independently
                normalized = np.zeros_like(window)
                for ch in range(window.shape[1]):
                    channel = window[:, ch]
                    mean = np.mean(channel)
                    std = np.std(channel)
                    if std == 0:
                        normalized[:, ch] = channel - mean
                    else:
                        normalized[:, ch] = (channel - mean) / std
                return normalized
            else:
                # Single channel
                mean = np.mean(window)
                std = np.std(window)
                if std == 0:
                    return window - mean
                return (window - mean) / std
        
        elif normalization == 'min-max':
            if window.ndim == 2:
                normalized = np.zeros_like(window)
                for ch in range(window.shape[1]):
                    channel = window[:, ch]
                    min_val = np.min(channel)
                    max_val = np.max(channel)
                    if max_val == min_val:
                        normalized[:, ch] = channel - min_val
                    else:
                        normalized[:, ch] = (channel - min_val) / (max_val - min_val)
                return normalized
            else:
                min_val = np.min(window)
                max_val = np.max(window)
                if max_val == min_val:
                    return window - min_val
                return (window - min_val) / (max_val - min_val)
        
        elif normalization == 'robust':
            if window.ndim == 2:
                normalized = np.zeros_like(window)
                for ch in range(window.shape[1]):
                    channel = window[:, ch]
                    median = np.median(channel)
                    q75, q25 = np.percentile(channel, [75, 25])
                    iqr = q75 - q25
                    if iqr == 0:
                        normalized[:, ch] = channel - median
                    else:
                        normalized[:, ch] = (channel - median) / iqr
                return normalized
            else:
                median = np.median(window)
                q75, q25 = np.percentile(window, [75, 25])
                iqr = q75 - q25
                if iqr == 0:
                    return window - median
                return (window - median) / iqr
        
        else:
            return window
    
    def apply_teanet_augmentation(self, signals, labels, subject_ids, 
                                 train_subjects, test_subjects, step_size_d=None):
        """
        Apply TEANet's sliding overlapping window augmentation
        
        Args:
            signals: List of signal windows
            labels: List of corresponding labels
            subject_ids: List of subject IDs
            train_subjects: List of training subject IDs
            test_subjects: List of test subject IDs
            step_size_d: Step size for augmentation (if None, computed as per equation 1)
            
        Returns:
            augmented_train_signals: Augmented training signals
            augmented_train_labels: Augmented training labels
            test_signals: Test signals (no augmentation)
            test_labels: Test labels
        """
        print("Applying TEANet augmentation...")
        
        # Separate training and test data
        train_mask = [sid in train_subjects for sid in subject_ids]
        test_mask = [sid in test_subjects for sid in subject_ids]
        
        train_signals = [signals[i] for i in range(len(signals)) if train_mask[i]]
        train_labels = [labels[i] for i in range(len(labels)) if train_mask[i]]
        test_signals = [signals[i] for i in range(len(signals)) if test_mask[i]]
        test_labels = [labels[i] for i in range(len(labels)) if test_mask[i]]
        
        print(f"Training set: {len(train_signals)} samples")
        print(f"Test set: {len(test_signals)} samples")
        
        # Compute step size d if not provided (equation 1 from TEANet)
        if step_size_d is None:
            step_size_d = max(1, self.samples_per_window // 4)
        
        print(f"Augmentation step size d: {step_size_d}")
        
        # Apply augmentation only to training set
        augmented_train_signals = []
        augmented_train_labels = []
        
        for signal, label in zip(train_signals, train_labels):
            # Add original signal
            augmented_train_signals.append(signal)
            augmented_train_labels.append(label)
            
            # Apply sliding window augmentation for minority class (stress) or all classes
            if self.task_type == 'binary' and label == 1:  # Stress class for binary
                # Generate augmented samples by circularly shifting
                signal_array = np.asarray(signal)
                for shift in range(step_size_d, self.samples_per_window, step_size_d):
                    if signal_array.ndim == 2:
                        augmented_window = np.roll(signal_array, -shift, axis=0)
                    else:
                        augmented_window = np.roll(signal_array, -shift)
                    if len(augmented_window) == self.samples_per_window:
                        augmented_train_signals.append(augmented_window.tolist())
                        augmented_train_labels.append(label)
            elif self.task_type == 'multiclass':
                # Augment all classes
                signal_array = np.asarray(signal)
                for shift in range(step_size_d, self.samples_per_window, step_size_d):
                    if signal_array.ndim == 2:
                        augmented_window = np.roll(signal_array, -shift, axis=0)
                    else:
                        augmented_window = np.roll(signal_array, -shift)
                    if len(augmented_window) == self.samples_per_window:
                        augmented_train_signals.append(augmented_window.tolist())
                        augmented_train_labels.append(label)
        
        print(f"After augmentation - Training set: {len(augmented_train_signals)} samples")
        if self.task_type != 'regression':
            print(f"Class distribution: {np.bincount(augmented_train_labels)}")
        
        return augmented_train_signals, augmented_train_labels, test_signals, test_labels
    
    def prepare_loso_data(self, signals, labels, subject_ids):
        """
        Prepare data for Leave-One-Subject-Out (LOSO) cross-validation
        
        Returns:
            subject_data: Dictionary mapping subject ID to (signals, labels)
        """
        subject_data = {}
        unique_subjects = list(set(subject_ids))
        
        for subject in unique_subjects:
            subject_mask = [sid == subject for sid in subject_ids]
            subject_signals = [signals[i] for i in range(len(signals)) if subject_mask[i]]
            subject_labels = [labels[i] for i in range(len(labels)) if subject_mask[i]]
            subject_data[subject] = (subject_signals, subject_labels)
        
        return subject_data
    
    def balance_dataset(self, signals, labels, subject_ids, method='undersample'):
        """
        Balance the dataset to handle class imbalance
        
        Args:
            signals: List of signal windows
            labels: List of corresponding labels
            subject_ids: List of subject IDs
            method: Balancing method ('undersample', 'oversample')
            
        Returns:
            balanced_signals: Balanced signals
            balanced_labels: Balanced labels
            balanced_subject_ids: Balanced subject IDs
        """
        if self.task_type == 'regression':
            # No balancing for regression tasks
            return signals, labels, subject_ids
        
        print(f"Balancing dataset using {method} method...")
        
        # Convert to numpy arrays for easier manipulation
        signals_array = np.array(signals)
        labels_array = np.array(labels)
        subject_ids_array = np.array(subject_ids)
        
        # Get class counts
        unique_labels, counts = np.unique(labels_array, return_counts=True)
        print(f"Original class distribution: {dict(zip(unique_labels, counts))}")
        
        if method == 'undersample':
            min_count = np.min(counts)
            balanced_signals = []
            balanced_labels = []
            balanced_subject_ids = []
            
            for label in unique_labels:
                label_indices = np.where(labels_array == label)[0]
                selected_indices = np.random.choice(label_indices, min_count, replace=False)
                
                balanced_signals.extend(signals_array[selected_indices])
                balanced_labels.extend(labels_array[selected_indices])
                balanced_subject_ids.extend(subject_ids_array[selected_indices])
        
        elif method == 'oversample':
            max_count = np.max(counts)
            balanced_signals = []
            balanced_labels = []
            balanced_subject_ids = []
            
            for label in unique_labels:
                label_indices = np.where(labels_array == label)[0]
                current_count = len(label_indices)
                
                if current_count < max_count:
                    repeat_times = max_count // current_count
                    remainder = max_count % current_count
                    
                    for _ in range(repeat_times):
                        balanced_signals.extend(signals_array[label_indices])
                        balanced_labels.extend(labels_array[label_indices])
                        balanced_subject_ids.extend(subject_ids_array[label_indices])
                    
                    if remainder > 0:
                        additional_indices = np.random.choice(label_indices, remainder, replace=False)
                        balanced_signals.extend(signals_array[additional_indices])
                        balanced_labels.extend(labels_array[additional_indices])
                        balanced_subject_ids.extend(subject_ids_array[additional_indices])
                else:
                    balanced_signals.extend(signals_array[label_indices])
                    balanced_labels.extend(labels_array[label_indices])
                    balanced_subject_ids.extend(subject_ids_array[label_indices])
        
        else:
            return signals, labels, subject_ids
        
        # Convert back to lists
        balanced_signals = [s.tolist() if isinstance(s, np.ndarray) else s for s in balanced_signals]
        balanced_labels = [l.tolist() if isinstance(l, np.ndarray) else l for l in balanced_labels]
        balanced_subject_ids = [s.tolist() if isinstance(s, np.ndarray) else s for s in balanced_subject_ids]
        
        final_labels, final_counts = np.unique(balanced_labels, return_counts=True)
        print(f"Balanced class distribution: {dict(zip(final_labels, final_counts))}")
        
        return balanced_signals, balanced_labels, balanced_subject_ids


class WESADDataLoader(PhysiologicalDataProcessor):
    """
    Data loader for WESAD dataset (pickle format)
    """
    
    def __init__(self, window_size=30, target_sample_rate=64, label_mapping=None, 
                 signal_type='BVP', task_type='binary'):
        """
        Initialize WESAD data loader
        
        Args:
            window_size: Window size in seconds
            target_sample_rate: Target sampling rate in Hz
            label_mapping: Dictionary mapping WESAD labels to target labels
            signal_type: Signal type(s) to load - 'BVP', 'EDA', 'TEMP', or list
            task_type: Task type - 'binary', 'multiclass', or 'regression'
        """
        super().__init__(window_size, target_sample_rate, label_mapping, 
                        signal_type, task_type=task_type)
        
        # Default WESAD label mapping if not provided
        if label_mapping is None and task_type == 'binary':
            self.label_mapping = {
                0: 0,  # undefined/transition -> normal
                1: 0,  # baseline -> normal
                2: 1,  # stress -> stress
                3: 0,  # amusement -> normal
                4: 0,  # meditation -> normal
            }
    
    def load_data(self, dataset_path="WESAD", subjects=None):
        """
        Load data from WESAD dataset
        
        Args:
            dataset_path: Path to WESAD dataset directory
            subjects: List of subject IDs to load (None for all)
            
        Returns:
            signals: List of signal windows
            labels: List of corresponding labels
            subject_ids: List of subject IDs for each window
        """
        if subjects is None:
            subjects = [f"S{i}" for i in range(2, 18)]
        
        signals = []
        labels = []
        subject_ids = []
        
        print(f"Loading WESAD dataset from {dataset_path}")
        print(f"Target subjects: {subjects}")
        print(f"Signal type(s): {self.signal_type}")
        
        for subject in tqdm(subjects, desc="Loading subjects"):
            subject_path = os.path.join(dataset_path, subject)
            if not os.path.exists(subject_path):
                print(f"Warning: Subject {subject} not found, skipping")
                continue
            
            subject_data = self._load_subject_data(subject_path)
            if subject_data is None:
                continue
            
            subject_signals, subject_labels = self._process_subject_signals(subject_data)
            
            if len(subject_signals) > 0:
                signals.extend(subject_signals)
                labels.extend(subject_labels)
                subject_ids.extend([subject] * len(subject_signals))
        
        print(f"Loaded {len(signals)} signal windows from {len(set(subject_ids))} subjects")
        if self.task_type != 'regression':
            print(f"Class distribution: {np.bincount(labels)}")
        
        return signals, labels, subject_ids
    
    def _load_subject_data(self, subject_path):
        """Load subject data from pickle file"""
        try:
            pickle_files = [f for f in os.listdir(subject_path) if f.endswith('.pkl')]
            if not pickle_files:
                print(f"No pickle file found for {subject_path}")
                return None
            
            pickle_file = os.path.join(subject_path, pickle_files[0])
            with open(pickle_file, 'rb') as f:
                data = pickle.load(f, encoding='latin1')
            return data
        except Exception as e:
            print(f"Error loading {subject_path}: {e}")
            return None
    
    def _process_subject_signals(self, subject_data):
        """Process signals for a single subject"""
        try:
            # Determine signal types to load
            if isinstance(self.signal_type, list):
                signal_types = self.signal_type
            else:
                signal_types = [self.signal_type]
            
            # Extract signals from wrist sensor
            signals_data = []
            for sig_type in signal_types:
                sig_data = self._extract_signal(subject_data, sig_type)
                if sig_data is None:
                    print(f"Warning: {sig_type} signal not found")
                    return [], []
                signals_data.append(sig_data)
            
            # Stack signals if multi-channel
            if len(signals_data) > 1:
                # Align lengths
                min_length = min(len(s) for s in signals_data)
                signals_data = [s[:min_length] for s in signals_data]
                signal_data = np.column_stack(signals_data)
            else:
                signal_data = signals_data[0]
            
            # Extract labels
            labels_data = self._extract_labels(subject_data)
            if labels_data is None:
                print("No labels found")
                return [], []
            
            # Ensure numpy arrays
            signal_data = np.asarray(signal_data).squeeze()
            labels_data = np.asarray(labels_data).squeeze()
            
            # Resample to target sample rate
            bvp_original_rate = 64
            label_original_rate = 700
            
            if signal_data.ndim == 2:
                # Multi-channel: resample each channel
                resampled_channels = []
                for ch in range(signal_data.shape[1]):
                    channel = signal_data[:, ch]
                    if bvp_original_rate != self.target_sample_rate:
                        channel = self._resample_signal(channel, bvp_original_rate, self.target_sample_rate)
                    resampled_channels.append(channel)
                signal_data = np.column_stack(resampled_channels)
            else:
                if bvp_original_rate != self.target_sample_rate:
                    signal_data = self._resample_signal(signal_data, bvp_original_rate, self.target_sample_rate)
            
            # Align labels
            if len(labels_data) != len(signal_data):
                try:
                    labels_data = self._resample_labels(labels_data, label_original_rate, self.target_sample_rate)
                except Exception:
                    labels_data = self._resample_array_to_length(labels_data, len(signal_data), method='nearest')
            
            # Segment into windows
            windows, window_labels = self._segment_signal(signal_data, labels_data)
            
            # Apply normalization
            normalized_windows = []
            for window in windows:
                if (signal_data.ndim == 2 and window.shape[0] == self.samples_per_window) or \
                   (signal_data.ndim == 1 and len(window) == self.samples_per_window):
                    normalized_window = self._normalize_window(window, normalization='z-score')
                    normalized_windows.append(normalized_window)
            
            # Apply label mapping
            mapped_labels = self.apply_label_mapping(window_labels)
            
            return normalized_windows, mapped_labels.tolist()
            
        except Exception as e:
            print(f"Error processing subject signals: {e}")
            import traceback
            traceback.print_exc()
            return [], []
    
    def _extract_signal(self, subject_data, signal_type):
        """Extract signal of specified type from subject data"""
        # Preferred structure: subject_data['signal']['wrist'][signal_type]
        if (isinstance(subject_data, dict) and 'signal' in subject_data and
            isinstance(subject_data['signal'], dict) and 'wrist' in subject_data['signal'] and
            isinstance(subject_data['signal']['wrist'], dict) and signal_type in subject_data['signal']['wrist']):
            return subject_data['signal']['wrist'][signal_type]
        elif 'wrist' in subject_data and isinstance(subject_data['wrist'], dict) and signal_type in subject_data['wrist']:
            return subject_data['wrist'][signal_type]
        return None
    
    def _extract_labels(self, subject_data):
        """Extract labels from subject data"""
        if 'label' in subject_data:
            return subject_data['label']
        elif ('signal' in subject_data and 'wrist' in subject_data['signal'] and
              'label' in subject_data['signal']['wrist']):
            return subject_data['signal']['wrist']['label']
        elif 'wrist' in subject_data and 'label' in subject_data['wrist']:
            return subject_data['wrist']['label']
        return None


class CSVDataLoader(PhysiologicalDataProcessor):
    """
    Data loader for CSV/DataFrame datasets
    """
    
    def load_data(self, dataset_path, subjects=None):
        """
        Load data from CSV file(s)
        
        Args:
            dataset_path: Path to CSV file or directory containing CSV files
            subjects: List of subject IDs to load (None for all)
            
        Returns:
            signals: List of signal windows
            labels: List of corresponding labels
            subject_ids: List of subject IDs for each window
        """
        print(f"Loading CSV dataset from {dataset_path}")
        
        # Load CSV file(s)
        if os.path.isfile(dataset_path):
            df = pd.read_csv(dataset_path)
        elif os.path.isdir(dataset_path):
            # Load all CSV files in directory
            csv_files = [f for f in os.listdir(dataset_path) if f.endswith('.csv')]
            if not csv_files:
                raise ValueError(f"No CSV files found in {dataset_path}")
            dfs = [pd.read_csv(os.path.join(dataset_path, f)) for f in csv_files]
            df = pd.concat(dfs, ignore_index=True)
        else:
            raise ValueError(f"Dataset path not found: {dataset_path}")
        
        # Auto-detect columns if not specified
        if self.feature_columns is None:
            # Try to auto-detect feature columns (exclude label and subject ID columns)
            exclude_cols = []
            if self.label_column:
                exclude_cols.append(self.label_column)
            if self.subject_id_column:
                exclude_cols.append(self.subject_id_column)
            
            # Common patterns for feature columns
            feature_cols = [col for col in df.columns if col not in exclude_cols and 
                          not col.lower() in ['label', 'subject', 'subject_id', 'id', 'timestamp', 'time']]
            self.feature_columns = feature_cols
        
        if self.label_column is None:
            # Try to auto-detect label column
            label_candidates = [col for col in df.columns if 'label' in col.lower()]
            if label_candidates:
                self.label_column = label_candidates[0]
            else:
                raise ValueError("Label column not specified and cannot be auto-detected")
        
        if self.subject_id_column is None:
            # Try to auto-detect subject ID column
            subject_candidates = [col for col in df.columns if 'subject' in col.lower() or 'id' in col.lower()]
            if subject_candidates:
                self.subject_id_column = subject_candidates[0]
            else:
                # Create dummy subject IDs
                df['_subject_id'] = 'S1'
                self.subject_id_column = '_subject_id'
        
        # Filter by subjects if specified
        if subjects is not None:
            df = df[df[self.subject_id_column].isin(subjects)]
        
        # Extract signals and labels
        signals = []
        labels = []
        subject_ids = []
        
        # Group by subject
        for subject_id, group in tqdm(df.groupby(self.subject_id_column), desc="Processing subjects"):
            # Extract feature columns
            feature_data = group[self.feature_columns].values
            
            # Extract labels
            label_data = group[self.label_column].values
            
            # Resample if needed (assuming data is already at correct rate or needs resampling)
            # For CSV, we assume data is already segmented or needs to be segmented
            
            # Segment into windows
            windows, window_labels = self._segment_signal(feature_data, label_data)
            
            # Normalize windows
            normalized_windows = []
            for window in windows:
                normalized_window = self._normalize_window(window, normalization='z-score')
                normalized_windows.append(normalized_window)
            
            # Apply label mapping
            mapped_labels = self.apply_label_mapping(window_labels)
            
            signals.extend(normalized_windows)
            labels.extend(mapped_labels.tolist())
            subject_ids.extend([subject_id] * len(normalized_windows))
        
        print(f"Loaded {len(signals)} signal windows from {len(set(subject_ids))} subjects")
        if self.task_type != 'regression':
            print(f"Class distribution: {np.bincount(labels)}")
        
        return signals, labels, subject_ids


class HDF5DataLoader(PhysiologicalDataProcessor):
    """
    Data loader for HDF5 datasets
    """
    
    def load_data(self, dataset_path, subjects=None):
        """
        Load data from HDF5 file
        
        Args:
            dataset_path: Path to HDF5 file
            subjects: List of subject IDs to load (None for all)
            
        Returns:
            signals: List of signal windows
            labels: List of corresponding labels
            subject_ids: List of subject IDs for each window
        """
        print(f"Loading HDF5 dataset from {dataset_path}")
        
        signals = []
        labels = []
        subject_ids = []
        
        with h5py.File(dataset_path, 'r') as f:
            # Determine structure - could be organized by subjects or flat
            if 'subjects' in f.keys():
                subject_keys = list(f['subjects'].keys())
            elif 'data' in f.keys():
                # Flat structure - assume all data is for one subject or has subject IDs
                subject_keys = ['all']
            else:
                # Try to find subject-like keys
                subject_keys = [key for key in f.keys() if 'subject' in key.lower() or 'S' in key]
                if not subject_keys:
                    subject_keys = ['all']
            
            # Filter subjects if specified
            if subjects is not None:
                subject_keys = [s for s in subject_keys if s in subjects]
            
            for subject_key in tqdm(subject_keys, desc="Loading subjects"):
                # Extract data for this subject
                if 'subjects' in f.keys():
                    subject_group = f['subjects'][subject_key]
                else:
                    subject_group = f
                
                # Extract signals
                if 'signals' in subject_group.keys():
                    signal_data = subject_group['signals'][:]
                elif 'data' in subject_group.keys():
                    signal_data = subject_group['data'][:]
                else:
                    # Try to find signal-like keys
                    signal_keys = [key for key in subject_group.keys() if 'signal' in key.lower() or 
                                  key in (self.feature_columns or [])]
                    if signal_keys:
                        if len(signal_keys) == 1:
                            signal_data = subject_group[signal_keys[0]][:]
                        else:
                            # Multi-channel
                            signal_arrays = [subject_group[key][:] for key in signal_keys]
                            signal_data = np.column_stack(signal_arrays)
                    else:
                        print(f"Warning: No signal data found for {subject_key}")
                        continue
                
                # Extract labels
                if 'labels' in subject_group.keys():
                    label_data = subject_group['labels'][:]
                elif 'label' in subject_group.keys():
                    label_data = subject_group['label'][:]
                else:
                    print(f"Warning: No labels found for {subject_key}")
                    continue
                
                # Resample if needed
                # Assume data might need resampling - this would need to be configured
                
                # Segment into windows
                windows, window_labels = self._segment_signal(signal_data, label_data)
                
                # Normalize windows
                normalized_windows = []
                for window in windows:
                    normalized_window = self._normalize_window(window, normalization='z-score')
                    normalized_windows.append(normalized_window)
                
                # Apply label mapping
                mapped_labels = self.apply_label_mapping(window_labels)
                
                signals.extend(normalized_windows)
                labels.extend(mapped_labels.tolist())
                subject_ids.extend([subject_key] * len(normalized_windows))
        
        print(f"Loaded {len(signals)} signal windows from {len(set(subject_ids))} subjects")
        if self.task_type != 'regression':
            print(f"Class distribution: {np.bincount(labels)}")
        
        return signals, labels, subject_ids


def create_data_loader(config):
    """
    Factory function to create appropriate data loader based on config
    
    Args:
        config: Configuration dictionary
        
    Returns:
        data_loader: Appropriate data loader instance
    """
    dataset_config = config.get('dataset', {})
    format_type = dataset_config.get('format', 'pickle')
    window_size = dataset_config.get('window_size_seconds', 30)
    sampling_rate = dataset_config.get('sampling_rate', 64)
    label_mapping = dataset_config.get('label_mapping', None)
    signal_type = dataset_config.get('signal_type', 'BVP')
    feature_columns = dataset_config.get('feature_columns', None)
    label_column = dataset_config.get('label_column', None)
    subject_id_column = dataset_config.get('subject_id_column', None)
    
    # Determine task type from model config
    model_config = config.get('model', {})
    num_classes = model_config.get('num_classes', 2)
    if num_classes == 1:
        task_type = 'regression'
    elif num_classes == 2:
        task_type = 'binary'
    else:
        task_type = 'multiclass'
    
    if format_type == 'pickle' or format_type == 'wesad':
        return WESADDataLoader(
            window_size=window_size,
            target_sample_rate=sampling_rate,
            label_mapping=label_mapping,
            signal_type=signal_type,
            task_type=task_type
        )
    elif format_type == 'csv':
        return CSVDataLoader(
            window_size=window_size,
            target_sample_rate=sampling_rate,
            label_mapping=label_mapping,
            signal_type=signal_type,
            feature_columns=feature_columns,
            label_column=label_column,
            subject_id_column=subject_id_column,
            task_type=task_type
        )
    elif format_type == 'hdf5':
        return HDF5DataLoader(
            window_size=window_size,
            target_sample_rate=sampling_rate,
            label_mapping=label_mapping,
            signal_type=signal_type,
            feature_columns=feature_columns,
            label_column=label_column,
            subject_id_column=subject_id_column,
            task_type=task_type
        )
    else:
        raise ValueError(f"Unsupported dataset format: {format_type}")


# Backward compatibility alias
WESADDataProcessor = WESADDataLoader
