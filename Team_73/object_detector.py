# object_detector.py
from ultralytics import YOLO

class ObjectDetector:
    def __init__(self, model_name="yolov8n.pt", conf=0.35, iou=0.45):
        # GPU auto-detect handled internally by Ultralytics YOLO
        print("[ObjectDetector] Loading model on GPU if available...")
        self.model = YOLO(model_name)
        self.conf = conf
        self.iou = iou

        self.danger_keywords = {
            "knife", "pistol", "gun", "handgun", "rifle", "firearm", "weapon", "scissors", "blade"
        }

    def detect(self, frame):
        results = self.model(frame, conf=self.conf, iou=self.iou, verbose=False)
        if not results:
            return []

        res = results[0]
        detections = []
        for box in res.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf = float(box.conf[0].item())
            cls_id = int(box.cls[0].item())
            name = self.model.names.get(cls_id, str(cls_id))

            detections.append({
                "name": str(name),
                "conf": conf,
                "box": [int(x1), int(y1), int(x2), int(y2)]
            })
        return detections

    def has_danger(self, detections):
        for d in detections:
            nm = d["name"].lower()
            for kw in self.danger_keywords:
                if kw in nm:
                    return True
        return False
