# face_recog.py
import os
import cv2
import numpy as np
import insightface

class FaceRecog:
    def __init__(self, faces_dir="static/faces", threshold=0.6):
        self.faces_dir = faces_dir
        os.makedirs(self.faces_dir, exist_ok=True)

        # Similarity threshold for recognition
        self.threshold = threshold

        # Auto-select GPU if available
        providers = ["CUDAExecutionProvider", "CPUExecutionProvider"]
        print("[FaceRecog] Initializing with providers:", providers)

        self.model = insightface.app.FaceAnalysis(
            name="buffalo_l", providers=providers
        )
        self.model.prepare(ctx_id=0, det_size=(640, 640))

        self.embeddings = {}
        self.update_faces()

    def update_faces(self):
        self.embeddings.clear()
        for f in os.listdir(self.faces_dir):
            path = os.path.join(self.faces_dir, f)
            if not os.path.isfile(path):
                continue
            img = cv2.imread(path)
            if img is None:
                continue
            faces = self.model.get(img)
            if not faces:
                continue
            emb = faces[0].normed_embedding
            name = os.path.splitext(f)[0]
            self.embeddings[name] = emb
        print(f"[FaceRecog] Loaded {len(self.embeddings)} registered faces")

    def recognize(self, frame):
        faces = self.model.get(frame)
        results = []
        for f in faces:
            box = f.bbox.astype(int)
            emb = f.normed_embedding

            # Compare with database
            name, sim = "unknown", 0
            for reg_name, reg_emb in self.embeddings.items():
                similarity = np.dot(emb, reg_emb)
                if similarity > sim:
                    name, sim = reg_name, similarity

            # Apply threshold
            if sim < self.threshold:
                name = "unknown"

            color = (0, 255, 0) if name != "unknown" else (0, 0, 255)
            label = f"{name} ({sim:.2f})" if name != "unknown" else "unknown"

            cv2.rectangle(frame, (box[0], box[1]), (box[2], box[3]), color, 2)
            cv2.putText(frame, label, (box[0], box[1] - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

            results.append({
                "name": name,
                "similarity": sim,
                "box": box.tolist()
            })
        return frame, results
