
const micButton = document.getElementById("mic-button");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const chatMessages = document.getElementById("chat-messages");

// Initialize chat history and get user email from localStorage
let chatHistory = [];
let userEmail = '';
let isRecording = false;

try {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser && currentUser.email) {
    userEmail = currentUser.email;
  }
} catch (e) {
  console.warn('Could not load user email:', e);
}

async function getBotReply(message) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      email: userEmail,
      history: chatHistory,
      language: currentLang
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Server error");
  }

  return data.reply;
} 

document.getElementById("questionnaire-form").onsubmit = function (event) {
  event.preventDefault();

  const moodRating = document.getElementById("mood-rating").value;

  document.getElementById("initial-mood").value = moodRating;

  const modal = document.getElementById("questionnaire-modal");
  modal.classList.add("hiding");
  setTimeout(() => {
    modal.style.display = "none";
    modal.classList.remove("hiding");
  }, 300);
};



const languageData = {
  en: { name: "English", code: "en", placeholder: "Type your message..." },
  hi: { name: "Hindi", code: "hi", placeholder: "अपना संदेश टाइप करें..." },
  te: {
    name: "Telugu",
    code: "te",
    placeholder: "మీ సందేశాన్ని టైప్ చేయండి...",
  },
  ta: {
    name: "Tamil",
    code: "ta",
    placeholder: "உங்கள் செய்தியை தட்டச்சு செய்யவும்...",
  },
  bn: { name: "Bengali", code: "bn", placeholder: "আপনার বার্তা টাইপ করুন..." },
  mr: { name: "Marathi", code: "mr", placeholder: "आपला संदेश टाइप करा..." },
  pa: { name: "Punjabi", code: "pa", placeholder: "ਆਪਣਾ ਸੁਨੇਹਾ ਟਾਈਪ ਕਰੋ..." },
  ur: { name: "Urdu", code: "ur", placeholder: "اپنا پیغام ٹائپ کریں..." },
  kn: {
    name: "Kannada",
    code: "kn",
    placeholder: "ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...",
  },
  ml: {
    name: "Malayalam",
    code: "ml",
    placeholder: "നിങ്ങളുടെ സന്ദേശം ടൈപ്പ് ചെയ്യുക...",
  },
};

let currentLang = "en";

const languageSelect = document.getElementById("language-select");
languageSelect.addEventListener("change", (e) => {
  currentLang = e.target.value;
  userInput.placeholder = languageData[currentLang].placeholder;
});

let typingTimeout;
let activeRequest = null;

const translatorStatus = document.createElement("div");
translatorStatus.style.fontSize = "12px";
translatorStatus.style.color = "#888";
translatorStatus.style.marginTop = "3px";
translatorStatus.style.transition = "opacity 0.2s";
translatorStatus.style.opacity = "0";
userInput.insertAdjacentElement("afterend", translatorStatus);

// Video / face detection elements and state
const videoToggleButton = document.getElementById("video-toggle-button");
const videoContainer = document.getElementById("video-mode-container");
const userVideo = document.getElementById("user-video");
// Try to find an optional canvas overlay (may not exist) and a simple overlay div
const overlayCanvas = document.getElementById('overlay-canvas') || null;
let overlayCtx = null;
const overlayDiv = document.getElementById('video-overlay') || null;
const stopVideoButton = document.getElementById("stop-video-button");
let videoStream = null;
let detectionInterval = null;
let isVideoMode = false;
let modelsLoaded = false;
let isSpeaking = false; // flag to prevent recognition during bot speech

async function loadFaceModels() {
  if (modelsLoaded) return;
  try {
    // models are served from the `public` directory as the web root => use "/models"
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/models');
    modelsLoaded = true;
    console.log('Face-api models loaded');
  } catch (err) {
    console.error('Error loading face-api models. Make sure /models exists and contains the models.', err);
  }
}

function updateAnalysisReport(expressions) {
  // expressions is object of probabilities
  if (!expressions) return;
  // find dominant expression
  const entries = Object.entries(expressions);
  entries.sort((a,b) => b[1] - a[1]);
  const dominant = entries[0];
  const emotion = dominant[0];

  // update the CBT report fields on right side
  const emotionsField = document.getElementById('emotions');
  const currentMoodField = document.getElementById('current-mood');
  if (emotionsField) {
    // show top 3 expressions
    const top3 = entries.slice(0,3).map(e => `${e[0]}: ${Math.round(e[1]*100)}%`).join(', ');
    emotionsField.value = top3;
  }
  if (currentMoodField) {
    currentMoodField.value = emotion;
  }
}

async function startVideoMode() {
  await loadFaceModels();
  if (!modelsLoaded) return;
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
    userVideo.srcObject = videoStream;
    // try to play immediately; some browsers require a play() call on video elements
    try {
      await userVideo.play();
    } catch (playErr) {
      console.warn('userVideo.play() error (may be autoplay policy):', playErr);
    }
    videoContainer.style.display = '';
    // // prepare overlay canvas context
    if (overlayCanvas) {
      overlayCtx = overlayCanvas.getContext('2d');
      // set canvas pixel size to match actual video size
      const setCanvasSize = () => {
        const w = userVideo.videoWidth || userVideo.clientWidth || 640;
        const h = userVideo.videoHeight || userVideo.clientHeight || 480;
        overlayCanvas.width = w;
        overlayCanvas.height = h;
        overlayCanvas.style.width = userVideo.clientWidth + 'px';
        overlayCanvas.style.height = userVideo.clientHeight + 'px';
      };
      // if metadata already loaded
      if (userVideo.readyState >= 1) setCanvasSize();
      else userVideo.addEventListener('loadedmetadata', setCanvasSize, { once: true });
    }

  const mainChat = document.getElementById('main-chat-container');
  if (mainChat) mainChat.style.display = 'none';
    isVideoMode = true;

    detectionInterval = setInterval(async () => {
      if (!isVideoMode || userVideo.readyState < 2) return;
      try {
        const detection = await faceapi.detectSingleFace(userVideo, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
        if (detection && detection.expressions) {
            updateAnalysisReport(detection.expressions);
            // // draw live overlay
            if (overlayCtx && overlayCanvas) {
              // clear
              overlayCtx.clearRect(0,0,overlayCanvas.width, overlayCanvas.height);
              // compute dominant
              const entries = Object.entries(detection.expressions).sort((a,b)=>b[1]-a[1]);
              const dominant = entries[0];
              const emotion = dominant[0];
              const confidence = Math.round(dominant[1]*100);

              // draw semi-transparent label box
              const padding = 10;
              const text = `${emotion.toUpperCase()} (${confidence}%)`;
              overlayCtx.font = '20px Poppins, Arial';
              overlayCtx.textBaseline = 'top';
              overlayCtx.fillStyle = 'rgba(0,0,0,0.45)';
              const metrics = overlayCtx.measureText(text);
              const boxWidth = metrics.width + padding*2;
              const boxHeight = 36;
              // position top-left
              overlayCtx.fillRect(12, 12, boxWidth, boxHeight);
              // text
              overlayCtx.fillStyle = '#fff';
              overlayCtx.fillText(text, 12 + padding, 12 + 6);

              // draw small bar for top 3
              let y = 12 + boxHeight + 8;
              const barWidth = Math.min(overlayCanvas.width - 40, 220);
              entries.slice(0,3).forEach((e, idx) => {
                const name = e[0];
                const val = e[1];
                const barX = 12;
                const barY = y + idx*20;
                overlayCtx.fillStyle = 'rgba(255,255,255,0.15)';
                overlayCtx.fillRect(barX, barY, barWidth, 12);
                overlayCtx.fillStyle = 'rgba(33,150,243,0.9)';
                overlayCtx.fillRect(barX, barY, Math.round(barWidth * val), 12);
                overlayCtx.fillStyle = '#fff';
                overlayCtx.font = '12px Poppins, Arial';
                overlayCtx.fillText(`${name} ${Math.round(val*100)}%`, barX + 6, barY - 2);
              });
            }
        }
      } catch (err) {
        console.error('Face detection error:', err);
      }
    }, 800);
    // start speech recognition so user can talk while video mode is active
    try {
      if (!isChatActive) startContinuousChat();
    } catch (recErr) {
      console.warn('Could not start continuous speech recognition:', recErr);
    }
  } catch (err) {
    console.error('Could not start camera:', err);
    alert('Unable to access camera. Please allow camera permissions or use a compatible browser (Chrome).');
    stopVideoMode();
  }
}

function stopVideoMode() {
  isVideoMode = false;
  if (detectionInterval) {
    clearInterval(detectionInterval);
    detectionInterval = null;
  }
  if (videoStream) {
    videoStream.getTracks().forEach(t => t.stop());
    videoStream = null;
  }
  if (videoContainer) videoContainer.style.display = 'none';
  const mainChat = document.getElementById('main-chat-container');
  if (mainChat) mainChat.style.display = '';
  // stop continuous speech recognition when leaving video mode
  try {
    if (isChatActive) stopContinuousChat();
  } catch (err) {
    console.warn('Error stopping continuous chat:', err);
  }
}

videoToggleButton?.addEventListener('click', () => {
  if (!isVideoMode) {
    startVideoMode();
    videoToggleButton.textContent = 'Stop Video';
    videoToggleButton.style.background = 'var(--stop-red)';
  } else {
    stopVideoMode();
    videoToggleButton.textContent = 'Video Mode';
    videoToggleButton.style.background = 'var(--pause-blue)';
  }
});

stopVideoButton?.addEventListener('click', () => {
  stopVideoMode();
  videoToggleButton.textContent = 'Video Mode';
  videoToggleButton.style.background = 'var(--pause-blue)';
});

userInput.addEventListener("input", async () => {
  clearTimeout(typingTimeout);
  const text = userInput.value.trim();
  if (!text) {
    translatorStatus.style.opacity = "0";
    return;
  }

  translatorStatus.textContent = "Translating...";
  translatorStatus.style.opacity = "0.8";

  typingTimeout = setTimeout(async () => {
    if (currentLang !== "en") {
      try {
        if (activeRequest && typeof activeRequest.abort === "function") {
          activeRequest.abort();
        }
        const controller = new AbortController();
        activeRequest = controller;

        const translated = await translateText(
          text,
          currentLang,
          controller.signal
        );

        if (userInput.value.trim() === text) {
          userInput.value = translated;
          translatorStatus.textContent = "✓ Translated";
          setTimeout(() => (translatorStatus.style.opacity = "0"), 800);
        }
      } catch (err) {
        translatorStatus.textContent = "⚠️ Translation failed";
        console.error("Translation error:", err);
      }
    } else {
      translatorStatus.style.opacity = "0";
    }
  }, 400);
});

async function translateText(text, targetLang, signal) {
  const res = await fetch(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(
      text
    )}`,
    { signal }
  );
  const data = await res.json();
  return data[0].map((item) => item[0]).join("");
}

sendButton.addEventListener("click", async () => {
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage("user", text);
  userInput.value = "";

  const typing = appendTypingIndicator();

  try {
    const reply = await getBotReply(text);
    typing.remove();
    appendMessage("bot", reply);

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(reply);
    utterance.lang = languageData[currentLang]?.code || "en-US";

    utterance.onstart = () => {
      isSpeaking = true;
      startLipSync();
    };

    utterance.onend = () => {
      isSpeaking = false;
      stopLipSync();
    };

    speechSynthesis.speak(utterance);
  } catch (error) {
    typing.remove();
    appendMessage("bot", `⚠️ Error: ${error.message}`);
    console.error("Gemini error:", error);
  }
});

const robotMouth = document.querySelector(".robot-mouth");

function startLipSync() {
  if (robotMouth) {
    robotMouth.style.animation = "lipSync 0.2s infinite alternate";
  } else {
    console.warn("Robot mouth element not found.");
  }
}

function stopLipSync() {
  if (robotMouth) {
    robotMouth.style.animation = "none";
  }
}

const style = document.createElement("style");
style.textContent = `
  @keyframes lipSync {
    0% { transform: scaleY(1); }
    100% { transform: scaleY(0.3); }
  }
`;
document.head.appendChild(style);

// chatHistory already initialized at top of file

function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", `${sender}-message`);
  msg.innerHTML = `
    <div class="message-avatar">
      ${
        sender === "bot"
          ? '<img src="https://cdn-icons-png.flaticon.com/512/4712/4712108.png" class="avatar-img">'
          : '<img src="https://cdn-icons-png.flaticon.com/512/1077/1077012.png" class="avatar-img">'
      }
    </div>
    <div class="message-content">${text}</div>
  `;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  chatHistory.push({ sender, text });
}

function appendTypingIndicator() {
  const typing = document.createElement("div");
  typing.className = "typing-indicator";
  typing.innerHTML = "<span></span><span></span><span></span>";
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return typing;
}

document.getElementById("questionnaire-form").onsubmit = async function (
  event
) {
  event.preventDefault();

  const moodRating = document.getElementById("mood-rating").value;
  document.getElementById("initial-mood").value = moodRating;

  const modal = document.getElementById("questionnaire-modal");
  modal.classList.add("hiding");
  setTimeout(() => {
    modal.style.display = "none";
  }, 300);
};

async function fetchCBTSummary() {
  try {
    const summary = await getBotReply(
  `Summarize this CBT session in JSON format: ${JSON.stringify(chatHistory)}`
);
    console.log("Raw summary response:", summary);

    try {
      const cleanedSummary = summary.replace(/```json|```/g, "").trim();
      const parsedSummary = JSON.parse(cleanedSummary);

      document.getElementById("initial-mood").value =
        parsedSummary.initialMood || "";
      document.getElementById("situation").value =
        parsedSummary.situation || "";
      document.getElementById("automatic-thought").value =
        parsedSummary.automaticThought || "";
      document.getElementById("emotions").value = parsedSummary.emotions || "";
      document.getElementById("cognitive-distortion").value =
        parsedSummary.cognitiveDistortion || "";
      document.getElementById("reframed-thought").value =
        parsedSummary.reframedThought || "";
      document.getElementById("current-mood").value =
        parsedSummary.currentMood || "";
    } catch (error) {
      console.error("Error parsing JSON summary:", error, summary);
    }
  } catch (error) {
    console.error("Error fetching CBT summary:", error);
  }
}

async function speakText(text, langCode) {
  // Wait until voices are loaded
  if (speechSynthesis.getVoices().length === 0) {
    await new Promise(resolve => {
      speechSynthesis.onvoiceschanged = resolve;
    });
  }

  const voices = speechSynthesis.getVoices();

  // Google voices mapping for Indian languages
  const voiceMap = {
    hi: "Google हिन्दी",     // Hindi
    ta: "Google தமிழ்",      // Tamil
    te: "Google తెలుగు",     // Telugu
    bn: "Google বাংলা",      // Bengali
    ml: "Google മലയാളം",     // Malayalam
    mr: "Google मराठी",      // Marathi
    pa: "Google ਪੰਜਾਬੀ",     // Punjabi
    ur: "Google اردو",       // Urdu
    kn: "Google ಕನ್ನಡ",      // Kannada
    en: "Google US English",
  };

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;

  const preferredVoice = voices.find(v => v.name === voiceMap[langCode.slice(0,2)]);
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  } else {
    // fallback: any matching lang
    const fallback = voices.find(v => v.lang.startsWith(langCode.slice(0,2)));
    utterance.voice = fallback || voices[0];
  }

  utterance.pitch = 1.0;
  utterance.rate = 1.0;

  utterance.onstart = startLipSync;
  utterance.onstart = () => {
    isSpeaking = true;
    startLipSync();
  };

  utterance.onend = () => {
    isSpeaking = false;
    stopLipSync();
  };

  speechSynthesis.cancel(); // stop any previous speech
  speechSynthesis.speak(utterance);
}


function endChatSession() {
  const endMessage =
    "Thank you for sharing. Generating your CBT session summary...";
  const botMessage = document.createElement("div");
  botMessage.className = "bot-message";
  botMessage.textContent = endMessage;
  chatMessages.appendChild(botMessage);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  fetchCBTSummary();
}

const endChatButton = document.getElementById("end-chat-button");
endChatButton?.addEventListener("click", endChatSession);

let recognition;

window.addEventListener("load", () => {
  speechSynthesis.cancel();
  isRecording = false;
});

let conversationHistory = "";
let isChatActive = false;

const startContinuousChat = () => {
  if (!("webkitSpeechRecognition" in window)) {
    alert(
      "Your browser does not support speech recognition. Please use Chrome."
    );
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.lang = "auto";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = async (event) => {
    if (isSpeaking) return; // avoid processing while bot is speaking
    const transcript = event.results[0][0].transcript;
    userInput.value = transcript;

    appendMessage("user", transcript);

    conversationHistory += `User: ${transcript}\n`;

    const typing = appendTypingIndicator();
    try {
      const translatedInput = await translateText(transcript, "en");

    let reply = await getBotReply(translatedInput)  

      const translatedReply = await translateText(reply, currentLang);

      conversationHistory += `Bot: ${reply}\n`;

      typing.remove();
      appendMessage("bot", translatedReply);

      startLipSync();
  await speakText(translatedReply, languageData[currentLang].code);

    } catch (error) {
      typing.remove();
      appendMessage("bot", "⚠️ Sorry, something went wrong.");
      console.error("Gemini error:", error);
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    if (isChatActive) {
      recognition.start();
    }
  };

  recognition.onend = () => {
    if (isChatActive) {
      recognition.start();
    }
  };

  recognition.start();
  isChatActive = true;
  micButton.textContent = "⏹️ Stop Chat";
};

const stopContinuousChat = () => {
  isChatActive = false;
  recognition.stop();
  micButton.textContent = "🎤 Start Chat";
};

micButton.addEventListener("click", () => {
  if (isChatActive) {
    stopContinuousChat();
    micButton.textContent = "🎤 Start Chat";
  } else {
    startContinuousChat();
    micButton.textContent = "⏹️ Stop Chat";
  }
});
const analysisButton = document.createElement("button");
analysisButton.textContent = "Analysis";
analysisButton.style.padding = "0.8rem 1.5rem";
analysisButton.style.background = "var(--pause-blue)";
analysisButton.style.color = "var(--white)";
analysisButton.style.border = "none";
analysisButton.style.borderRadius = "8px";
analysisButton.style.cursor = "pointer";
analysisButton.style.fontWeight = "500";
analysisButton.style.transition = "all 0.3s ease";
analysisButton.style.marginTop = "1rem";

analysisButton.addEventListener("click", () => {
  window.location.href = "analysis.html";
});

document.querySelector(".chat-controls").appendChild(analysisButton);

document.getElementById("save-report").addEventListener("click", () => {
  console.log("buton cliced");

  const report = {
    initialMood: document.getElementById("initial-mood").value,
    situation: document.getElementById("situation").value,
    automaticThought: document.getElementById("automatic-thought").value,
    emotions: document.getElementById("emotions").value,
    cognitiveDistortion: document.getElementById("cognitive-distortion").value,
    reframedThought: document.getElementById("reframed-thought").value,
    currentMood: document.getElementById("current-mood").value,
  };

  let savedReports = JSON.parse(localStorage.getItem("savedReports")) || [];
  savedReports.push(report);
  localStorage.setItem("savedReports", JSON.stringify(savedReports));

  alert("Report saved successfully!");
});
