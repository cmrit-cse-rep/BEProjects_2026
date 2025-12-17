import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Annotation {
  id: string;
  position: [number, number, number];
  title: string;
  description: string;
  type: 'chamber' | 'valve' | 'vessel' | 'muscle';
  color: string;
}

interface ARState {
  isLoading: boolean;
  error: string | null;
  sceneReady: boolean;
  modelScale: number;
  showAnnotations: boolean;
  isARActive: boolean;
  isARSupported: boolean;
  annotations: Annotation[];
  selectedAnnotation: string | null;
}

interface ARActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSceneReady: (ready: boolean) => void;
  setModelScale: (scale: number) => void;
  resetModel: () => void;
  toggleAnnotations: () => void;
  selectAnnotation: (id: string | null) => void;
  startARSession: () => Promise<void>;
  endARSession: () => void;
  resetState: () => void;
}

interface ARStore extends ARState, ARActions {}

export const useAR = create<ARStore>()(
  persist(
    (set) => ({
      // Initial State
      isLoading: false,
      error: null,
      sceneReady: false,
      modelScale: 1,
      showAnnotations: true,
      isARActive: false,
      isARSupported: false,
      annotations: [],
      selectedAnnotation: null,

      // Actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      setSceneReady: (ready: boolean) => set({ sceneReady: ready }),
      
      setModelScale: (scale: number) => set({ modelScale: scale }),
      
      resetModel: () => set({ 
        modelScale: 1,
        selectedAnnotation: null 
      }),
      
      toggleAnnotations: () => set((state) => ({ 
        showAnnotations: !state.showAnnotations 
      })),
      
      selectAnnotation: (id: string | null) => set({ 
        selectedAnnotation: id 
      }),
      
      startARSession: async () => {
        try {
          set({ isLoading: true });
          // Check WebXR support
          if (navigator.xr) {
            const supported = await navigator.xr.isSessionSupported('immersive-ar');
            set({ isARSupported: supported });
            
            if (supported) {
              set({ isARActive: true });
            }
          }
        } catch (error) {
          set({ error: 'AR session failed to start' });
        } finally {
          set({ isLoading: false });
        }
      },
      
      endARSession: () => set({ 
        isARActive: false 
      }),
      
      resetState: () => set({
        isLoading: false,
        error: null,
        sceneReady: false,
        modelScale: 1,
        showAnnotations: true,
        isARActive: false,
        selectedAnnotation: null
      })
    }),
    {
      name: 'medar-ar-storage',
      partialize: (state) => ({
        modelScale: state.modelScale,
        showAnnotations: state.showAnnotations
      })
    }
  )
);

export default useAR;
