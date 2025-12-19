
import os
import telegram


class AlertManager:
    def __init__(self):
        # Load Telegram bot token and chat ID from environment variables
        self.token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID")

        if not self.token or not self.chat_id:
            raise ValueError(
                "⚠️ TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set as environment variables"
            )

        # Initialize the Telegram bot
        self.bot = telegram.Bot(token=self.token)
        print("[AlertManager] Telegram bot initialized ✅")

    def send_message(self, text: str):
        """Send a plain text alert"""
        try:
            self.bot.send_message(chat_id=self.chat_id, text=text)
            print("[AlertManager] Sent text alert")
        except Exception as e:
            print("[AlertManager] Failed to send message:", e)

    def send_photo(self, photo_path: str, caption: str = None):
        """Send an image with optional caption"""
        try:
            with open(photo_path, "rb") as photo:
                self.bot.send_photo(chat_id=self.chat_id, photo=photo, caption=caption)
            print(f"[AlertManager] Sent photo alert: {photo_path}")
        except Exception as e:
            print("[AlertManager] Failed to send photo:", e)