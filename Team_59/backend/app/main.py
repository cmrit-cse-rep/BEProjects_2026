from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List
import logging
import time
from contextlib import asynccontextmanager
import os

from .services.medical_image_service import get_medical_image_service
from .services.prediction_service import get_prediction_service
from .models.model_loader import get_model_loader
from .db import Base, engine
from .routers import auth, courses,lessons



# --- Configuration for Live Deployment ---
LIVE_FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "https://webxr-healthcare-lms.vercel.app",
)
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    LIVE_FRONTEND_URL,
]

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEFAULT_MODEL_TYPE = os.getenv("MODEL_TYPE", "mobilenetv2").lower()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Healthcare AR Platform...")

    try:
        # Create DB tables on startup (for simple deployments).
        # For larger systems, consider Alembic migrations instead.
        Base.metadata.create_all(bind=engine)

        model_loader = get_model_loader(
            model_path=(
                "trained_models/mobilenetv2_small_model.pth"
                if DEFAULT_MODEL_TYPE == "mobilenetv2"
                else "trained_models/enhanced_hybrid_model.pth"
            ),
            model_type=DEFAULT_MODEL_TYPE,
        )
        model_loader.load_model()
        logger.info("%s classifier loaded successfully", DEFAULT_MODEL_TYPE)
        yield

    except Exception as e:
        logger.error("Startup failed: %s", e)
        raise

    finally:
        logger.info("Shutting down services...")


app = FastAPI(
    title="Healthcare AR Learning Platform API",
    description="Medical Image Analysis API",
    version="2.0.0",
    lifespan=lifespan,
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ----------------------


# --- Routers ---
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(courses.router, prefix="/api", tags=["courses"])
app.include_router(lessons.router, prefix="/api", tags=["lessons"])
# Future: app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
# ----------------


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{time.time() - start:.3f}"
    return response


@app.get("/")
async def root():
    return {
        "message": "Healthcare AR Learning Platform API",
        "version": "2.0.0",
        "status": "operational",
        "features": [
            "User Accounts & Auth",
            "Medical Image Classification",
            "AR Visualization",
        ],
    }


@app.get("/api/health")
async def health_check():
    try:
        medical_service = get_medical_image_service()
        status = medical_service.get_system_status()
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "services": {
                "medical_image_analysis": status,
                "ar_visualization": "active",
            },
        }
    except Exception as e:
        logger.error("Health check failed: %s", e)
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": str(e)},
        )


@app.post("/api/medical/predict")
async def predict_medical_image(
    file: UploadFile = File(...),
    generate_explanation: bool = True,
    model_type: str = Query(
        DEFAULT_MODEL_TYPE,
        enum=["mobilenetv2", "hybrid_cnn_vit"],
    ),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    prediction_service = get_prediction_service(model_type=model_type)
    image_bytes = await file.read()
    result = await prediction_service.predict_from_bytes(
        image_bytes,
        generate_explanation,
    )
    return result


@app.post("/api/medical/batch-predict")
async def batch_predict_medical_images(
    files: List[UploadFile] = File(...),
    generate_explanations: bool = False,
    model_type: str = Query(
        DEFAULT_MODEL_TYPE,
        enum=["mobilenetv2", "hybrid_cnn_vit"],
    ),
):
    if len(files) > 10:
        raise HTTPException(
            status_code=400,
            detail="Maximum 10 files allowed per batch",
        )

    prediction_service = get_prediction_service(model_type=model_type)
    image_bytes_list = [await file.read() for file in files]
    results = await prediction_service.batch_predict(
        image_bytes_list,
        generate_explanations,
    )
    return {"success": True, "total_files": len(files), "results": results}


@app.get("/api/medical/model-info")
async def get_model_information(
    model_type: str = Query(
        DEFAULT_MODEL_TYPE,
        enum=["mobilenetv2", "hybrid_cnn_vit"],
    )
):
    try:
        prediction_service = get_prediction_service(model_type=model_type)
        model_info = prediction_service.get_model_info()
        return model_info
    except Exception as e:
        logger.error("Failed to get model info: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/medical/capabilities")
async def get_medical_capabilities():
    try:
        medical_service = get_medical_image_service()
        capabilities = medical_service.get_capabilities()
        return capabilities
    except Exception as e:
        logger.error("Failed to get capabilities: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error"},
    )


if __name__ == "__main__":
    import uvicorn

    print("=" * 70)
    print("Healthcare AR Learning Platform - Backend Server")
    print("=" * 70)
    print("User Accounts & Auth: ENABLED")
    print("Medical Image Classification: ENABLED")
    print("AR Visualization: ENABLED")
    print("=" * 70)
    print("API Documentation: http://localhost:8000/docs")
    print("Health Check: http://localhost:8000/api/health")
    print("=" * 70)

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
