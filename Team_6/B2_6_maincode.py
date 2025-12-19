#!/usr/bin/env python3
import os, sys, time, math, queue, json, subprocess, threading
from datetime import datetime
import cv2, numpy as np, pytesseract, sounddevice as sd
from vosk import Model, KaldiRecognizer
from picamera2 import Picamera2
import RPi.GPIO as GPIO

# ---------------- CONFIG ----------------
PERSIST_DIR = "/home/pi4"
VOSK_MODEL_PATH = "/home/pi4/model"
TESSERACT_CMD = "/usr/bin/tesseract"

HIGH_RES = (1536, 864)
SAMPLE_RATE = 16000
AUDIO_BLOCKSIZE = 8000
OCR_SCALE = 2
TESS_OEM = 1
TESS_PSM = 3

# Piper voice path
PIPER_MODEL = "/home/pi4/Desktop/piper_voices/en_US-amy-medium.onnx"

GPIO_PIN = 6

pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

# ---------------- GLOBALS ----------------
captured_image = None
recognized_text = ""
q_audio = queue.Queue(maxsize=200)
playback_proc = None
playback_lock = threading.Lock()

last_command = None
last_time = 0


# ---------------- GPIO SETUP ----------------
GPIO.setmode(GPIO.BCM)
GPIO.setup(GPIO_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)


# ---------------- CAMERA INIT ----------------
picam2 = Picamera2()
preview_cfg = picam2.create_preview_configuration(
    main={"format": "RGB888", "size": (1280, 720)}
)
picam2.configure(preview_cfg)
picam2.start()
time.sleep(0.2)


# ---------------- PIPER TTS ----------------
def piper_tts(message: str):
    global playback_proc
    stop_speaking()

    if not message.strip():
        return

    wav = os.path.join(PERSIST_DIR, "tts.wav")

    def worker():
        global playback_proc

        try:
            subprocess.run(
                ["python3", "-m", "piper",
                 "--model", PIPER_MODEL,
                 "--output_file", wav],
                input=message.encode("utf-8"),
                check=True
            )
            proc = subprocess.Popen(["aplay", wav])

        except Exception as e:
            print("Piper error:", e)
            proc = None

        with playback_lock:
            playback_proc = proc

        if proc:
            proc.wait()

        with playback_lock:
            playback_proc = None

    threading.Thread(target=worker, daemon=True).start()


def stop_speaking():
    global playback_proc
    with playback_lock:
        proc = playback_proc

    if proc:
        try:
            proc.terminate()
            time.sleep(0.1)
            if proc.poll() is None:
                proc.kill()
        except:
            pass

    with playback_lock:
        playback_proc = None


# ---------------- UI ----------------
def print_banner():
    print("""
Awaiting command:
capture | read | speak | stop | exit
""")


# ---------------- SAVE IMAGE ----------------
def _save_image(img, name):
    path = os.path.join(PERSIST_DIR, name)
    cv2.imwrite(path, img)
    return path


# ---------------- PREPROCESSING ----------------
def deskew(img):
    try:
        g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(g, 50, 150)
        lines = cv2.HoughLinesP(edges, 1, math.pi/180, 200, 100, 20)

        if lines is None:
            return img

        angles = [
            np.degrees(np.arctan2(y2 - y1, x2 - x1))
            for x1, y1, x2, y2 in lines[:, 0]
        ]
        ang = np.median(angles)

        if abs(ang) < 0.2:
            return img

        h, w = g.shape
        M = cv2.getRotationMatrix2D((w // 2, h // 2), -ang, 1)
        return cv2.warpAffine(img, M, (w, h), borderMode=cv2.BORDER_REPLICATE)

    except:
        return img


def preprocess(img):
    try:
        img = deskew(img)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(3.0, (8, 8))
        gray = clahe.apply(gray)
        gray = cv2.bilateralFilter(gray, 9, 75, 75)

        sharp = cv2.filter2D(
            gray, -1,
            np.array([[0, -1, 0],
                      [-1, 5, -1],
                      [0, -1, 0]])
        )

        sharp = cv2.resize(
            sharp, None, fx=OCR_SCALE, fy=OCR_SCALE,
            interpolation=cv2.INTER_CUBIC
        )

        th = cv2.adaptiveThreshold(
            sharp, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            25, 10
        )

        return cv2.morphologyEx(th, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    except:
        return img


# ---------------- COMMAND FUNCTIONS ----------------
def capture_image():
    print("Capturing image...")

    try:
        cfg = picam2.create_still_configuration(
            main={"format": "RGB888", "size": HIGH_RES}
        )
        picam2.configure(cfg)
        picam2.start()
        time.sleep(0.1)
        img = picam2.capture_array()
        picam2.configure(preview_cfg)
        picam2.start()
    except:
        try:
            img = picam2.capture_array()
        except:
            img = None

    if img is None:
        print("Image not detected.")
        print_banner()
        return

    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    globals()["captured_image"] = img
    _save_image(img, "last_capture.jpg")

    print("Image captured.")
    print_banner()


def read_text():
    """READ ONLY detects text and prints it. DOES NOT speak."""
    global recognized_text, captured_image

    print("Reading text...")

    if captured_image is None:
        print("Image not detected.")
        print_banner()
        return

    proc = preprocess(captured_image)
    _save_image(proc, "last_processed.png")

    raw = pytesseract.image_to_string(
        proc, config=f"--oem {TESS_OEM} --psm {TESS_PSM}"
    )

    lines = [x.strip() for x in raw.splitlines() if x.strip()]
    recognized_text = "\n".join(lines)

    if recognized_text.strip():
        print("\nText detected:\n")
        print(recognized_text)
    else:
        print("Unable to detect text.")

    print_banner()


def speak_text():
    """Speak ONLY when user says 'speak'."""
    print("Speaking text...")

    if not recognized_text.strip():
        print("No text available.")
        print_banner()
        return

    piper_tts(recognized_text)
    print_banner()


def stop_audio():
    print("Stopping audio...")
    stop_speaking()
    print_banner()


def exit_app():
    print("Exiting application.")
    stop_speaking()
    picam2.close()
    sys.exit(0)


# ---------------- COMMAND PARSER ----------------
def interpret(t):
    t = t.lower().strip()
    commands = ["capture", "read", "speak", "stop", "exit"]
    return t if t in commands else None


# ---------------- AUDIO CALLBACK ----------------
def audio_callback(indata, frames, time_info, status):
    try:
        q_audio.put(bytes(indata), block=False)
    except:
        try:
            q_audio.get_nowait()
            q_audio.put(bytes(indata), block=False)
        except:
            pass


# ---------------- AUTO MODE ----------------
def auto_mode():
    print("AUTO MODE")
    capture_image()
    read_text()
    # no auto speak — user must say "speak"


# ---------------- MANUAL MODE ----------------
def manual_mode():
    global last_command, last_time

    print("MANUAL MODE")
    print_banner()

    model = Model(VOSK_MODEL_PATH)
    rec = KaldiRecognizer(model, SAMPLE_RATE)

    stream = sd.RawInputStream(
        samplerate=SAMPLE_RATE,
        blocksize=AUDIO_BLOCKSIZE,
        dtype='int16',
        channels=1,
        callback=audio_callback
    )
    stream.start()

    while True:
        try:
            data = q_audio.get(timeout=1)
        except queue.Empty:
            continue

        if rec.AcceptWaveform(data):
            txt = json.loads(rec.Result()).get("text", "").strip()
            if not txt:
                continue

            print("Heard:", txt)
            cmd = interpret(txt)

            if cmd:
                now = time.time()
                if cmd == last_command and (now - last_time) < 2:
                    continue

                last_command = cmd
                last_time = now

                if cmd == "capture": capture_image()
                elif cmd == "read": read_text()
                elif cmd == "speak": speak_text()
                elif cmd == "stop": stop_audio()
                elif cmd == "exit": exit_app()


# ---------------- ENTRY ----------------
if __name__ == "__main__":
    mode = GPIO.input(GPIO_PIN)

    if mode == 1:
        manual_mode()
    else:
        auto_mode()