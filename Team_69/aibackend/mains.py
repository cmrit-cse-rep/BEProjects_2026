from fastapi import FastAPI, File, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from auth import verify_jwt, require_scopes
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
import tensorflow as tf

from pymongo import MongoClient
from bson import ObjectId
import datetime

from dotenv import load_dotenv
load_dotenv()

client = MongoClient("mongodb+srv://sapa22cs:6wZ8eGR8YBgvxb69@cluster0.ermvtlx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["agrocare"]
history_collection = db["history"]

app = FastAPI()

# chatbot 
from chatbot_api import router as chatbot_router
app.include_router(chatbot_router)

origins = ["http://localhost:5173","https://agro-care-ai-final.vercel.app"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_POTATO = tf.keras.models.load_model(r"./models/Potato_models/1.keras")
MODEL_TOMATO = tf.keras.models.load_model(r"./models/tomato_models/1.keras")
MODEL_CAPSICUM = tf.keras.models.load_model(r"./models/Capsicum_models/1.keras")

CLASS_NAMES_POTATO = ["Early Blight", "Late Blight", "Healthy"]
CLASS_NAMES_TOMATO = [
    'Tomato_Bacterial_spot', 'Tomato_Early_blight', 'Tomato_Late_blight', 'Tomato_Leaf_Mold',
    'Tomato_Septoria_leaf_spot', 'Tomato_Spider_mites_Two_spotted_spider_mite',
    'Tomato__Target_Spot', 'Tomato__Tomato_YellowLeaf__Curl_Virus', 'Tomato__Tomato_mosaic_virus',
    'Tomato_healthy'
]
CLASS_NAMES_CAPSICUM = ['Pepper__bell___Bacterial_spot', 'Pepper__bell___healthy']

@app.get("/ping")
async def ping():
    return "Hello, I am alive"

def read_file_as_image(data) -> np.ndarray:
    image = Image.open(BytesIO(data)).convert("RGB")
    return np.array(image)

@app.post("/predict/potato")
async def predictPotato(file: UploadFile = File(...), user=Depends(verify_jwt)):
    file_bytes = await file.read()
    image = read_file_as_image(file_bytes)
    img_batch = np.expand_dims(image, 0)
    predictions = MODEL_POTATO.predict(img_batch)
    predicted_class = CLASS_NAMES_POTATO[int(np.argmax(predictions[0]))]
    confidence = float(np.max(predictions[0]))
    # Save prediction history to MongoDB (no image)
    history_collection.insert_one({
        "user_sub": user["sub"],
        "result": predicted_class,
        "confidence": str(confidence),
        "timestamp": datetime.datetime.utcnow()
    })
    return {'class': predicted_class, 'confidence': confidence}

@app.post("/predict/tomato")
async def predictTomato(file: UploadFile = File(...), user=Depends(verify_jwt)):
    file_bytes = await file.read()
    image = read_file_as_image(file_bytes)
    img_batch = np.expand_dims(image, 0)
    predictions = MODEL_TOMATO.predict(img_batch)
    predicted_class = CLASS_NAMES_TOMATO[int(np.argmax(predictions[0]))]
    confidence = float(np.max(predictions[0]))
    # Save prediction history to MongoDB (no image)
    history_collection.insert_one({
        "user_sub": user["sub"],
        "result": predicted_class,
        "confidence": str(confidence),
        "timestamp": datetime.datetime.utcnow()
    })
    return {'class': predicted_class, 'confidence': confidence}

@app.post("/predict/capsicum")
async def predictCapsicum(file: UploadFile = File(...), user=Depends(verify_jwt)):
    file_bytes = await file.read()
    image = read_file_as_image(file_bytes)
    img_batch = np.expand_dims(image, 0)
    predictions = MODEL_CAPSICUM.predict(img_batch)
    predicted_class = CLASS_NAMES_CAPSICUM[int(np.argmax(predictions[0]))]
    confidence = float(np.max(predictions[0]))
    # Save prediction history to MongoDB (no image)
    history_collection.insert_one({
        "user_sub": user["sub"],
        "result": predicted_class,
        "confidence": str(confidence),
        "timestamp": datetime.datetime.utcnow()
    })
    return {'class': predicted_class, 'confidence': confidence}

@app.get("/history")
async def get_history(user=Depends(verify_jwt)):
    records = list(history_collection.find({"user_sub": user["sub"]}))
    for r in records:
        r["_id"] = str(r["_id"])  # Convert ObjectId to string for frontend
    return records

@app.delete("/history/{history_id}")
async def delete_history(history_id: str, user=Depends(verify_jwt)):
    result = history_collection.delete_one({"_id": ObjectId(history_id), "user_sub": user["sub"]})
    return {"success": result.deleted_count > 0}

import csv
from fastapi.responses import StreamingResponse
from io import StringIO

@app.get("/history/export")
async def export_history(user=Depends(verify_jwt)):
    records = list(history_collection.find({"user_sub": user["sub"]}))
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Result", "Confidence", "Timestamp"])
    for r in records:
        writer.writerow([r.get("result", ""), r.get("confidence", ""), r.get("timestamp", "")])
    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=history.csv"})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
