import React from 'react';
import { Eye, EyeOff, Layers, BookOpen, Award, RotateCcw, Target, TrendingUp } from 'lucide-react';

interface AnnotationControlsProps {
  showAllLabels: boolean;
  onToggleLabels: () => void;
  annotationLevel: 'basic' | 'intermediate' | 'advanced';
  onLevelChange: (level: 'basic' | 'intermediate' | 'advanced') => void;
  selectedCount: number;
  totalCount: number;
  onReset: () => void;
  visitedCount: number;
}

export const AnnotationControls: React.FC<AnnotationControlsProps> = ({
  showAllLabels,
  onToggleLabels,
  annotationLevel,
  onLevelChange,
  totalCount,
  onReset,
  visitedCount
}) => {
  const getLevelInfo = (level: string) => {
    switch (level) {
      case 'basic': 
        return { 
          icon: '🎯', 
          label: 'Basic', 
          description: 'Heart Chambers Only',
          color: 'bg-green-500',
          count: 4
        };
      case 'intermediate': 
        return { 
          icon: '📚', 
          label: 'Intermediate', 
          description: 'Chambers & Valves',
          color: 'bg-yellow-500',
          count: 6
        };
      case 'advanced': 
        return { 
          icon: '🎓', 
          label: 'Advanced', 
          description: 'Complete Anatomy',
          color: 'bg-red-500',
          count: 9
        };
      default: 
        return { 
          icon: '🎯', 
          label: 'Basic', 
          description: 'Heart Chambers',
          color: 'bg-green-500',
          count: 4
        };
    }
  };

  const currentLevel = getLevelInfo(annotationLevel);
  const progressPercentage = totalCount > 0 ? (visitedCount / totalCount) * 100 : 0;

  const progressBarStyle: React.CSSProperties = { 
    width: `${progressPercentage}%` 
  };

  return (
    <div className="absolute bottom-4 left-4 z-10 space-y-3">
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700 flex items-center">
            <Layers className="w-4 h-4 mr-2" />
            Learning Level
          </span>
          <div className={`w-3 h-3 rounded-full ${currentLevel.color}`}></div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-3">
          {(['basic', 'intermediate', 'advanced'] as const).map((level) => {
            const levelInfo = getLevelInfo(level);
            const isActive = annotationLevel === level;
            
            return (
              <button
                key={level}
                onClick={() => onLevelChange(level)}
                className={`p-3 rounded-lg text-xs font-medium transition-all transform hover:scale-105 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg ring-2 ring-primary-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={levelInfo.description}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">{levelInfo.icon}</div>
                  <div className="font-semibold">{levelInfo.label}</div>
                  <div className="text-xs opacity-75">{levelInfo.count} items</div>
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          {currentLevel.description}
        </div>
      </div>

      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700 flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Annotations
          </span>
          <div className="text-xs text-gray-500">
            {visitedCount}/{totalCount}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onToggleLabels}
            className={`p-3 rounded-lg transition-all transform hover:scale-105 ${
              showAllLabels
                ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={showAllLabels ? "Hide Labels" : "Show Labels"}
          >
            {showAllLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <button
            onClick={onReset}
            className="p-3 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-all transform hover:scale-105"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            className="p-3 bg-green-100 text-green-700 rounded-lg transition-all transform hover:scale-105 hover:bg-green-200"
            title="Study Mode"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Progress
          </span>
          <Award className="w-4 h-4 text-yellow-500" />
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className="bg-gradient-to-r from-primary-500 via-green-500 to-yellow-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={progressBarStyle}
          />
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600">
            {visitedCount} explored
          </span>
          <span className="font-semibold text-gray-700">
            {Math.round(progressPercentage)}%
          </span>
        </div>

        {progressPercentage >= 100 && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center space-x-1 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              <Award className="w-3 h-3" />
              <span>Level Complete!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
