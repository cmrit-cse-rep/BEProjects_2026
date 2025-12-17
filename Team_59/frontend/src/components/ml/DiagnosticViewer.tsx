import React from "react";
import { ConfidenceIndicator } from "./ConfidenceIndicator";

interface DiagnosticViewerProps {
  className: string;
  confidence: number;
  heatmapBase64?: string;
  superimposedBase64?: string;
  explanationText?: string;
}

export const DiagnosticViewer: React.FC<DiagnosticViewerProps> = ({
  className,
  confidence,
  heatmapBase64,
  superimposedBase64,
  explanationText,
}) => {
  // Debug output to confirm prop receipt
  console.log("DiagnosticViewer received heatmap:", heatmapBase64?.slice(0, 50));
  console.log("DiagnosticViewer received superimposed:", superimposedBase64?.slice(0, 50));

  return (
    <div className="diagnostic-viewer">
      <h3>Diagnosis Details</h3>
      <p>
        Class: <strong>{className}</strong>
      </p>
      <ConfidenceIndicator confidence={confidence} />

      <div
        className="gradcam-visuals"
        style={{ display: "flex", gap: "2rem", margin: "2rem 0" }}
      >
        {heatmapBase64 ? (
          <div>
            <h4>Grad-CAM Heatmap</h4>
            <img
              src={heatmapBase64}
              alt="GradCAM Heatmap"
              style={{ maxWidth: 224, maxHeight: 224, border: "2px solid blue" }}
              onError={() => console.error("Failed to load heatmap image")}
            />
          </div>
        ) : null}
        {superimposedBase64 ? (
          <div>
            <h4>Grad-CAM Overlay</h4>
            <img
              src={superimposedBase64}
              alt="GradCAM Overlay"
              style={{ maxWidth: 224, maxHeight: 224, border: "2px solid green" }}
              onError={() => console.error("Failed to load overlay image")}
            />
          </div>
        ) : null}
        {!heatmapBase64 && !superimposedBase64 && (
          <div>No Grad-CAM visual explanation available.</div>
        )}
      </div>

      {explanationText && <p className="explanation-text">{explanationText}</p>}
    </div>
  );
};
