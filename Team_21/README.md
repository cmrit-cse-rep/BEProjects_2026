# AI-Powered Crossword Solver

Live demo: https://huggingface.co/spaces/1cr22cs164/ai-powered-crossword-solver

Team 21
- SYED SHOIAB R (1CR22CS200)  
- SAI ROHIT LINGAMPALLI (1CR22CS090)  
- SAMUEL MATHEW (1CR22CS164)

---

## TL;DR
This repo contains a React frontend and a Flask backend that:
- Accepts an uploaded crossword image
- Lets you crop grid & clue regions, runs OCR, builds an XD file
- Solves the puzzle using a FastText model (model.bin)

If you see "failed to fetch" while uploading on the Hugging Face Space, ensure:
- Frontend uses the same origin on HF (window.location.origin)
- Backend is reachable and Tesseract is installed in the container
- model.bin is present or downloaded at runtime

---

## Repo layout
- backend/
  - api.py (Flask API)
  - input_proc.py (image cropping, OCR helpers)
  - ParseClues.py, CheckFoundPuzzle.py, Readftmodel.py, xd_from_json.py
  - requirements.txt
  - model.bin (ML model — must be present or downloaded)
- frontend/
  - src/App.js (React app)
  - public / build etc.
- Dockerfile
- README.md

---

## Prerequisites (local dev)
- Python 3.10+
- Node 18+
- Docker (if using container)
- Tesseract (system binary) for OCR:
  - macOS: `brew install tesseract`
  - Ubuntu: `sudo apt-get install -y tesseract-ocr`
  - Windows: install Tesseract and add to PATH

Note: pytesseract is a Python wrapper and requires the tesseract binary installed on the system or container.

---

## Quick local run (development)
1. Backend venv
   - cd backend
   - python -m venv .venv
   - .venv\Scripts\activate (Windows) or source .venv/bin/activate (mac/Linux)
   - pip install -r requirements.txt
2. Frontend
   - cd frontend
   - npm install
   - npm start
3. Run backend
   - python backend/api.py
4. Open frontend (usually http://localhost:3000). Ensure API_BASE_URL points to `http://localhost:7860` in development if backend runs on 7860.

---

## Docker / Hugging Face Space (recommended deployment)
- Dockerfile builds both frontend and backend and serves the built frontend via Flask.

Important Docker notes:
- Install system-level tesseract and libs inside the image (this repo's Dockerfile has):
  RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 libsm6 libxrender1 libxext6 \
      tesseract-ocr libtesseract-dev libleptonica-dev pkg-config && rm -rf /var/lib/apt/lists/*

- Build locally:
  docker build -t crossword-solver .
  docker run -p 7860:7860 crossword-solver

- On Hugging Face Spaces:
  - Commit & push to the Space repo
  - HF rebuilds the image on each push (cache misses and longer builds are normal)
  - Ensure Tesseract is installed in Dockerfile and active model (see below)

---

## Model (model.bin) — required for solving
- `backend/model.bin` must be present and accessible inside the container.
- If the model file is large, do not commit it to git — use:
  - Git LFS to track the file
  - Or download it at container start (from S3 / HF model repo) and set env var `MODEL_PATH`.

Suggested runtime fallback (in `api.py`):
- If `MODEL_PATH` env var exists use it
- Else use `backend/model.bin`
- If missing, return a clear 404 with debug info (api already includes debug_info when model missing)

Example env var usage:
- export MODEL_PATH=/path/to/model.bin
- Set in HF Space Secrets or Docker ENV

---

## API Endpoints (summary)
- GET  /api/health
- POST /api/upload
  - multipart form field `image` (file)
  - returns { success, session_id, image_info:{preview_image,width,height} }
- POST /api/process-grid
  - JSON: { session_id, crop_coordinates: [x,y,w,h], rows, cols }
  - returns grid JSON and preview image
- POST /api/process-clues
  - JSON: { session_id, across_coordinates: [[x,y,w,h],...], down_coordinates: [...] }
  - returns OCRed clues, saves preview images to debug_previews/<session>
- POST /api/update-grid /api/update-clues
  - JSON edit endpoints
- POST /api/validate
  - JSON: { session_id }
  - validates grid/clues and returns ready flag
- POST /api/create-xd
  - builds .xd file from grid+clues
- POST /api/solve
  - JSON: { session_id, alpha } (alpha is threshold)
  - uses model.bin to solve and returns solved board and stats

Examples (curl):
- Upload:
  curl -F "image=@puzzle.jpg" https://your-space-or-host/api/upload
- Process clues:
  curl -X POST -H "Content-Type: application/json" -d '{"session_id":"...", "across_coordinates":[[50,300,200,100]], "down_coordinates":[]}' https://.../api/process-clues

---

## Common issues & fixes
- "failed to fetch" (frontend upload)
  - On Hugging Face, frontend must use same origin (no http->https mixed-content). App uses:
    const API_BASE_URL = window.location.hostname.includes("hf.space") ? window.location.origin : process.env.REACT_APP_API_URL || "http://localhost:7860"
  - Verify Network tab URL and response in browser devtools.

- "tesseract is not installed or it's not in your PATH"
  - Install system tesseract in the container (Dockerfile) or in your local environment.
  - Verify with `tesseract --version`.

- Dockerfile parse error on multi-line apt-get
  - Use a single logical RUN line or ensure trailing backslashes are correct. Example:
    RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 ... tesseract-ocr libtesseract-dev pkg-config && rm -rf /var/lib/apt/lists/*

- "Model file not found: model.bin"
  - Put `model.bin` in backend/ or set `MODEL_PATH` env var and update `api.py` accordingly.
  - Consider downloading at container start if file is too big for git.

- Build failures on HF (cache misses/timeouts)
  - HF Spaces rebuilds from scratch; large npm builds can time out or OOM. Consider pre-building or reducing image size (avoid large dev dependencies).

---

## Debugging tips
- Check HF Space build & runtime logs for build errors and runtime stack traces.
- Use browser DevTools → Network to view failed requests and response bodies.
- Check `debug_previews/<session_id>/` (created by process_clues) for cropping/OCR images.
- Confirm files for a session via POST /api/session-status (returns file paths & progress)
