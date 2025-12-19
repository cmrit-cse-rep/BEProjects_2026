# app.py
import os
from flask import Flask, render_template, Response, request, redirect, url_for, session, flash, send_from_directory
from camera import Camera
import cv2
import atexit

app = Flask(__name__)
app.secret_key = "change_this_secret!"

# Camera setup
camera1 = Camera(cam_index=0)
camera2 = Camera(cam_index=1)

# Ensure dirs
os.makedirs("static/faces", exist_ok=True)
os.makedirs("static/intruders", exist_ok=True)

# ---------------- Authentication ----------------
@app.route("/", methods=["GET", "POST"])
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        if username == "admin" and password == "admin":
            session["user"] = username
            return redirect(url_for("dashboard"))
        flash("Invalid credentials", "danger")
    return render_template("login.html")

@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("login"))

# ---------------- Dashboard ----------------
@app.route("/dashboard")
def dashboard():
    if "user" not in session:
        return redirect(url_for("login"))
    return render_template("dashboard.html")

# ---------------- Video Streaming ----------------
def encode_frame(frame):
    ret, jpeg = cv2.imencode(".jpg", frame)
    return jpeg.tobytes() if ret else None

def gen_camera(camera):
    while True:
        frame, _ = camera.get_frame()
        if frame is None:
            continue
        jpeg = encode_frame(frame)
        if jpeg:
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + jpeg + b"\r\n")

@app.route("/video_feed1")
def video_feed1():
    return Response(gen_camera(camera1), mimetype="multipart/x-mixed-replace; boundary=frame")

@app.route("/video_feed2")
def video_feed2():
    return Response(gen_camera(camera2), mimetype="multipart/x-mixed-replace; boundary=frame")

# ---------------- Face Register ----------------
@app.route("/register", methods=["GET", "POST"])
def register():
    if "user" not in session:
        return redirect(url_for("login"))

    if request.method == "POST":
        name = request.form.get("name")
        file = request.files.get("face_image")
        if not name or not file:
            flash("Please provide name and image", "warning")
        else:
            path = os.path.join("static/faces", f"{name}.jpg")
            file.save(path)
            try: camera1.recog.update_faces()
            except: pass
            try: camera2.recog.update_faces()
            except: pass
            flash(f"Registered face: {name}", "success")
            return redirect(url_for("register"))

    faces = sorted(os.listdir("static/faces"))
    return render_template("register.html", faces=faces)

@app.route("/delete_face/<filename>", methods=["POST"])
def delete_face(filename):
    if "user" not in session:
        return redirect(url_for("login"))
    path = os.path.join("static/faces", filename)
    if os.path.exists(path):
        os.remove(path)
        try: camera1.recog.update_faces()
        except: pass
        try: camera2.recog.update_faces()
        except: pass
        flash("Deleted " + filename, "success")
    return redirect(url_for("register"))

# ---------------- Intruder Log ----------------
@app.route("/intruders")
def intruders():
    if "user" not in session:
        return redirect(url_for("login"))

    log_file = os.path.join("static/intruders", "intruder_log.txt")
    entries = []
    if os.path.exists(log_file):
        with open(log_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    time, reason, faces, filename = line.strip().split("|")
                    entries.append({
                        "time": time,
                        "reason": reason,
                        "faces": faces,
                        "filename": filename
                    })
                except:
                    continue
    entries.reverse()  # newest first
    return render_template("intruders.html", entries=entries)

@app.route("/intruders/view/<filename>")
def intruder_view(filename):
    return send_from_directory("static/intruders", filename)

@app.route("/intruders/delete/<filename>", methods=["POST"])
def intruder_delete(filename):
    if "user" not in session:
        return redirect(url_for("login"))
    path = os.path.join("static/intruders", filename)
    if os.path.exists(path):
        os.remove(path)
    # also remove from log
    log_file = os.path.join("static/intruders", "intruder_log.txt")
    if os.path.exists(log_file):
        lines = []
        with open(log_file, "r", encoding="utf-8") as f:
            lines = [l for l in f if filename not in l]
        with open(log_file, "w", encoding="utf-8") as f:
            f.writelines(lines)
    flash("Deleted " + filename, "success")
    return redirect(url_for("intruders"))

@app.route("/intruders/delete_all", methods=["POST"])
def intruder_delete_all():
    if "user" not in session:
        return redirect(url_for("login"))
    intruder_dir = "static/intruders"
    for f in os.listdir(intruder_dir):
        if f.endswith(".jpg") or f.endswith(".png"):
            try: os.remove(os.path.join(intruder_dir, f))
            except: pass
    # clear log
    open(os.path.join(intruder_dir, "intruder_log.txt"), "w").close()
    flash("All intruder snapshots deleted", "success")
    return redirect(url_for("intruders"))

# ---------------- Cleanup ----------------
def release_cameras():
    try: camera1.release()
    except: pass
    try: camera2.release()
    except: pass
atexit.register(release_cameras)

if __name__ == "__main__":
    os.makedirs("static/faces", exist_ok=True)
    os.makedirs("static/intruders", exist_ok=True)
    app.run(host="0.0.0.0", port=5000, debug=True)
