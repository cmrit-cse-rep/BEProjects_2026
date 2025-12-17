import React from 'react';
import { RotateCcw, ZoomIn, ZoomOut, Eye, EyeOff, Maximize } from 'lucide-react';
import { useAR } from '../../store/ar';

export const ARControls: React.FC = () => {
  const {
    modelScale,
    setModelScale,
    resetModel,
    showAnnotations,
    toggleAnnotations,
    isARActive,
    startARSession,
    endARSession,
    isARSupported
  } = useAR();

  const handleZoomIn = () => {
    setModelScale(modelScale * 1.2);
  };

  const handleZoomOut = () => {
    setModelScale(modelScale * 0.8);
  };

  const handleToggleAR = async () => {
    if (isARActive) {
      endARSession();
    } else {
      await startARSession();
    }
  };

  return (
    <div className="absolute bottom-4 left-4 z-10 flex flex-col space-y-2">
      {/* Model Controls */}
      <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <div className="flex space-x-2">
          {/* Reset Model */}
          <button
            onClick={resetModel}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            title="Reset Model"
            aria-label="Reset model position and scale"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            disabled={modelScale >= 5}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom In"
            aria-label="Zoom in model"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            disabled={modelScale <= 0.1}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom Out"
            aria-label="Zoom out model"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          {/* Toggle Annotations */}
          <button
            onClick={toggleAnnotations}
            className={`p-2 rounded transition-colors ${
              showAnnotations 
                ? 'text-primary-600 bg-primary-100 hover:bg-primary-200' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title={showAnnotations ? "Hide Annotations" : "Show Annotations"}
            aria-label={showAnnotations ? "Hide annotations" : "Show annotations"}
          >
            {showAnnotations ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>

        {/* Scale Indicator */}
        <div className="mt-2 px-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Scale:</span>
            <span>{Math.round(modelScale * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
            <div
              className="bg-primary-600 h-1 rounded-full transition-all"
              style={{ width: `${Math.min((modelScale / 5) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* AR Toggle Button */}
      {isARSupported && (
        <button
          onClick={handleToggleAR}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg ${
            isARActive
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
          aria-label={isARActive ? "Exit AR mode" : "Enter AR mode"}
        >
          <div className="flex items-center space-x-2">
            <Maximize className="w-4 h-4" />
            <span>{isARActive ? 'Exit AR' : 'Enter AR'}</span>
          </div>
        </button>
      )}
    </div>
  );
};
