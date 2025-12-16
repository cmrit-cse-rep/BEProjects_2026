document.getElementById("detectBtn").addEventListener("click", () => {
    fetch("/detect_gesture", {
      method: "POST"
    })
    .then(response => response.json())
    .then(data => {
      document.getElementById("resultText").textContent = `Gesture Detected: ${data.gesture}`;
      // Optional: Speech feedback
      const utter = new SpeechSynthesisUtterance(`Great job! You did a ${data.gesture} gesture!`);
      speechSynthesis.speak(utter);
    })
    .catch(error => {
      console.error("Error detecting gesture:", error);
    });
  });
  