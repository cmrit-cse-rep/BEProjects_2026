// src/components/ml/HeatmapOverlay.tsx
import React from "react";

interface HeatmapOverlayProps {
  originalImageUrl: string;
  heatmapImageUrl: string;
  width?: number | string;
  height?: number | string;
}

export const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({
  originalImageUrl,
  heatmapImageUrl,
  width = "100%",
  height = "auto",
}) => {
  return (
    <div
      className="heatmap-overlay-container"
      style={{ position: "relative", width, height }}
    >
      <img
        src={originalImageUrl}
        alt="Original Medical"
        style={{ width: "100%", height: "100%", display: "block" }}
      />
      <img
        src={heatmapImageUrl}
        alt="Heatmap Overlay"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          mixBlendMode: "multiply",
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
