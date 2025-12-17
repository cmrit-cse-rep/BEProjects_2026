import React from 'react';
import { Html } from '@react-three/drei';
import { useAR } from '../../store/ar';

type AnnotationType = 'chamber' | 'valve' | 'vessel' | 'muscle';

interface Annotation {
  id: string;
  type: AnnotationType;
  title: string;
  description: string;
  position: [number, number, number];
}

interface ARAnnotationsProps {
  selectedAnnotationId: string | null;
  onAnnotationSelect: (annotation: Annotation | null) => void;
  showAllLabels: boolean;
}

interface AnnotationMarkerProps {
  annotation: Annotation;
  onClick: (annotation: Annotation) => void;
  isSelected: boolean;
  showAllLabels: boolean;
}

const AnnotationMarker: React.FC<AnnotationMarkerProps> = ({
  annotation,
  onClick,
  isSelected,
  showAllLabels,
}) => {
  const getMarkerColor = () => {
    switch (annotation.type) {
      case 'chamber': return 'bg-red-500';
      case 'valve': return 'bg-green-500';
      case 'vessel': return 'bg-blue-500';
      case 'muscle': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getMarkerIcon = () => {
    switch (annotation.type) {
      case 'chamber': return '🫀';
      case 'valve': return '🚪';
      case 'vessel': return '🩸';
      case 'muscle': return '💪';
      default: return '📍';
    }
  };

  return (
    <group position={annotation.position}>
      <Html
        transform
        occlude
        sprite
        distanceFactor={10}
        position={[0, 0, 0]}
      >
        <div className="relative">
          <button
            onClick={() => onClick(annotation)}
            className={`
              w-8 h-8 rounded-full ${getMarkerColor()}
              ${isSelected ? 'ring-4 ring-white' : ''}
              shadow-lg flex items-center justify-center
              text-white font-bold text-sm
              hover:scale-110 transition-transform
              cursor-pointer border-2 border-white
            `}
            aria-label={`Annotation: ${annotation.title}`}
          >
            <span className="text-xs">{getMarkerIcon()}</span>
          </button>

          {(showAllLabels || isSelected) && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-100 transition-opacity pointer-events-none">
              <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                {annotation.title}
              </div>
              <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};

export const ARAnnotations: React.FC<ARAnnotationsProps> = ({
  selectedAnnotationId,
  onAnnotationSelect,
  showAllLabels,
}) => {
  const { annotations, showAnnotations } = useAR();

  if (!showAnnotations || annotations.length === 0) {
    return null;
  }

  return (
    <>
      {annotations.map(annotation => (
        <AnnotationMarker
          key={annotation.id}
          annotation={annotation}
          onClick={onAnnotationSelect}
          isSelected={selectedAnnotationId === annotation.id}
          showAllLabels={showAllLabels}
        />
      ))}

      {selectedAnnotationId && (() => {
        const selected = annotations.find(a => a.id === selectedAnnotationId);
        if (!selected) return null;
        return (
          <Html position={[3, 2, 0]} transform={false} sprite={false}>
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900 text-sm">{selected.title}</h3>
                <button
                  onClick={() => onAnnotationSelect(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                  aria-label="Close annotation"
                >
                  ×
                </button>
              </div>

              <p className="text-gray-700 text-xs mb-3 leading-relaxed">{selected.description}</p>

              {/* Optional quiz or extra content can be added here */}
            </div>
          </Html>
        );
      })()}
    </>
  );
};
