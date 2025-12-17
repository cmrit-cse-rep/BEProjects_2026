import React, { useState, useEffect } from "react";
import { ImageUploader } from "../components/ml/ImageUploader";
import { PredictionDisplay } from "../components/ml/PredictionDisplay";
import { DiagnosticViewer } from "../components/ml/DiagnosticViewer";
import { 
  Brain, 
  Activity, 
  AlertCircle, 
  FileText, 
  Microscope 
} from "lucide-react";

interface PredictionResult {
  class_name: string;
  confidence: number;
  heatmap?: string;      // base64 heatmap from backend
  superimposed?: string; // base64 overlay from backend
  explanation?: string;  // textual explanation from backend
  [key: string]: any;
}

export const MLPredictionPage: React.FC = () => {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  useEffect(() => {
    if (prediction) {
      console.log("Grad-CAM Base64 heatmap (start):", prediction.heatmap?.slice(0, 100));
      console.log("Grad-CAM Base64 superimposed (start):", prediction.superimposed?.slice(0, 100));
    }
  }, [prediction]);

  const handlePrediction = (result: PredictionResult) => {
    setPrediction(result);
    // Scroll to top on mobile when result arrives
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Remove any whitespaces/newlines from base64 strings before passing
  const safeHeatmap = prediction?.heatmap?.replace(/\s/g, "") ?? "";
  const safeSuperimposed = prediction?.superimposed?.replace(/\s/g, "") ?? "";

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      
      {/* --- Header Section --- */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-purple-600/20 rounded-xl border border-purple-500/30">
            <Brain className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Diagnostic Assistant</h1>
            <p className="text-gray-400 text-sm">
              Upload medical imaging (X-Ray, MRI, CT) for instant neural network analysis.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- Left Column: Uploader & Instructions --- */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upload Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
             <div className="flex items-center gap-2 mb-4 text-gray-300 font-semibold">
                <Microscope className="w-5 h-5 text-blue-400" />
                <h2>Input Source</h2>
             </div>
             <ImageUploader onPrediction={handlePrediction} />
          </div>

          {/* Instructions Card */}
          <div className="bg-gray-800/30 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">How it works</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">1</span>
                <span>Upload a clear medical image (JPG/PNG).</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">2</span>
                <span>AI analyzes patterns using CNN & Vision Transformers.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">3</span>
                <span>Review the Heatmap (Grad-CAM) to see focus areas.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* --- Right Column: Results & Visualization --- */}
        <div className="lg:col-span-8">
          {prediction ? (
            <div className="space-y-6 animate-fade-in">
              
              {/* 1. Top Level Stats */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4 text-gray-300 font-semibold">
                  <Activity className="w-5 h-5 text-green-400" />
                  <h2>Analysis Result</h2>
                </div>
                <PredictionDisplay
                  className={prediction.class_name}
                  confidence={prediction.confidence}
                />
              </div>

              {/* 2. Detailed Visualization */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4 text-gray-300 font-semibold">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <h2>Diagnostic Visualization</h2>
                </div>
                
                <DiagnosticViewer
                  className={prediction.class_name}
                  confidence={prediction.confidence}
                  heatmapBase64={safeHeatmap}
                  superimposedBase64={safeSuperimposed}
                  explanationText={prediction.explanation}
                />
              </div>

            </div>
          ) : (
            /* --- Empty State Placeholder --- */
            <div className="h-full min-h-[400px] bg-gray-800/30 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-8">
               <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <Activity className="w-10 h-10 text-gray-600" />
               </div>
               <h3 className="text-xl font-semibold text-gray-300">Waiting for Analysis</h3>
               <p className="text-gray-500 max-w-md mt-2">
                 Upload an image on the left to start the diagnostic process. The AI results and heatmap visualizations will appear here.
               </p>
            </div>
          )}
        </div>

      </div>

      {/* --- Disclaimer Footer --- */}
      <div className="max-w-7xl mx-auto mt-12 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg flex gap-3 items-start">
        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-200/70 leading-relaxed">
          <strong>Medical Disclaimer:</strong> This AI tool is for educational and supportive purposes only. 
          It is not a replacement for professional medical diagnosis. 
          Always verify results with a certified radiologist or medical professional.
        </p>
      </div>

    </div>
  );
};