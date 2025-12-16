// mediapipe_client.js
const videoElement = document.getElementById('input_video');
const gestureStatus = document.getElementById('gesture_status');

// simple heuristic from landmarks -> label (you can expand)
function classifyFromLandmarks(landmarks) {
  // landmarks: array of 21 {x,y,z}
  // Very basic: if index finger tip is up relative to pip -> "point"
  if (!landmarks || landmarks.length < 21) return 'unknown';
  const tipIndex = landmarks[8];
  const pipIndex = landmarks[6];

  if (tipIndex && pipIndex) {
    if (tipIndex.y < pipIndex.y - 0.03) {
      return 'point';
    }
  }
  // fallback
  return 'open_hand';
}

async function postLabel(label, landmarks) {
  try {
    await fetch('/api/gesture/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: label, landmarks: landmarks })
    });
  } catch (err) {
    console.error('Failed to post gesture to server', err);
  }
}

// Setup MediaPipe Hands
const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});
hands.onResults((results) => {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    gestureStatus.innerText = 'Gesture: none';
    return;
  }
  const lm = results.multiHandLandmarks[0];
  // Convert to simple array of {x,y,z}
  const landmarks = lm.map(p => ({ x: p.x, y: p.y, z: p.z }));
  const label = classifyFromLandmarks(landmarks);
  gestureStatus.innerText = `Gesture: ${label}`;
  // send label (and landmarks) to server for logging / progress
  postLabel(label, landmarks);
});

// Start camera using MediaPipe camera utils
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 640,
  height: 480
});
camera.start();
