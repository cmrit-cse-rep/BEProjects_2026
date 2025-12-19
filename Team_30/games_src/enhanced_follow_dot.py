# Enhanced Follow the Dot Game with Web Integration and Autism-Friendly UX
# Uses defined patterns, proper start/summary screens, sound feedback and smooth hand tracking.
# IMPORTANT: API payload, game_name, paths and config usage kept compatible with original.

import os
import sys
import math
import json
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

screen_width, screen_height = 800, 600
screen = pygame.display.set_mode((screen_width, screen_height))
pygame.display.set_caption("NeuroPlay: Follow the Dot - Enhanced")
clock = pygame.time.Clock()
font = pygame.font.SysFont("comicsansms", 32)
small_font = pygame.font.SysFont("comicsansms", 24)

# Colors (gentle palette)
CALM_BLUE = (107, 141, 181)
SOFT_GREEN = (125, 179, 131)
WARM_YELLOW = (244, 194, 122)
GENTLE_PURPLE = (171, 146, 191)
LIGHT_GRAY = (245, 245, 245)
DARK_GRAY = (50, 50, 50)
WHITE = (255, 255, 255)

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
            background_image, (screen_width, screen_height)
        )

    menu_bg_path = os.path.join(ASSETS_DIR, "menu_bg.jpg")
    if os.path.exists(menu_bg_path):
        menu_background_image = pygame.image.load(menu_bg_path).convert()
        menu_background_image = pygame.transform.scale(
            menu_background_image, (screen_width, screen_height)
        )
except Exception as e:
    print(f"⚠️ Could not load background images: {e}")

SOUND_ENABLED = False
start_sound = level_up_sound = success_sound = timeout_sound = complete_sound = None

try:
    pygame.mixer.init()
    SOUND_ENABLED = True

    def load_sound(name):
        path = os.path.join(SOUNDS_DIR, name)
        if os.path.exists(path):
            return pygame.mixer.Sound(path)
        return None

    start_sound = load_sound("start.wav")
    level_up_sound = load_sound("level_up.wav")
    success_sound = load_sound("success.wav")
    timeout_sound = load_sound("timeout.wav")
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

# Camera
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("❌ Error: Could not open camera")
    pygame.quit()
    sys.exit()

# --------------------------------------------------
# Pattern definitions (normalized 0..1) and difficulty ramp
# --------------------------------------------------
# These are calm, predictable paths that become slightly more complex.
PATTERN_DEFS = {
    # Straight horizontal line
    "line_horizontal": [
        (0.2, 0.5),
        (0.3, 0.5),
        (0.4, 0.5),
        (0.5, 0.5),
        (0.6, 0.5),
        (0.7, 0.5),
    ],
    # Straight vertical line
    "line_vertical": [
        (0.5, 0.2),
        (0.5, 0.3),
        (0.5, 0.4),
        (0.5, 0.5),
        (0.5, 0.6),
        (0.5, 0.7),
    ],
    # Small square
    "square_small": [
        (0.35, 0.35),
        (0.65, 0.35),
        (0.65, 0.65),
        (0.35, 0.65),
    ],
    # Larger square
    "square_large": [
        (0.25, 0.25),
        (0.75, 0.25),
        (0.75, 0.75),
        (0.25, 0.75),
    ],
    # Small circle (approx)
    "circle_small": [
        (0.5 + 0.20 * math.cos(a), 0.5 + 0.20 * math.sin(a))
        for a in [i * (2 * math.pi / 12) for i in range(12)]
    ],
    # Zig-zag
    "zigzag": [
        (0.25, 0.35),
        (0.35, 0.55),
        (0.45, 0.35),
        (0.55, 0.55),
        (0.65, 0.35),
        (0.75, 0.55),
    ],
}


def pattern_for_level(level: int):
    """
    Map level to a pattern name & difficulty parameters.
    Difficulty ramp:
      - Starts with straight lines
      - Then squares
      - Then circle / zigzag
      - Hit radius shrinks slowly
    """
    if level <= 2:
        name = "line_horizontal"
    elif level <= 4:
        name = "line_vertical"
    elif level <= 6:
        name = "square_small"
    elif level <= 8:
        name = "square_large"
    elif level <= 10:
        name = "circle_small"
    else:
        name = "zigzag"

    # Hit radius tightens slowly but never too small
    hit_radius = max(20, 45 - (level - 1) * 2)
    return name, hit_radius


def build_pattern(pattern_name: str):
    """Convert normalized pattern coordinates to screen pixel coordinates."""
    points = PATTERN_DEFS[pattern_name]
    scaled = []
    for nx, ny in points:
        x = int(nx * screen_width)
        y = int(ny * screen_height)
        scaled.append((x, y))
    return scaled


def calculate_smoothness(hand_history):
    if len(hand_history) < 3:
        return 100.0
    velocities = []
    for i in range(1, len(hand_history)):
        dx = hand_history[i][0] - hand_history[i - 1][0]
        dy = hand_history[i][1] - hand_history[i - 1][1]
        v = math.sqrt(dx * dx + dy * dy)
        velocities.append(v)
    if not velocities:
        return 100.0
    avg_v = sum(velocities) / len(velocities)
    var = sum((v - avg_v) ** 2 for v in velocities) / len(velocities)
    return max(0, 100 - var)


def calculate_precision(hand_pos, target_pos, tolerance=50):
    dx = hand_pos[0] - target_pos[0]
    dy = hand_pos[1] - target_pos[1]
    dist = math.sqrt(dx * dx + dy * dy)
    return max(0, 100 - (dist / tolerance) * 100)


def draw_text_center(text, font_obj, color, y_pos):
    surface = font_obj.render(text, True, color)
    rect = surface.get_rect(center=(screen_width // 2, y_pos))
    screen.blit(surface, rect)


def get_hand_position(frame, state):
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(frame_rgb)

    if results.multi_hand_landmarks and results.multi_handedness:
        hand_landmarks = results.multi_hand_landmarks[0]
        handedness = results.multi_handedness[0].classification[0].label

        tip = hand_landmarks.landmark[8]
        x = int(tip.x * screen_width)
        y = int(tip.y * screen_height)

        if handedness == "Left":
            state.left_hand_count += 1
            state.session_data["hand_dominance"]["left"] += 1
        else:
            state.right_hand_count += 1
            state.session_data["hand_dominance"]["right"] += 1

        return (x, y)
    return None


# --------------------------------------------------
# Game state
# --------------------------------------------------
class GameState:
    def __init__(self):
        self.score = 0
        self.level = 1
        self.patterns_completed = 0

        self.current_pattern_name = None
        self.hit_radius = 40
        self.current_pattern = []
        self.current_point_index = 0

        self.hand_position = None
        self.hand_history = deque(maxlen=10)

        self.left_hand_count = 0
        self.right_hand_count = 0
        self.total_tries = 0
        self.right_tries = 0
        self.wrong_tries = 0

        self.pattern_start_time = None
        self.completion_times = []
        self.movement_smoothness_scores = []
        self.precision_scores = []

        self.running = True
        self.phase = "MENU"  # "MENU", "PLAYING", "SUMMARY"

        self.session_data = {
            "game_name": "follow_dot",
            "user_id": game_config.get_user_id(),
            "start_time": pygame.time.get_ticks(),
            "movements": [],
            "accuracy_data": [],
            "completion_times": [],
            "hand_dominance": {"left": 0, "right": 0},
            "smoothness_scores": [],
            "precision_scores": [],
        }


game_state = GameState()

# --------------------------------------------------
# Web API integration
# --------------------------------------------------
def send_session_data(state: GameState):
    if not WEB_INTEGRATION:
        print("⚠️ Web integration disabled.")
        return

    try:
        session_duration = (
            pygame.time.get_ticks() - state.session_data["start_time"]
        ) / 1000.0

        payload = {
            "game_name": "follow_dot",
            "user_id": state.session_data["user_id"],
            "score": state.score,
            "level": state.level,
            "session_duration": session_duration,
            "total_tries": state.total_tries,
            "right_tries": state.right_tries,
            "wrong_tries": state.wrong_tries,
            "left_hand_count": state.left_hand_count,
            "right_hand_count": state.right_hand_count,
            "patterns_completed": state.patterns_completed,
            "movement_analysis": {
                "smoothness_scores": state.movement_smoothness_scores,
                "precision_scores": state.precision_scores,
                "completion_times": state.completion_times,
            },
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
def start_new_pattern(state: GameState):
    state.current_pattern_name, state.hit_radius = pattern_for_level(state.level)
    state.current_pattern = build_pattern(state.current_pattern_name)
    state.current_point_index = 0
    state.pattern_start_time = pygame.time.get_ticks()


def start_game(state: GameState):
    # Reset core values but keep config / user id
    uid = state.session_data["user_id"]
    state.__init__()
    state.session_data["user_id"] = uid
    state.phase = "PLAYING"
    state.session_data["start_time"] = pygame.time.get_ticks()
    start_new_pattern(state)
    play_sound(start_sound)
    start_bgm()
    print("▶ Game started")


def go_to_summary(state: GameState):
    state.phase = "SUMMARY"
    stop_bgm()
    play_sound(complete_sound)
    print("ℹ️ Entering summary screen")


# --------------------------------------------------
# Main loop
# --------------------------------------------------
print("🎮 NeuroPlay Follow the Dot – starting game loop")

while game_state.running:
    dt_ms = clock.get_time()
    dt = dt_ms / 1000.0

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            game_state.running = False
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                # Child / parent can quit anytime; data still sent at the end.
                game_state.running = False
            elif event.key == pygame.K_SPACE:
                if game_state.phase in ("MENU", "SUMMARY"):
                    start_game(game_state)
            elif event.key == pygame.K_q:
                # Q = “I’m tired, show me my results now”
                if game_state.phase == "PLAYING":
                    go_to_summary(game_state)

    # ---------------- MENU PHASE ----------------
    if game_state.phase == "MENU":
        if menu_background_image:
            screen.blit(menu_background_image, (0, 0))
        else:
            screen.fill(LIGHT_GRAY)

        draw_text_center("NeuroPlay: Follow the Dot", font, CALM_BLUE, 150)
        draw_text_center(
            "Place your hand in front of the camera", small_font, DARK_GRAY, 230
        )
        draw_text_center(
            "Gently follow each dot, one by one", small_font, DARK_GRAY, 270
        )
        draw_text_center(
            "Smooth and steady is more important than speed",
            small_font,
            DARK_GRAY,
            310,
        )
        draw_text_center("Press SPACE to start", small_font, GENTLE_PURPLE, 360)
        draw_text_center("Press ESC to go back to NeuroPlay", small_font, GENTLE_PURPLE, 395)

        pygame.display.flip()
        clock.tick(30)
        continue

    # ---------------- SUMMARY PHASE ----------------
    if game_state.phase == "SUMMARY":
        if background_image:
            screen.blit(background_image, (0, 0))
        else:
            screen.fill(LIGHT_GRAY)

        draw_text_center("Great job!", font, SOFT_GREEN, 150)
        draw_text_center(f"Final Score: {game_state.score}", small_font, DARK_GRAY, 220)
        draw_text_center(
            f"Level Reached: {game_state.level}", small_font, DARK_GRAY, 260
        )
        draw_text_center(
            f"Patterns Completed: {game_state.patterns_completed}",
            small_font,
            DARK_GRAY,
            300,
        )
        draw_text_center("Press SPACE to play again", small_font, GENTLE_PURPLE, 360)
        draw_text_center("Press ESC to return to NeuroPlay", small_font, GENTLE_PURPLE, 395)

        pygame.display.flip()
        clock.tick(30)
        continue

    # ---------------- PLAYING PHASE ----------------
    # Get camera frame
    ret, frame = cap.read()
    if not ret:
        print("❌ Failed to capture camera frame")
        break
    frame = cv2.flip(frame, 1)

    raw_hand_pos = get_hand_position(frame, game_state)

    # Smooth hand cursor
    if raw_hand_pos:
        if game_state.hand_position is None:
            smoothed = raw_hand_pos
        else:
            alpha = 0.4
            smoothed = (
                int(alpha * raw_hand_pos[0] + (1 - alpha) * game_state.hand_position[0]),
                int(alpha * raw_hand_pos[1] + (1 - alpha) * game_state.hand_position[1]),
            )
        game_state.hand_position = smoothed
        game_state.hand_history.append(smoothed)
    else:
        game_state.hand_position = None

    # Check hit on current dot
    if (
        game_state.hand_position
        and game_state.current_point_index < len(game_state.current_pattern)
    ):
        target = game_state.current_pattern[game_state.current_point_index]
        dx = game_state.hand_position[0] - target[0]
        dy = game_state.hand_position[1] - target[1]
        dist = math.sqrt(dx * dx + dy * dy)

        if dist < game_state.hit_radius:
            smoothness = calculate_smoothness(game_state.hand_history)
            precision = calculate_precision(
                game_state.hand_position, target, tolerance=game_state.hit_radius
            )

            game_state.movement_smoothness_scores.append(smoothness)
            game_state.precision_scores.append(precision)

            game_state.score += 10
            game_state.right_tries += 1
            game_state.total_tries += 1
            game_state.current_point_index += 1
            play_sound(success_sound)

            if game_state.current_point_index >= len(game_state.current_pattern):
                # pattern completed
                completion_time = (
                    pygame.time.get_ticks() - game_state.pattern_start_time
                ) / 1000.0
                game_state.completion_times.append(completion_time)

                game_state.patterns_completed += 1
                game_state.level += 1
                game_state.score += 40  # bonus
                play_sound(level_up_sound)
                start_new_pattern(game_state)

    # --------------- Drawing ---------------
    if background_image:
        screen.blit(background_image, (0, 0))
    else:
        screen.fill(LIGHT_GRAY)

    # draw pattern
    for i, pt in enumerate(game_state.current_pattern):
        if i < game_state.current_point_index:
            pygame.draw.circle(screen, SOFT_GREEN, pt, 15)
        elif i == game_state.current_point_index:
            pulse = 18 + 6 * math.sin(pygame.time.get_ticks() / 180)
            pygame.draw.circle(screen, WARM_YELLOW, pt, int(pulse))
        else:
            pygame.draw.circle(screen, CALM_BLUE, pt, 12)

        if i > 0:
            color = SOFT_GREEN if i <= game_state.current_point_index else CALM_BLUE
            pygame.draw.line(screen, color, game_state.current_pattern[i - 1], pt, 2)

    # hand cursor
    if game_state.hand_position:
        pygame.draw.circle(screen, GENTLE_PURPLE, game_state.hand_position, 20, 3)
        pygame.draw.circle(screen, GENTLE_PURPLE, game_state.hand_position, 6)
    else:
        draw_text_center(
            "Show your hand to the camera", small_font, DARK_GRAY, screen_height - 40
        )

    # HUD
    score_text = small_font.render(f"Score: {game_state.score}", True, DARK_GRAY)
    level_text = small_font.render(f"Level: {game_state.level}", True, DARK_GRAY)
    pattern_text = small_font.render(
        f"Pattern: {game_state.current_pattern_name}  (radius {game_state.hit_radius}px)",
        True,
        DARK_GRAY,
    )
    hand_text = small_font.render(
        f"Hand use  L:{game_state.left_hand_count}  R:{game_state.right_hand_count}",
        True,
        DARK_GRAY,
    )

    screen.blit(score_text, (10, 10))
    screen.blit(level_text, (10, 40))
    screen.blit(pattern_text, (10, 70))
    screen.blit(hand_text, (10, 100))

    pygame.display.flip()
    clock.tick(30)

# --------------------------------------------------
# Exit: send session data & clean up
# --------------------------------------------------
print("\n🎮 Game session ended")
print(f"📊 Final Score: {game_state.score}")
print(f"📈 Level Reached: {game_state.level}")
print(f"🎯 Patterns Completed: {game_state.patterns_completed}")
print("Sending session data to server...")

send_session_data(game_state)

cap.release()
hands.close()
stop_bgm(fade_ms=400)
pygame.quit()
sys.exit()
