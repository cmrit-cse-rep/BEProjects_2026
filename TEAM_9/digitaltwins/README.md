# Construction Site Digital Twin

An interactive 3D visualization and simulation of a construction site with equipment tracking, worker safety, environmental monitoring, emergency evacuation, and high-frequency telemetry storage.

## Quick Start

### Prerequisites
- Python 3.10+
- Windows PowerShell

### Setup
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Run
```powershell
python construction_digital_twin.py
```
Open http://localhost:8001 in your browser.

## Deployment (Free Options)

### Render (Recommended)
1. Push this folder to a public GitHub repo.
2. Create a new Web Service on Render; choose Docker and the repo.
3. Render detects `render.yaml` and builds automatically.
4. After deploy, open the generated Render URL (e.g. `https://construction-digital-twin.onrender.com`).
5. Health check at `/health` keeps service green. Default `AUTO_START=1` starts operations.

### Railway
1. Create a Railway project, link your GitHub repo.
2. Add a service from the repo; Railway auto-builds Docker.
3. Set env vars if needed: `PORT=8001`, `AUTO_START=1`.
4. Access the public domain Railway provides.

### Fly.io
1. Install Fly CLI: `fly launch` (select Python or Docker, use existing Dockerfile).
2. Set `fly.toml` `PORT` to 8001 or rely on env.
3. Deploy: `fly deploy`.
4. App reachable at `https://<app>.fly.dev`.

### Cloudflare Tunnel (Expose Local Dev)
1. Install `cloudflared`.
2. Run: `cloudflared tunnel --url http://localhost:8001`.
3. Share the temporary public URL (not persistent; good for demos).

### PythonAnywhere (Free tier)
1. Upload project files.
2. Create a new web app (manual config, Flask).
3. WSGI entrypoint: `from construction_digital_twin import app as application`.
4. Set working directory and reload.

### Replit / Codespaces
Run `python construction_digital_twin.py`; platform provides a public URL. Performance may be lower for 10ms telemetry.

## Production Notes
- The `Dockerfile` uses Gunicorn with workers/threads for concurrency.
- `AUTO_START=1` starts operations on container boot; set to `0` to start manually.
- SQLite writes at 10ms may be heavy on free tiers; increase interval if platform throttles CPU.
- Consider adding authentication before exposing control endpoints publicly.
- Unused dependencies (FastAPI, pydantic, uvicorn, python-json-logger) can be removed if not used.

## Environment Variables
- `PORT`: Port the server binds to (platform may override).
- `AUTO_START`: `1` auto-starts operations; `0` disables.

## Docker Local Run
```powershell
docker build -t construction-twin .
docker run -p 8001:8001 -e AUTO_START=1 construction-twin
```
Open http://localhost:8001

## Core Endpoints
- `GET /` – 3D dashboard page
- `GET /api/dashboard-data` – Full site snapshot
- `POST /api/start-operations` – Start equipment + telemetry
- `POST /api/stop-operations` – Stop equipment + telemetry
- `POST /api/trigger-emergency` – Trigger evacuation (optional `dust_level`)
- `POST /api/clear-emergency` – Clear evacuation
- `POST /api/truck/kill` – Freeze concrete mixer (`equipment_id` optional)
- `POST /api/truck/resume` – Resume concrete mixer (`equipment_id` optional)
- `GET /health` – Health check status
- `POST /api/route/select` – Switch truck route file

### Route Switching
Switch the concrete mixer route at runtime:
```powershell
$body = @{ route_file = "truck_route_wrong_route.json"; equipment_id = "MIX001" } | ConvertTo-Json
curl -Method POST -ContentType 'application/json' -Body $body http://localhost:8001/api/route/select
```

## Notes
- Telemetry collection runs at 10ms and writes to `construction_telemetry.db`.
- `truck_route.json` is the default route; you can switch to `truck_route_correct.json` or `truck_route_wrong_route.json` via the API.
- If performance is constrained, consider increasing telemetry interval or batching DB inserts.

## License
Internal project. Use responsibly.
