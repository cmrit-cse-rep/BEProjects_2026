// src/components/ml/PredictionDisplay.tsx
import React from "react";

interface PredictionDisplayProps {
  className: string;
  confidence: number;
}

export const PredictionDisplay: React.FC<PredictionDisplayProps> = ({ className, confidence }) => {
  return (
    <div className="prediction-display">
      <h3>Prediction Result</h3>
      <p>
        Class: <strong>{className}</strong>
      </p>
      <p>
        Confidence: <strong>{(confidence * 100).toFixed(2)}%</strong>
      </p>
    </div>
  );
};
