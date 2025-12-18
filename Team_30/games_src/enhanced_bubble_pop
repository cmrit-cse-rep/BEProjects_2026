# Enhanced Pop the Bubble Game with Web Integration and Autism-Friendly UX
# IMPORTANT:
# - Keeps API payload and "game_name": "bubble_pop" the same as before.
# - Uses assets/sounds under games_src/assets/sounds.
# - Adds start menu, summary screen, difficulty ramp, and clean early-exit.

import os
import sys
import math
import time
import random
from collections import deque
from datetime import datetime

import pygame
import cv2
import mediapipe as mp

# --------------------------------------------------
# Path setup so we can import game_config from project root
# --------------------------------------------------
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from game_config import game_config  # noqa: E402

# Web integration
try:
    import requests

    WEB_INTEGRATION = True
except ImportError:
    WEB_INTEGRATION = False
    print("⚠️ requests library not found. Running without web integration.")

API_BASE_URL = game_config.get_api_url()

# --------------------------------------------------
# Pygame / mixer init
# --------------------------------------------------
pygame.mixer.pre_init(44100, -16, 2, 512)
pygame.init()

SCREEN_WIDTH, SCREEN_HEIGHT = 800, 600
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("NeuroPlay: Bubble Pop - Enhanced")

clock = pygame.time.Clock()
font_path = pygame.font.match_font("comicsansms")
fancy_font = pygame.font.Font(font_path, 36)
medium_font = pygame.font.Font(font_path, 28)
small_font = pygame.font.Font(font_path, 20)

# Autism-friendly colors
CALM_BLUE = (107, 141, 181)
SOFT_GREEN = (125, 179, 131)
WARM_YELLOW = (244, 194, 122)
GENTLE_PURPLE = (171, 146, 191)
LIGHT_GRAY = (245, 245, 245)
DARK_GRAY = (50, 50, 50)
WHITE = (255, 255, 255)
SOFT_PINK = (255, 182, 193)
MINT_GREEN = (152, 251, 152)

# --------------------------------------------------
# Assets: backgrounds & sounds
# --------------------------------------------------
ASSETS_DIR = os.path.join(CURRENT_DIR, "assets")
SOUNDS_DIR = os.path.join(ASSETS_DIR, "sounds")

background_image = None
menu_background_image = None

try:
    bg_path = os.path.join(ASSETS_DIR, "bg.jpg")
    if os.path.exists(bg_path):
        background_image = pygame.image.load(bg_path).convert()
        background_image = pygame.transform.scale(
            background_image, (SCREEN_WIDTH, SCREEN_HEIGHT)
        )

    menu_bg_path = os.path.join(ASSETS_DIR, "menu_bg.jpg")
    if os.path.exists(menu_bg_path):
        menu_background_image = pygame.image.load(menu_bg_path).convert()
        menu_background_image = pygame.transform.scale(
            menu_background_image, (SCREEN_WIDTH, SCREEN_HEIGHT)
        )
except Exception as e:
    print(f"⚠️ Could not load background images: {e}")

SOUND_ENABLED = False
pop_sound = None
start_sound = level_up_sound = complete_sound = None

try:
    pygame.mixer.init()
    SOUND_ENABLED = True

    def load_sound(name):
        path = os.path.join(SOUNDS_DIR, name)
        if os.path.exists(path):
            return pygame.mixer.Sound(path)
        return None

    pop_sound = load_sound("pop.wav")
    start_sound = load_sound("start.wav")
    level_up_sound = load_sound("level_up.wav")
    complete_sound = load_sound("complete.wav")

    bgm_path = os.path.join(SOUNDS_DIR, "bgm.wav")
    if os.path.exists(bgm_path):
        pygame.mixer.music.load(bgm_path)
        pygame.mixer.music.set_volume(0.35)
    else:
        print("⚠️ bgm.wav not found – no background music")

except Exception as e:
    print(f"⚠️ Could not initialize sounds: {e}")
    SOUND_ENABLED = False


def play_sound(snd):
    if SOUND_ENABLED and snd is not None:
        snd.play()


def start_bgm():
    if SOUND_ENABLED:
        try:
            if not pygame.mixer.music.get_busy():
                pygame.mixer.music.play(-1)
        except Exception as e:
            print(f"⚠️ Could not play bgm: {e}")


def stop_bgm(fade_ms=800):
    if SOUND_ENABLED:
        try:
            pygame.mixer.music.fadeout(fade_ms)
        except Exception:
            pass


# --------------------------------------------------
# MediaPipe hands
# --------------------------------------------------
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7,
)

# Camera setup
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("❌ Error: Could not open camera")
    pygame.quit()
    sys.exit()

# --------------------------------------------------
# Difficulty / patterns
# --------------------------------------------------
def difficulty_for_level(level: int):
    """
    Return difficulty parameters for a given level.
    Increasing difficulty:
      - shorter spawn interval
      - more bubbles on screen
      - shorter lifetime
      - slightly smaller bubbles
    """
    level = max(1, level)
    spawn_interval = max(0.7, 2.0 - (level - 1) * 0.12)  # from 2.0s → 0.7s
    max_bubbles = min(2 + level // 2, 8)  # 2 → up to 8
    lifetime = max(2.5, 5.5 - (level - 1) * 0.18)  # 5.5s → 2.5s
    min_radius = max(25, 45 - (level - 1))  # 45 → 25
    max_radius = min_radius + 20
    return {
        "spawn_interval": spawn_interval,
        "max_bubbles": max_bubbles,
        "lifetime": lifetime,
        "min_radius": min_radius,
        "max_radius": max_radius,
    }


# --------------------------------------------------
# Bubble class
# --------------------------------------------------
class Bubble:
    def __init__(self, level_params):
        self.required_hand = random.choice(["Left", "Right"])

        # Spawn location biased to left/right side for clarity
        margin = 60
        if self.required_hand == "Left":
            x_min, x_max = margin, int(SCREEN_WIDTH * 0.45)
        else:
            x_min, x_max = int(SCREEN_WIDTH * 0.55), SCREEN_WIDTH - margin
        self.x = random.randint(x_min, x_max)

        self.y = random.randint(80, SCREEN_HEIGHT - 80)
        self.radius = random.randint(
            level_params["min_radius"], level_params["max_radius"]
        )
        self.color = random.choice(
            [CALM_BLUE, SOFT_GREEN, WARM_YELLOW, GENTLE_PURPLE, SOFT_PINK, MINT_GREEN]
        )
        self.creation_time = time.time()
        self.lifetime = level_params["lifetime"]
        self.popped = False

    def draw(self, surface):
        if self.popped:
            return
        # Soft gradient
        for r in range(self.radius, 0, -3):
            alpha_factor = r / self.radius
            color_with_alpha = tuple(
                min(255, int(c * (0.7 + 0.3 * alpha_factor))) for c in self.color
            )
            pygame.draw.circle(surface, color_with_alpha, (self.x, self.y), r)

        # Shine
        shine_offset = self.radius // 3
        pygame.draw.circle(
            surface, WHITE, (self.x - shine_offset, self.y - shine_offset), self.radius // 4
        )

        # Hand indicator (L/R)
        indicator = small_font.render(self.required_hand[0], True, DARK_GRAY)
        rect = indicator.get_rect(center=(self.x, self.y))
        surface.blit(indicator, rect)

    def is_expired(self):
        return (time.time() - self.creation_time) > self.lifetime

    def check_collision(self, hand_pos, handedness):
        if self.popped:
            return False
        if handedness != self.required_hand:
            return False

        dx = hand_pos[0] - self.x
        dy = hand_pos[1] - self.y
        dist = math.sqrt(dx * dx + dy * dy)
        return dist < self.radius


# --------------------------------------------------
# Game state
# --------------------------------------------------
class GameState:
    def __init__(self):
        self.score = 0
        self.level = 1
        self.bubbles = []
        self.popped_count = 0
        self.missed_count = 0
        self.left_hand_pops = 0
        self.right_hand_pops = 0
        self.reaction_times = []
        self.hand_coordination = {
            "left_success": 0,
            "right_success": 0,
            "left_miss": 0,
            "right_miss": 0,
        }
        self.squeeze_count = 0
        self.start_time = time.time()
        self.running = True
        self.phase = "MENU"  # "MENU", "PLAYING", "SUMMARY"
        self.last_bubble_spawn = time.time()

        self.level_params = difficulty_for_level(self.level)

        self.session_data = {
            "game_name": "bubble_pop",
            "user_id": game_config.get_user_id(),
            "start_time": self.start_time,
            "reaction_times": [],
            "accuracy_data": [],
            "hand_coordination": {
                "left_success": 0,
                "right_success": 0,
                "left_miss": 0,
                "right_miss": 0,
            },
            "bubble_positions": [],
            "squeeze_detection_data": [],
        }


game_state = GameState()


# --------------------------------------------------
# Gesture detection
# --------------------------------------------------
def detect_squeeze(hand_landmarks):
    thumb_tip = hand_landmarks.landmark[4]
    index_tip = hand_landmarks.landmark[8]
    dist = math.sqrt(
        (thumb_tip.x - index_tip.x) ** 2 + (thumb_tip.y - index_tip.y) ** 2
    )
    return dist < 0.05  # threshold


def get_hands_data(frame, state: GameState):
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(frame_rgb)

    hands_data = []

    if results.multi_hand_landmarks and results.multi_handedness:
        for hand_lm, handedness in zip(
            results.multi_hand_landmarks, results.multi_handedness
        ):
            label = handedness.classification[0].label

            tip = hand_lm.landmark[8]
            x = int(tip.x * SCREEN_WIDTH)
            y = int(tip.y * SCREEN_HEIGHT)

            squeezed = detect_squeeze(hand_lm)

            hands_data.append(
                {
                    "position": (x, y),
                    "handedness": label,
                    "squeezed": squeezed,
                    "landmarks": hand_lm,
                }
            )

    return hands_data


# --------------------------------------------------
# Spawning & API
# --------------------------------------------------
def spawn_bubble(state: GameState):
    if len(state.bubbles) < state.level_params["max_bubbles"]:
        bubble = Bubble(state.level_params)
        state.bubbles.append(bubble)
        state.session_data["bubble_positions"].append(
            {
                "x": bubble.x,
                "y": bubble.y,
                "hand": bubble.required_hand,
                "timestamp": time.time(),
            }
        )


def send_session_data():
    """Send session data to web API (payload kept identical to original)."""
    if not WEB_INTEGRATION:
        print("⚠️ Web integration disabled")
        return

    try:
        session_duration = time.time() - game_state.session_data["start_time"]
        total_attempts = game_state.popped_count + game_state.missed_count
        accuracy = (game_state.popped_count / max(1, total_attempts)) * 100

        payload = {
            "game_name": "bubble_pop",
            "user_id": game_config.get_user_id(),
            "score": game_state.score,
            "level": game_state.level,
            "session_duration": session_duration,
            "total_attempts": total_attempts,
            "successful_attempts": game_state.popped_count,
            "left_hand_count": game_state.left_hand_pops,
            "right_hand_count": game_state.right_hand_pops,
            "reaction_times": game_state.reaction_times,
            "hand_coordination": game_state.hand_coordination,
            "squeeze_count": game_state.squeeze_count,
            "accuracy_percentage": accuracy,
            "timestamp": datetime.now().isoformat(),
        }

        resp = requests.post(
            f"{API_BASE_URL}/record_session",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=5,
        )

        if resp.status_code == 200:
            print("✅ Session data sent successfully!")
            try:
                print(f"Response: {resp.json()}")
            except Exception:
                print(f"Response: {resp.text}")
        else:
            print(f"⚠️ Failed to send session data: {resp.status_code}")
            print(f"Response: {resp.text}")

    except Exception as e:
        print(f"❌ Error sending session data: {e}")


# --------------------------------------------------
# Game helpers
# --------------------------------------------------
def draw_text_center(text, font_obj, color, y):
    surf = font_obj.render(text, True, color)
    rect = surf.get_rect(center=(SCREEN_WIDTH // 2, y))
    screen.blit(surf, rect)


def start_game(state: GameState):
    uid = state.session_data["user_id"]
    state.__init__()  # reset
    state.session_data["user_id"] = uid
    state.phase = "PLAYING"
    state.session_data["start_time"] = time.time()
    state.level_params = difficulty_for_level(state.level)
    state.last_bubble_spawn = time.time()
    play_sound(start_sound)
    start_bgm()
    print("▶ Bubble Pop game started")


def go_to_summary(state: GameState):
    state.phase = "SUMMARY"
    stop_bgm()
    play_sound(complete_sound)
    print("ℹ️ Entering Bubble Pop summary")


# --------------------------------------------------
# Main loop
# --------------------------------------------------
print("🎮 NeuroPlay Bubble Pop – starting game loop")

while game_state.running:
    dt = clock.get_time() / 1000.0

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            game_state.running = False
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                game_state.running = False  # child/parent can quit any time
            elif event.key == pygame.K_SPACE:
                if game_state.phase in ("MENU", "SUMMARY"):
                    start_game(game_state)
            elif event.key == pygame.K_q:
                # Q = tired / stop session and go to summary
                if game_state.phase == "PLAYING":
                    go_to_summary(game_state)

    # -------- MENU PHASE --------
    if game_state.phase == "MENU":
        if menu_background_image:
            screen.blit(menu_background_image, (0, 0))
        else:
            screen.fill(LIGHT_GRAY)

        draw_text_center("NeuroPlay: Bubble Pop", fancy_font, CALM_BLUE, 150)
        draw_text_center(
            "Show your hands to the camera and SQUEEZE to pop bubbles!",
            small_font,
            DARK_GRAY,
            230,
        )
        draw_text_center(
            "Use LEFT hand for bubbles on the left, RIGHT hand for the right.",
            small_font,
            DARK_GRAY,
            270,
        )
        draw_text_center(
            "Bubbles appear slowly at first and then get a bit faster.",
            small_font,
            DARK_GRAY,
            310,
        )
        draw_text_center("Press SPACE to start", small_font, GENTLE_PURPLE, 360)
        draw_text_center("Press ESC to go back to NeuroPlay", small_font, GENTLE_PURPLE, 395)

        pygame.display.flip()
        clock.tick(30)
        continue

    # -------- SUMMARY PHASE --------
    if game_state.phase == "SUMMARY":
        if background_image:
            screen.blit(background_image, (0, 0))
        else:
            screen.fill(LIGHT_GRAY)

        draw_text_center("Nice work!", fancy_font, SOFT_GREEN, 150)
        draw_text_center(f"Final Score: {game_state.score}", medium_font, DARK_GRAY, 220)
        draw_text_center(
            f"Level Reached: {game_state.level}", medium_font, DARK_GRAY, 260
        )
        draw_text_center(
            f"Bubbles Popped: {game_state.popped_count}", medium_font, DARK_GRAY, 300
        )
        draw_text_center(
            f"Bubbles Missed: {game_state.missed_count}", medium_font, DARK_GRAY, 340
        )

        draw_text_center("Press SPACE to play again", small_font, GENTLE_PURPLE, 400)
        draw_text_center("Press ESC to return to NeuroPlay", small_font, GENTLE_PURPLE, 435)

        pygame.display.flip()
        clock.tick(30)
        continue

    # -------- PLAYING PHASE --------
    # Get camera frame
    ret, frame = cap.read()
    if not ret:
        print("❌ Failed to get camera frame")
        break
    frame = cv2.flip(frame, 1)

    hands_data = get_hands_data(frame, game_state)

    # Spawn bubbles according to difficulty
    now = time.time()
    if now - game_state.last_bubble_spawn > game_state.level_params["spawn_interval"]:
        spawn_bubble(game_state)
        game_state.last_bubble_spawn = now

    # Check collisions when squeezing
    for hand in hands_data:
        if hand["squeezed"]:
            for bubble in game_state.bubbles:
                if bubble.check_collision(hand["position"], hand["handedness"]):
                    reaction_time = time.time() - bubble.creation_time
                    game_state.reaction_times.append(reaction_time)

                    bubble.popped = True
                    game_state.score += 10
                    game_state.popped_count += 1
                    game_state.squeeze_count += 1

                    if hand["handedness"] == "Left":
                        game_state.left_hand_pops += 1
                        game_state.hand_coordination["left_success"] += 1
                    else:
                        game_state.right_hand_pops += 1
                        game_state.hand_coordination["right_success"] += 1

                    play_sound(pop_sound)

                    # Level-up every 12 pops
                    if game_state.popped_count % 12 == 0:
                        game_state.level += 1
                        game_state.level_params = difficulty_for_level(game_state.level)
                        play_sound(level_up_sound)

    # Remove expired / popped bubbles
    for bubble in game_state.bubbles[:]:
        if bubble.is_expired() and not bubble.popped:
            game_state.missed_count += 1
            if bubble.required_hand == "Left":
                game_state.hand_coordination["left_miss"] += 1
            else:
                game_state.hand_coordination["right_miss"] += 1
            game_state.bubbles.remove(bubble)
        elif bubble.popped:
            game_state.bubbles.remove(bubble)

    # Draw background
    if background_image:
        screen.blit(background_image, (0, 0))
    else:
        screen.fill(LIGHT_GRAY)

    # Draw bubbles
    for bubble in game_state.bubbles:
        bubble.draw(screen)

    # Draw hand cursors
    for hand in hands_data:
        color = SOFT_PINK if hand["handedness"] == "Left" else MINT_GREEN
        if hand["squeezed"]:
            pygame.draw.circle(screen, color, hand["position"], 25)
        else:
            pygame.draw.circle(screen, color, hand["position"], 15, 3)

    # HUD
    score_text = medium_font.render(f"Score: {game_state.score}", True, DARK_GRAY)
    level_text = small_font.render(f"Level: {game_state.level}", True, DARK_GRAY)
    popped_text = small_font.render(
        f"Popped: {game_state.popped_count}", True, SOFT_GREEN
    )
    missed_text = small_font.render(
        f"Missed: {game_state.missed_count}", True, WARM_YELLOW
    )
    hand_text = small_font.render(
        f"L Pops: {game_state.left_hand_pops} | R Pops: {game_state.right_hand_pops}",
        True,
        DARK_GRAY,
    )

    screen.blit(score_text, (10, 10))
    screen.blit(level_text, (10, 45))
    screen.blit(popped_text, (10, 75))
    screen.blit(missed_text, (10, 105))
    screen.blit(hand_text, (10, 135))

    if not hands_data:
        draw_text_center(
            "Show your hands and SQUEEZE to pop!",
            small_font,
            DARK_GRAY,
            SCREEN_HEIGHT - 35,
        )

    pygame.display.flip()
    clock.tick(30)

# --------------------------------------------------
# Game ended – send session data & clean up
# --------------------------------------------------
print("\n🎮 Game session ended")
print(f"📊 Final Score: {game_state.score}")
print(f"📈 Level Reached: {game_state.level}")
print(f"🎯 Bubbles Popped: {game_state.popped_count}")
print(f"❌ Bubbles Missed: {game_state.missed_count}")
print("Sending session data to server...")

send_session_data()

cap.release()
hands.close()
stop_bgm(fade_ms=400)
pygame.quit()
sys.exit()
