import React, { useState, useEffect, useRef } from 'react';
import { ARScene, type ARSceneRef } from '../components/ar/ARScene';
import { ARAnnotations } from '../components/ar/ARAnnotations';
import { AIAssistant } from '../components/ai/AIAssistant';

import {
  Box, Brain, Heart, Wind, Activity, Layers,
  Menu, X, ChevronRight, RotateCcw, GripHorizontal,
  Minus, SlidersHorizontal, Scissors, Droplet,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Crosshair
} from 'lucide-react';

const getModelIcon = (id: string) => {
  switch (id) {
    case 'heart': return <Heart className="w-5 h-5" />;
    case 'brain': return <Brain className="w-5 h-5" />;
    case 'lungs': return <Wind className="w-5 h-5" />;
    case 'kidney': return <Activity className="w-5 h-5" />;
    default: return <Box className="w-5 h-5" />;
  }
};

const BLOB_BASE_URL = 'https://sniqhfp9xi52lvz6.public.blob.vercel-storage.com/';

const anatomicalModels = [
  { id: 'heart', label: 'Heart', modelPath: BLOB_BASE_URL + 'heart.glb', annotationLevels: ['basic', 'intermediate', 'advanced'] },
  { id: 'brain', label: 'Brain', modelPath: BLOB_BASE_URL + 'human-brain.glb', annotationLevels: ['basic', 'intermediate'] },
  { id: 'lungs', label: 'Lungs', modelPath: BLOB_BASE_URL + 'realistic_human_lungs.glb', annotationLevels: ['basic', 'advanced'] },
  { id: 'kidney', label: 'Kidneys', modelPath: BLOB_BASE_URL + 'kidney.glb', annotationLevels: ['basic'] },
  { id: 'intestine', label: 'Intestines', modelPath: BLOB_BASE_URL + 'small_and_large_intestine.glb', annotationLevels: ['basic', 'intermediate'] },
];

export const ARLearningPage: React.FC = () => {
  const [selectedModelId, setSelectedModelId] = useState('heart');
  const [annotationLevel, setAnnotationLevel] = useState<'basic' | 'intermediate' | 'advanced'>('basic');
  // showAllLabels state removed or set to false permanently if no longer needed by user interaction
  const [showAllLabels, setShowAllLabels] = useState(false); 
  const [isolateParts, setIsolateParts] = useState<string[]>([]);
  const [transparencyToggled, setTransparencyToggled] = useState<string[]>([]);
  const [sliceValue, setSliceValue] = useState(0);
  const [opacityValue, setOpacityValue] = useState(100);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const panelStartPos = useRef({ x: 0, y: 0 });

  const sceneRef = useRef<ARSceneRef>(null);

  const selectedModel = anatomicalModels.find(m => m.id === selectedModelId);

  useEffect(() => {
    setAnnotationLevel('basic');
    setShowAllLabels(false);
    setIsolateParts([]);
    setTransparencyToggled([]);
    setSliceValue(0);
    setOpacityValue(100);
    if (sceneRef.current) sceneRef.current.resetCamera();
  }, [selectedModelId]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      setPanelPosition({
        x: panelStartPos.current.x + dx,
        y: panelStartPos.current.y + dy,
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const startDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    panelStartPos.current = { ...panelPosition };
  };

  const handleReset = () => {
    setShowAllLabels(false);
    setIsolateParts([]);
    setTransparencyToggled([]);
    setSliceValue(0);
    setOpacityValue(100);
    if (sceneRef.current) sceneRef.current.resetCamera();
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* --- AI Assistant --- */}
      {selectedModel && <AIAssistant currentModelName={selectedModel.label} />}

      {/* Main 3D Scene - fits all screens */}
      <div className="absolute inset-0 z-0">
        {selectedModel ? (
          <ARScene
            ref={sceneRef}
            modelPath={selectedModel.modelPath}
            className="w-full h-full"
            enableControls={true}
            annotationLevel={annotationLevel}
            isolateParts={isolateParts}
            transparencyToggled={transparencyToggled}
            sliceValue={sliceValue}
            opacityValue={opacityValue}
            showAllLabels={showAllLabels}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">Model not found</div>
        )}
        {/* Overlay annotations */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <ARAnnotations selectedAnnotationId={null} onAnnotationSelect={() => {}} showAllLabels={showAllLabels} />
        </div>
      </div>

      {/* Responsive header (toolbar) */}
      <header className="absolute top-0 left-0 right-0 z-20 p-2 sm:p-4 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-black/50 backdrop-blur-md text-white rounded-lg hover:bg-purple-600 transition-colors border border-white/10 shadow-lg"
            title="Toggle Sidebar"
            aria-label="Toggle Sidebar"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        <div className="pointer-events-auto flex gap-1 sm:gap-2">
          <button onClick={handleReset}
            className="bg-black/60 backdrop-blur-md text-white p-2 rounded-lg border border-white/10 hover:bg-red-900/50 transition-colors shadow-lg"
            title="Reset View" aria-label="Reset View"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          {!isRightPanelOpen && (
            <button onClick={() => setIsRightPanelOpen(true)}
              className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
              title="Open Tools" aria-label="Open Tools"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Responsive sidebar */}
      <aside className={`absolute top-14 left-2 md:left-4 bottom-2 md:bottom-4 w-11/12 sm:w-64 z-20 transition-transform duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
        <div className="bg-black/75 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4 h-full overflow-y-auto shadow-2xl text-white flex flex-col">
          <h2 className="text-xs sm:text-sm uppercase tracking-wider text-gray-400 font-bold mb-3 sm:mb-4">Systems</h2>
          <div className="space-y-2 flex-1">
            {anatomicalModels.map(model => (
              <button
                key={model.id}
                onClick={() => setSelectedModelId(model.id)}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 border text-left
                  ${selectedModelId === model.id ? 'bg-purple-600/90 border-purple-500 shadow-lg' :
                    'bg-white/5 border-transparent hover:bg-white/10'}`}
                aria-label={`Select ${model.label}`}
              >
                <span className={selectedModelId === model.id ? 'text-white' : 'text-purple-400'}>
                  {getModelIcon(model.id)}
                </span>
                <span className="font-medium truncate">{model.label}</span>
                {selectedModelId === model.id && (
                  <ChevronRight className="w-4 h-4 ml-auto opacity-75" />
                )}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Responsive tool panel - draggable, min width for mobile */}
      {selectedModel && isRightPanelOpen && (
        <div
          style={{ transform: `translate(${panelPosition.x}px, ${panelPosition.y}px)` }}
          className="absolute top-14 right-2 md:right-4 w-11/12 sm:w-80 z-30 flex flex-col bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl text-white max-h-[calc(100vh-6rem)]"
        >
          <div
            onMouseDown={startDrag}
            className="flex items-center justify-between p-2 sm:p-3 border-b border-white/10 cursor-grab active:cursor-grabbing bg-white/5 rounded-t-2xl select-none"
          >
            <div className="flex items-center gap-2 text-gray-400">
              <GripHorizontal className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Tools</span>
            </div>
            <button
              onClick={() => setIsRightPanelOpen(false)}
              className="p-1 hover:bg-white/10 rounded-md text-gray-400 hover:text-white"
              title="Minimize Panel"
              aria-label="Minimize Panel"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar">
            {/* Navigation Pad */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Crosshair className="w-4 h-4 text-green-400" />
                <h3 className="font-semibold text-xs sm:text-sm">Position</h3>
              </div>
              <div className="bg-white/5 p-2 sm:p-3 rounded-lg border border-white/5 flex justify-center">
                <div className="grid grid-cols-3 gap-1 sm:gap-2">
                  <div />
                  <button onClick={() => sceneRef.current?.moveCamera('up')}
                    className="p-2 bg-gray-700 hover:bg-purple-600 rounded-lg transition-colors" title="Move Up" aria-label="Move Up">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <div />
                  <button onClick={() => sceneRef.current?.moveCamera('left')}
                    className="p-2 bg-gray-700 hover:bg-purple-600 rounded-lg transition-colors" title="Move Left" aria-label="Move Left">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => sceneRef.current?.resetCamera()}
                    className="p-2 bg-gray-600 hover:bg-red-600 text-white rounded-lg transition-colors" title="Center Model" aria-label="Center Model">
                    <Crosshair className="w-4 h-4" />
                  </button>
                  <button onClick={() => sceneRef.current?.moveCamera('right')}
                    className="p-2 bg-gray-700 hover:bg-purple-600 rounded-lg transition-colors" title="Move Right" aria-label="Move Right">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div />
                  <button onClick={() => sceneRef.current?.moveCamera('down')}
                    className="p-2 bg-gray-700 hover:bg-purple-600 rounded-lg transition-colors" title="Move Down" aria-label="Move Down">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <div />
                </div>
              </div>
            </div>

            {/* Complexity Level */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className="font-semibold text-xs sm:text-sm">Complexity Level</h3>
              </div>
              <div className="flex p-1 bg-black/40 rounded-lg border border-white/5">
                {['basic', 'intermediate', 'advanced'].map(level => (
                  <button key={level}
                    disabled={!selectedModel.annotationLevels.includes(level)}
                    onClick={() => setAnnotationLevel(level as any)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-all
                      ${annotationLevel === level ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}
                      ${!selectedModel.annotationLevels.includes(level) && 'opacity-20 cursor-not-allowed'}`}
                    aria-label={`Set complexity to ${level}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Tools */}
            <div className="mb-6">
              <h3 className="font-semibold text-xs sm:text-sm mb-3 text-gray-300">Interactive Tools</h3>
              <div className="mb-4 bg-white/5 p-3 rounded-lg border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium">Cross Section</span>
                  </div>
                  <span className="text-xs font-mono text-blue-300">{sliceValue}%</span>
                </div>
                <input type="range" min="0" max="100" value={sliceValue}
                  onChange={(e) => setSliceValue(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  aria-label="Slice Control" title="Slice Control"
                />
              </div>
              <div className="mb-2 bg-white/5 p-3 rounded-lg border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium">Global Opacity</span>
                  </div>
                  <span className="text-xs font-mono text-cyan-300">{opacityValue}%</span>
                </div>
                <input type="range" min="0" max="100" value={opacityValue}
                  onChange={(e) => setOpacityValue(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  aria-label="Opacity Control" title="Opacity Control"
                />
              </div>
            </div>
            {/* Removed Parts Visibility Section */}
          </div>
        </div>
      )}
    </div>
  );
};