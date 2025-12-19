import cv2

def gen(camera):
    while True:
        frame = camera.get_frame()
        if frame is None:
            continue
        ret, jpeg = cv2.imencode(".jpg", frame)
        if not ret:
            continue
        yield (b"--frame\r\n"
               b"Content-Type: image/jpeg\r\n\r\n" +
               jpeg.tobytes() + b"\r\n")
