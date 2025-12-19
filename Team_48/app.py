# from flask import Flask, request, jsonify, render_template
# import joblib
# import os
# from flask_cors import CORS
# import json
# import hashlib
# from datetime import datetime
# from twilio.rest import Client
# import logging

# # --- Flask App Setup ---
# app = Flask(__name__, template_folder="../frontend", static_folder="../frontend")
# CORS(app)

# # --- Load ML Model and Vectorizer ---
# model = joblib.load("smodel.pkl")
# vectorizer = joblib.load("vectorizer.pkl")

# # --- Twilio Config (Store securely using env vars in production) ---
# TWILIO_SID = os.getenv("TWILIO_SID", "ACee4ebd009a7940024fc2b77311c3fe1f")
# TWILIO_TOKEN = os.getenv("TWILIO_TOKEN", "c49c9863754c66affab433182d0a24b0")
# TWILIO_FROM = os.getenv("TWILIO_FROM", "+16062402987")
# ALERT_TO = os.getenv("ALERT_TO", "+919036521571")

# # --- Logging Utility ---
# LOG_FILE = "logs.json"

# def generate_log_hash(entry):
#     log_str = json.dumps(entry, sort_keys=True)
#     return hashlib.sha256(log_str.encode()).hexdigest()

# def save_log(entry):
#     entry["timestamp"] = datetime.utcnow().isoformat() + "Z"
#     entry["hash"] = generate_log_hash(entry)
#     with open(LOG_FILE, "a") as f:
#         f.write(json.dumps(entry) + "\n")

# def verify_log_integrity(entry):
#     hash_original = entry.pop("hash", None)
#     return hash_original == generate_log_hash(entry)

# def get_all_logs():
#     logs = []
#     if not os.path.exists(LOG_FILE):
#         return logs
#     with open(LOG_FILE, "r") as f:
#         for line in f:
#             entry = json.loads(line)
#             if verify_log_integrity(entry):
#                 logs.append(entry)
#             else:
#                 logging.warning("⚠️ Log tampering detected.")
#     return logs

# # --- Alert System ---
# def send_alert(description):
#     try:
#         client = Client(TWILIO_SID, TWILIO_TOKEN)
#         message = client.messages.create(
#             body=f"🚨 High severity threat detected: {description}",
#             from_=TWILIO_FROM,
#             to=ALERT_TO
#         )
#         print("📨 SMS sent:", message.sid)
#     except Exception as e:
#         logging.error(f"❌ Failed to send alert: {e}")

# # --- Routes ---
# @app.route("/")
# def home():
#     return render_template("index.html")

# @app.route("/predict", methods=["POST"])
# def predict():
#     data = request.get_json()
#     desc = data.get("description", "").strip()

#     if not desc:
#         return jsonify({"severity": "Invalid input"})

#     try:
#         vec = vectorizer.transform([desc])
#         pred = model.predict(vec)[0]
#         print("✅ Prediction:", pred)

#         # Save log
#         log_entry = {"description": desc, "severity": pred}
#         save_log(log_entry)

#         # Trigger alert if High
#         if pred.lower() == "high":
#             send_alert(desc)

#         return jsonify({"severity": pred})
#     except Exception as e:
#         print("❌ Prediction error:", e)
#         return jsonify({"severity": "Error", "details": str(e)})

# @app.route("/logs", methods=["GET"])
# def logs():
#     try:
#         return jsonify({"logs": get_all_logs()})
#     except Exception as e:
#         return jsonify({"error": str(e)})

# # --- Main Entry Point ---
# if __name__ == "__main__":
#     app.run(debug=True)




# from flask import Flask, request, jsonify, render_template
# import joblib
# import os
# from flask_cors import CORS
# import json
# import hashlib
# from datetime import datetime
# from twilio.rest import Client  # Optional: For SMS alerts

# # Initialize Flask app
# app = Flask(__name__, template_folder="../frontend", static_folder="../frontend")
# CORS(app)

# # Load model and vectorizer
# model = joblib.load("smodel.pkl")
# vectorizer = joblib.load("vectorizer.pkl")

# # --- Tamper-proof logging ---
# def generate_log_hash(entry):
#     log_str = json.dumps(entry, sort_keys=True)
#     return hashlib.sha256(log_str.encode()).hexdigest()

# def save_log(entry):
#     entry["timestamp"] = datetime.utcnow().isoformat() + "Z"
#     entry["hash"] = generate_log_hash(entry)
#     with open("logs.json", "a") as f:
#         f.write(json.dumps(entry) + "\n")

# # --- Optional: SMS alert for High severity (requires Twilio setup) ---
# def send_alert(description):
#     # Replace with your actual Twilio SID and token
#     account_sid = "ACee4ebd009a7940024fc2b77311c3fe1f"
#     auth_token = "c49c9863754c66affab433182d0a24b0"
#     client = Client(account_sid, auth_token)

#     message = client.messages.create(
#         body=f"🚨 High severity threat detected: {description}",
#         from_="+16062402987",  # Your Twilio number
#         to="+919036521571"     # Your verified number (with country code)
#     )
#     print("📨 Alert sent:", message.sid)

# @app.route("/")
# def index():
#     return render_template("index.html")

# @app.route("/predict", methods=["POST"])
# def predict():
#     data = request.get_json()
#     desc = data.get("description", "")
#     print("⚠️ Received description:", desc)

#     if not desc.strip():
#         return jsonify({"severity": "Invalid input"})

#     try:
#         vec = vectorizer.transform([desc])
#         pred = model.predict(vec)[0]
#         print("✅ Prediction:", pred)

#         # Log the prediction with tamper-proof hash
#         log_entry = {
#             "description": desc,
#             "severity": pred
#         }
#         save_log(log_entry)

#         # If severity is 'High', send alert
#         if pred == "High":
#             send_alert(desc)  # Optional: Only if Twilio is set up

#         return jsonify({"severity": pred})
#     except Exception as e:
#         print("❌ Prediction error:", e)
#         return jsonify({"severity": "Error"})

# # Optional: API route to retrieve logs
# @app.route("/logs", methods=["GET"])
# def get_logs():
#     try:
#         logs = []
#         with open("logs.json", "r") as f:
#             for line in f:
#                 entry = json.loads(line)
#                 logs.append(entry)
#         return jsonify({"logs": logs})
#     except Exception as e:
#         return jsonify({"error": str(e)})

# if __name__ == "__main__":
#     app.run(debug=True)

from flask import Flask, request, jsonify, render_template
import joblib
import os
from flask_cors import CORS
import json
import hashlib
from datetime import datetime
from twilio.rest import Client
import logging

# --- Flask App Setup ---
app = Flask(__name__, template_folder="../frontend", static_folder="../frontend/static")
CORS(app)

# --- Load ML Model and Vectorizer ---
model = joblib.load("smodel.pkl")
vectorizer = joblib.load("vectorizer.pkl")

# --- Twilio Config (Store securely using env vars in production) ---
TWILIO_SID = os.getenv("TWILIO_SID", "AC80cdf26fedce1feefc9b705250d1259d")
TWILIO_TOKEN = os.getenv("TWILIO_TOKEN", "20e0f39478d2cbc40471d8d140954154")
TWILIO_FROM = os.getenv("TWILIO_FROM", "+15618236424")
ALERT_TO = os.getenv("ALERT_TO", "+917337617229")

# --- Logging Utility ---
LOG_FILE = "logs.json"

def generate_log_hash(entry):
    log_str = json.dumps(entry, sort_keys=True)
    return hashlib.sha256(log_str.encode()).hexdigest()

def save_log(entry):
    entry["timestamp"] = datetime.utcnow().isoformat() + "Z"
    entry["hash"] = generate_log_hash(entry)
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")

def verify_log_integrity(entry):
    hash_original = entry.pop("hash", None)
    return hash_original == generate_log_hash(entry)

def get_all_logs():
    logs = []
    if not os.path.exists(LOG_FILE):
        return logs
    with open(LOG_FILE, "r") as f:
        for line in f:
            entry = json.loads(line)
            if verify_log_integrity(entry):
                logs.append(entry)
            else:
                logging.warning("⚠️ Log tampering detected.")
    return logs

# --- Alert System ---
def send_alert(description):
    try:
        client = Client(TWILIO_SID, TWILIO_TOKEN)
        message = client.messages.create(
            body=f"🚨 High severity threat detected: {description}",
            from_=TWILIO_FROM,
            to=ALERT_TO
        )
        print("📨 SMS sent:", message.sid)
    except Exception as e:
        logging.error(f"❌ Failed to send alert: {e}")

# --- Routes ---
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    desc = data.get("description", "").strip()

    if not desc:
        return jsonify({"severity": "Invalid input"})

    try:
        vec = vectorizer.transform([desc])
        pred = model.predict(vec)[0]
        print("✅ Prediction:", pred)

        # Save log
        log_entry = {"description": desc, "severity": pred}
        save_log(log_entry)

        # Trigger alert if High
        if pred.lower() == "high":
            send_alert(desc)

        return jsonify({"severity": pred})
    except Exception as e:
        print("❌ Prediction error:", e)
        return jsonify({"severity": "Error", "details": str(e)})


# --- Main Entry Point ---
if __name__ == "__main__":
    app.run(debug=True)

#Main🐥 from flask import Flask, request, jsonify, render_template
# import joblib
# import os
# from flask_cors import CORS



# app = Flask(__name__, template_folder="../frontend", static_folder="../frontend")
# CORS(app)
# # Load model and vectorizer
# model = joblib.load("smodel.pkl")
# vectorizer = joblib.load("vectorizer.pkl")


# @app.route("/")
# def index():
#     return render_template("index.html")


# @app.route("/predict", methods=["POST"])
# def predict():
#     data = request.get_json()
#     desc = data.get("description", "")
#     print("⚠️ Received description:", desc)

#     if not desc.strip():
#         return jsonify({"severity": "Invalid input"})

#     try:
#         vec = vectorizer.transform([desc])
#         pred = model.predict(vec)[0]
#         print("✅ Prediction:", pred)
#         return jsonify({"severity": pred})
#     except Exception as e:
#         print("❌ Prediction error:", e)
#         return jsonify({"severity": "Error"})

# if __name__ == "__main__":
#     app.run(debug=True)




# 1. from flask import Flask, request, jsonify, render_template
# import joblib
# import os
# from flask_cors import CORS
# import hashlib
# import json
# from twilio.rest import Client  # For Twilio
# import logging

# # Initialize Flask app
# app = Flask(__name__, template_folder="../frontend", static_folder="../frontend")
# CORS(app)

# # Load the model and vectorizer
# model = joblib.load("smodel.pkl")
# vectorizer = joblib.load("vectorizer.pkl")

# # EmailJS and Twilio configuration

# def send_sms_alert(threat_description):
#     account_sid = 'ACee4ebd009a7940024fc2b77311c3fe1f'
#     auth_token = 'c49c9863754c66affab433182d0a24b0'
#     client = Client(account_sid, auth_token)

#     message = client.messages.create(
#         body=f"A critical threat was detected: {threat_description}",
#         from_='+16062402987',  # Your Twilio number
#         to='+91 9036521571'  # Recipient's phone number
#     )

# # Logging setup (tamper-proof logs)
# def generate_log_hash(log_entry):
#     log_str = json.dumps(log_entry, sort_keys=True)
#     return hashlib.sha256(log_str.encode()).hexdigest()

# def save_log(log_entry):
#     log_hash = generate_log_hash(log_entry)
#     log_entry["hash"] = log_hash
#     with open('logs.json', 'a') as file:
#         file.write(json.dumps(log_entry) + "\n")

# def verify_log_integrity(log_entry):
#     original_hash = log_entry.pop("hash", None)
#     current_hash = generate_log_hash(log_entry)
#     return original_hash == current_hash

# def get_all_threats():
#     threats = []
#     with open('logs.json', 'r') as file:
#         for line in file:
#             log_entry = json.loads(line)
#             if verify_log_integrity(log_entry):
#                 threats.append(log_entry)
#             else:
#                 logging.warning("Log tampering detected.")
#     return threats


# @app.route("/")
# def index():
#     return render_template("index.html")


# @app.route("/predict", methods=["POST"])
# def predict():
#     data = request.get_json()
#     desc = data.get("description", "")
#     print("⚠️ Received description:", desc)

#     if not desc.strip():
#         return jsonify({"severity": "Invalid input"})

#     try:
#         vec = vectorizer.transform([desc])
#         pred = model.predict(vec)[0]
#         print("✅ Prediction:", pred)

#         # Log the threat (assuming prediction outputs severity such as 'Critical')
#         log_entry = {
#             "description": desc,
#             "severity": pred,
#             "timestamp": "2025-05-12T12:00:00Z"
#         }
#         save_log(log_entry)

#         # If the severity is "Critical", send an alert
#         if pred == "High":
#             send_sms_alert(desc)  # Or send_sms_alert(desc)

#         return jsonify({"severity": pred})
#     except Exception as e:
#         print("❌ Prediction error:", e)
#         return jsonify({"severity": "Error"})


# @app.route("/get_threats", methods=["GET"])
# def get_threats():
#     threats = get_all_threats()
#     return jsonify(threats)


# if __name__ == "__main__":
#     app.run(debug=True)

