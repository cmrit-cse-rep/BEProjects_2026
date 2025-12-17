import React from "react";

interface ConfidenceIndicatorProps {
  confidence: number; // value between 0 and 1
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({ confidence }) => {
  const percent = Math.max(0, Math.min(100, Math.round(Number(confidence) * 100)));

  const getColor = () => {
    if (confidence < 0.5) return "#e55353";
    if (confidence < 0.75) return "#f0ad4e";
    return "#5cb85c";
  };

  return (
    <div>
      <div
        id="confidence-bar"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`Confidence is ${percent}%`}
        style={{
          width: "100%",
          backgroundColor: "#e0e0e0",
          borderRadius: "4px",
          height: "20px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            backgroundColor: getColor(),
            transition: "width 0.4s ease"
          }}
        />
      </div>
      <p style={{ marginTop: "4px", fontWeight: "bold", color: getColor() }}>
        Confidence: {percent}%
      </p>
    </div>
  );
};
