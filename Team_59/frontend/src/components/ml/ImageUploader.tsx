import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle, ScanSearch } from 'lucide-react';
import { predictMedicalImage } from '../../services/api';

// Enable hybrid model only if environment variable is set to true OR running on localhost
const enableHybridModel =
  import.meta.env.VITE_ENABLE_HYBRID_MODEL === 'true' ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

interface ImageUploaderProps {
  onPrediction: (result: any) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onPrediction }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelType, setModelType] = useState<'mobilenetv2' | 'hybrid_cnn_vit'>('mobilenetv2');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    processFile(file);
  };

  const processFile = (file?: File) => {
    setError(null);
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file (JPG, PNG).');
        return;
      }
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      setError("No file selected.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Only allow hybrid model in local mode
      const usedModelType =
        modelType === "hybrid_cnn_vit" && !enableHybridModel
          ? "mobilenetv2"
          : modelType;
      const predictionResult = await predictMedicalImage(selectedImage, usedModelType, true);
      onPrediction(predictionResult);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to analyze image. Please check your backend connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Model Selector Dropdown */}
      <div className="flex w-full items-center mb-3">
        <label
          htmlFor="model-select"
          className="text-sm font-medium text-gray-300 flex-shrink-0 mr-3"
        >
          Model:
        </label>
        <select
          id="model-select"
          value={modelType}
          onChange={(e) =>
            setModelType(e.target.value as 'mobilenetv2' | 'hybrid_cnn_vit')
          }
          disabled={isLoading}
          className="bg-gray-800 text-gray-100 p-2 rounded border border-gray-700 focus:border-purple-400 transition w-full"
        >
          <option value="mobilenetv2">MobileNetV2 (Fast)</option>
          {enableHybridModel && (
            <option value="hybrid_cnn_vit">Hybrid CNN-ViT (Advanced, local only)</option>
          )}
        </select>
      </div>

      {/* Hidden Native Input */}
      <input
        id="image-upload"
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
        aria-label="Upload medical image file"
      />

      {!selectedImage ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-600 rounded-2xl bg-gray-800/50 hover:bg-gray-800 transition-all cursor-pointer hover:border-purple-500/50"
          role="button"
          tabIndex={0}
          aria-label="Click or drag to upload an image"
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
            <div className="p-4 bg-gray-700/50 rounded-full mb-4 group-hover:bg-purple-500/20 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 group-hover:text-purple-400 transition-colors" />
            </div>
            <p className="mb-2 text-sm text-gray-300 font-medium">
              <span className="text-purple-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              SVG, PNG, JPG or GIF (MAX. 800x400px)
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="relative w-full h-64 bg-black/40 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center group">
            <img
              src={previewUrl!}
              alt="Preview"
              className="max-h-full max-w-full object-contain"
            />
            <button
              onClick={clearImage}
              disabled={isLoading}
              className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-500/80 text-white rounded-full backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Remove image"
              aria-label="Remove selected image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between px-2 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span className="truncate max-w-[150px]">{selectedImage.name}</span>
            </div>
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded">
              {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
          <button
            onClick={handleUpload}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isLoading ? "Running Neural Network..." : "Run Diagnosis"}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Running Neural Network...
              </>
            ) : (
              <>
                <ScanSearch className="w-5 h-5" />
                Run Diagnosis
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-200 text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
