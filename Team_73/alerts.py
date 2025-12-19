# alerts.py
# Simple Telegram alert sender (async, non-blocking)
# Uses python-telegram-bot v13.x style

import os
import threading

try:
    import telegram
except Exception as e:
    raise RuntimeError("Install python-telegram-bot: pip install python-telegram-bot==13.15") from e

# Read from env (recommended). Replace with literal strings if you prefer.
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")  # e.g. "123456:ABC-..."
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")      # e.g. "123456789"
ENABLE_TELEGRAM = os.environ.get("ENABLE_TELEGRAM_ALERTS", "1") not in ("0", "false", "False", "")

_bot = None
if ENABLE_TELEGRAM:
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("[alerts] WARNING: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set. Alerts disabled.")
        ENABLE_TELEGRAM = False
    else:
        try:
            _bot = telegram.Bot(token=TELEGRAM_BOT_TOKEN)
            # optional: test call to get_me() commented out
            # print("[alerts] Telegram bot ready:", _bot.get_me())
        except Exception as e:
            print("[alerts] Failed to initialize Telegram bot:", e)
            _bot = None
            ENABLE_TELEGRAM = False

def _send(message: str, image_path: str | None = None):
    """
    Blocking send (private). Not used directly from camera to avoid blocking UI.
    """
    if not ENABLE_TELEGRAM or _bot is None:
        print("[alerts] Telegram disabled or bot unavailable. Message:", message)
        return

    try:
        if image_path and os.path.exists(image_path):
            with open(image_path, "rb") as f:
                _bot.send_photo(chat_id=TELEGRAM_CHAT_ID, photo=f, caption=message)
        else:
            _bot.send_message(chat_id=TELEGRAM_CHAT_ID, text=message)
        print("[alerts] Telegram alert sent:", message)
    except Exception as e:
        print("[alerts] Failed to send Telegram alert:", e)

def send_alert_async(message: str, image_path: str | None = None):
    """
    Start a background thread to send the alert so camera streaming isn't blocked.
    """
    if not ENABLE_TELEGRAM:
        return
    t = threading.Thread(target=_send, args=(message, image_path), daemon=True)
    t.start()
