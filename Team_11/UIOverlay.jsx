// components/UIOverlay.jsx
import React from "react";

export default function UIOverlay({ selected, onClose }) {
  const style = {
    position: "absolute",
    right: 16,
    top: 16,
    width: 360,
    maxHeight: "80vh",
    overflowY: "auto",
    background: "rgba(255,255,255,0.95)",
    padding: "12px 14px",
    borderRadius: 8,
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    zIndex: 20
  };

  if (!selected) {
    return (
      <div style={{ position: "absolute", left: 16, top: 16, zIndex: 10 }}>
        <div
          style={{
            background: "rgba(255,255,255,0.9)",
            padding: "8px 12px",
            borderRadius: 8,
            boxShadow: "0 6px 18px rgba(0,0,0,0.12)"
          }}
        >
          <strong>Virtual Herbal Garden</strong>
          <div style={{ fontSize: 12, marginTop: 6 }}>
            Tap a plant to view details.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={style}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{selected.displayName}</h3>
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 18
          }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <p style={{ marginTop: 8, fontSize: 13 }}>{selected.short}</p>
      <hr />
      <p style={{ fontSize: 13, whiteSpace: "pre-line" }}>{selected.description}</p>

      {/* preview image if available */}
      {selected.image && (
        <div style={{ marginTop: 12 }}>
          <img src={selected.image} alt={selected.displayName} style={{ width: "100%", borderRadius: 8 }} />
        </div>
      )}

      {/* video — using the uploaded path (will be transformed per environment) */}
      {/* {selected.videoUrl && (
        <div style={{ marginTop: 10 }}>
          <h4 style={{ margin: "6px 0" }}>Reference Video</h4>
          <video controls style={{ width: "100%", borderRadius: 8 }}>
            <source src={selected.videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )} */}

      <div style={{ marginTop: 12, fontSize: 12, color: "#555" }}>
        Tip: use the mouse to orbit the scene. Click a plant again to close this panel.
      </div>
    </div>
  );
}
