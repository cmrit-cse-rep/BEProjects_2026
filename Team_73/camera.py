# camera.py
import cv2
import os
import time
from face_recog import FaceRecog
from object_detector import ObjectDetector

class Camera:
    def __init__(self, cam_index=0, intruder_dir="static/intruders"):
        self.cap = cv2.VideoCapture(cam_index)
        self.recog = FaceRecog()
        self.detector = ObjectDetector()
        self.intruder_dir = intruder_dir
        os.makedirs(self.intruder_dir, exist_ok=True)
        self.log_file = os.path.join(self.intruder_dir, "intruder_log.txt")

        # Cooldown timer (seconds)
        self.cooldown_seconds = 0
        self.last_snapshot_time = 0

    def is_known_face(self, faces):
        if not faces:
            return False
        for f in faces:
            if f.get("name") and f["name"].lower() != "unknown":
                return True
        return False

    def save_intruder_snapshot(self, frame, reason="intruder", faces=""):
        ts = time.strftime("%Y%m%d_%H%M%S")
        fname = f"{reason}_{ts}.jpg"
        fpath = os.path.join(self.intruder_dir, fname)
        cv2.imwrite(fpath, frame)
        with open(self.log_file, "a", encoding="utf-8") as f:
            f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')}|{reason}|{faces}|{fname}\n")
        return fpath

    def annotate_detections(self, frame, detections):
        for d in detections:
            x1, y1, x2, y2 = d["box"]
            label = f"{d['name']} {d['conf']:.2f}"
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
            cv2.putText(frame, label, (x1, max(10, y1-6)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)

    def get_frame(self):
        ret, frame = self.cap.read()
        if not ret:
            return None, None

        annotated_frame, faces = self.recog.recognize(frame.copy())
        detections = self.detector.detect(frame)
        self.annotate_detections(annotated_frame, detections)

        intruder_flag = False
        reason = None
        if self.detector.has_danger(detections) and not self.is_known_face(faces):
            intruder_flag, reason = True, "weapon"
        elif not self.is_known_face(faces) and faces:
            intruder_flag, reason = True, "intruder"

        if intruder_flag:
            now = time.time()
            if now - self.last_snapshot_time >= self.cooldown_seconds:
                self.last_snapshot_time = now
                face_names = ", ".join([f["name"] for f in faces]) if faces else "none"
                self.save_intruder_snapshot(annotated_frame, reason, face_names)

        return annotated_frame, {"faces": faces, "detections": detections, "intruder": intruder_flag}

    def release(self):
        if self.cap.isOpened():
            self.cap.release()
