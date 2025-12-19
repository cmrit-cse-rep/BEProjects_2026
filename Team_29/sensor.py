import RPi.GPIO as GPIO
import time
import pyttsx3

# Initialize Text-to-Speech
engine = pyttsx3.init()
engine.setProperty('rate', 150)  # Speed of speech
engine.setProperty('volume', 1.0)  # Volume (0.0 to 1.0)

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

# ---------------------------
# PIN SETUP (Updated)
# ---------------------------

# Ultrasonic
TRIG = 23      # Pin 16
ECHO = 24      # Pin 18 (with voltage divider)

# Sensors (same as before, change if needed)
FLAME = 17
WATER = 27

# Buzzer
BUZZER = 18    # Pin 12 (IO pin)

# Power pins (5V, GND) are directly wired, no code needed

GPIO.setup(TRIG, GPIO.OUT)
GPIO.setup(ECHO, GPIO.IN)
GPIO.setup(FLAME, GPIO.IN)
GPIO.setup(WATER, GPIO.IN)
GPIO.setup(BUZZER, GPIO.OUT)

# Initialize buzzer to OFF state
GPIO.output(BUZZER, False)
GPIO.output(TRIG, False)

# ---------------------------
# BUZZER PATTERNS
# ---------------------------

def speak(text):
    """Text-to-speech output"""
    print(f"🔊 {text}")
    engine.say(text)
    engine.runAndWait()

def beep(pattern):
    for on, off in pattern:
        GPIO.output(BUZZER, True)
        time.sleep(on)
        GPIO.output(BUZZER, False)
        time.sleep(off)

obstacle_pattern = [(0.1, 0.2)]
water_pattern = [(0.3, 0.3)]
fire_pattern = [(0.1, 0.1)] * 5
fire_water_pattern = [(0.1, 0.1), (0.1, 0.1), (0.3, 0.2)]
fire_water_obstacle_pattern = [(0.5, 0.1)]

# ---------------------------
# Measure Ultrasonic Distance
# ---------------------------

def get_distance():
    GPIO.output(TRIG, False)
    time.sleep(0.01)

    GPIO.output(TRIG, True)
    time.sleep(0.00001)
    GPIO.output(TRIG, False)

    pulse_start = time.time()
    pulse_end = time.time()
    timeout = time.time() + 0.1  # 100ms timeout

    while GPIO.input(ECHO) == 0:
        pulse_start = time.time()
        if time.time() > timeout:
            return 999  # Return large distance on timeout

    while GPIO.input(ECHO) == 1:
        pulse_end = time.time()
        if time.time() > timeout:
            return 999  # Return large distance on timeout

    duration = pulse_end - pulse_start
    distance = duration * 17150
    distance = round(distance, 2)
    
    # Filter out invalid readings
    if distance > 400 or distance < 2:
        return 999  # Return large distance for invalid readings
    
    return distance

# ---------------------------
# MAIN LOOP
# ---------------------------

speak("Smart Stick System Starting")
print("⏳ Warming up sensors...")
time.sleep(2)  # Give sensors time to stabilize
GPIO.output(BUZZER, False)  # Ensure buzzer is off
speak("System Ready")
print("✅ System Ready!\n")

# State tracking for coordinated alerts
last_alert_time = 0
alert_cooldown = 3  # seconds between voice alerts
previous_state = {"obstacle": False, "water": False, "fire": False}

try:
    while True:
        dist = get_distance()
        fire = GPIO.input(FLAME) == 0  # Active LOW
        water = GPIO.input(WATER) == 0  # Active LOW
        obstacle = dist < 50

        current_time = time.time()
        current_state = {"obstacle": obstacle, "water": water, "fire": fire}
        
        # Check if state changed
        state_changed = current_state != previous_state
        can_alert = (current_time - last_alert_time) >= alert_cooldown

        print(f"Distance: {dist}cm  Fire: {fire}  Water: {water}  Obstacle: {obstacle}")

        # Coordinated priority alerts with voice
        if fire and water and obstacle:
            print("🔥💧🚧 MULTIPLE DANGERS")
            beep(fire_water_obstacle_pattern)
            if state_changed or can_alert:
                speak("Critical alert! Fire, water, and obstacle detected ahead. Stop immediately!")
                last_alert_time = current_time

        elif fire and water:
            print("🔥💧 FIRE + WATER")
            beep(fire_water_pattern)
            if state_changed or can_alert:
                speak("Warning! Fire and water detected. Danger ahead!")
                last_alert_time = current_time

        elif fire and obstacle:
            print("🔥🚧 FIRE + OBSTACLE")
            beep(fire_pattern)
            if state_changed or can_alert:
                speak(f"Fire detected with obstacle at {int(dist)} centimeters. Move carefully!")
                last_alert_time = current_time

        elif water and obstacle:
            print("💧🚧 WATER + OBSTACLE")
            beep(water_pattern)
            if state_changed or can_alert:
                speak(f"Water and obstacle detected at {int(dist)} centimeters ahead.")
                last_alert_time = current_time

        elif fire:
            print("🔥 FIRE DETECTED")
            beep(fire_pattern)
            if state_changed or can_alert:
                speak("Fire detected! Danger ahead!")
                last_alert_time = current_time

        elif water:
            print("💧 WATER DETECTED")
            beep(water_pattern)
            if state_changed or can_alert:
                speak("Water detected on the ground.")
                last_alert_time = current_time

        elif obstacle:
            print("🚧 OBSTACLE DETECTED")
            beep(obstacle_pattern)
            if state_changed or can_alert:
                speak(f"Obstacle detected at {int(dist)} centimeters ahead.")
                last_alert_time = current_time

        else:
            # Explicitly turn off buzzer when nothing detected
            GPIO.output(BUZZER, False)
            # Announce clear path occasionally
            if previous_state != current_state and any(previous_state.values()):
                speak("Path is clear")
                last_alert_time = current_time

        previous_state = current_state.copy()
        time.sleep(0.5)  # Increased to 0.5s for better voice coordination

except KeyboardInterrupt:
    print("\n⏹️  Stopping Smart Stick System...")
    speak("Stopping Smart Stick System")
    GPIO.output(BUZZER, False)  # Turn off buzzer before cleanup
    GPIO.cleanup()
    print("✅ System stopped. Goodbye!")
    speak("Goodbye")
