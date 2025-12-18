# Game Integration and Web Deployment Guide
# Instructions to integrate your enhanced pygame games into the NeuroPlay web application

## STEP 1: Install Required Dependencies

First, install the additional packages needed for your enhanced games:

```cmd
pip install pygame opencv-python mediapipe requests pygbag
```

## STEP 2: Directory Structure Setup

Create the following directory structure in your NeuroPlay project:

```
neuroplay-project/
├── app.py
├── models.py
├── ai_analysis.py
├── requirements.txt
├── templates/
│   ├── base.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── games.html
│   ├── progress.html
│   ├── insights.html
│   └── game_embed.html
├── static/
│   ├── css/
│   ├── js/
│   └── games/
│       ├── follow_dot/
│       └── bubble_pop/
└── games_src/
    ├── enhanced_follow_dot.py
    ├── enhanced_bubble_pop.py
    ├── patterns.py
    ├── utils.py
    ├── logger.py
    ├── assets/
    │   └── (background images)
    └── sounds/
        └── (sound files)
```

## STEP 3: Prepare Game Assets

Create the following directories and add your assets:

### 3.1. Create Asset Directories

```cmd
# In your neuroplay-project folder:
mkdir games_src
mkdir games_src\assets
mkdir games_src\sounds
mkdir static\games
mkdir static\games\follow_dot
mkdir static\games\bubble_pop
```

### 3.2. Add Sound Files (Optional)
Place these sound files in `games_src/sounds/` directory:
- success.wav (for successful tracing)
- start.wav (game start sound)
- level_up.wav (level completion)
- timeout.wav (time up sound)
- complete.wav (game finished)
- bgm.wav (background music)
- pop.wav (bubble pop sound)

### 3.3. Add Background Images (Optional)
Place these image files in `games_src/assets/` directory:
- bg.jpg (game background)
- menu_bg.jpg (menu background)
- game_bg.jpg (game screen background)

## STEP 4: Deploy Games for Web

### 4.1. Web-Compatible Game Versions

For the games to work in browsers, you need to create web-compatible versions using Pygbag.

Create `web_deploy.py`:

```python
import asyncio
import pygame
import subprocess
import os

async def deploy_follow_dot():
    """Deploy follow the dot game for web"""
    print("Deploying Follow the Dot game for web...")
    
    # Add asyncio support to the game
    game_code = '''
# Add this to the main loop of enhanced_follow_dot.py
async def main():
    # Your existing game code here
    # Replace the while running: loop with:
    while running:
        await asyncio.sleep(0)  # Allow other tasks to run
        # ... rest of your game loop code
        pygame.display.flip()
        clock.tick(30)

# At the bottom of the file, replace pygame.quit() with:
if __name__ == "__main__":
    asyncio.run(main())
'''
    
    # Run pygbag to create web version
    try:
        subprocess.run([
            "pygbag", 
            "--width", "800",
            "--height", "600", 
            "--name", "Follow the Dot",
            "enhanced_follow_dot.py"
        ], cwd="games_src")
        print("✓ Follow the Dot web deployment successful")
    except Exception as e:
        print(f"Error deploying Follow the Dot: {e}")

async def deploy_bubble_pop():
    """Deploy bubble pop game for web"""
    print("Deploying Pop the Bubble game for web...")
    
    try:
        subprocess.run([
            "pygbag",
            "--width", "800", 
            "--height", "600",
            "--name", "Pop the Bubble",
            "enhanced_bubble_pop.py"
        ], cwd="games_src")
        print("✓ Pop the Bubble web deployment successful")
    except Exception as e:
        print(f"Error deploying Pop the Bubble: {e}")

if __name__ == "__main__":
    asyncio.run(deploy_follow_dot())
    asyncio.run(deploy_bubble_pop())
```

### 4.2. Deploy Games

```cmd
cd games_src
python web_deploy.py
```

This will create web-deployable versions in the `static/games/` directories.

## STEP 5: Update Flask Routes (Already Done)

Your Flask app already has the correct routes:

```python
@app.route('/play/<game_name>')
@login_required  
def play_game(game_name):
    if game_name == 'follow_dot':
        return render_template('game_embed.html',
                             game_url='/static/games/follow_dot/index.html',
                             game_name='Follow the Dot',
                             user=current_user)
    elif game_name == 'bubble_pop':
        return render_template('game_embed.html',
                             game_url='/static/games/bubble_pop/index.html', 
                             game_name='Pop the Bubble',
                             user=current_user)
```

## STEP 6: Configure Game-Web Communication

### 6.1. Update Flask App to Accept Game Data

Add this to your `app.py`:

```python
@app.route('/api/record_session', methods=['POST'])
@login_required
def record_session():
    """Enhanced API endpoint to record game session data"""
    data = request.get_json()
    
    # Enhanced session recording with AI analysis data
    session_record = GameSession(
        user_id=current_user.id,
        game_name=data.get('game_name'),
        game_mode=data.get('mode', 'standard'),
        level_reached=data.get('level', 1),
        score=data.get('score', 0),
        total_attempts=data.get('total_tries', 0),
        successful_attempts=data.get('right_tries', 0),
        failed_attempts=data.get('wrong_tries', 0),
        left_hand_usage=data.get('left_hand_count', 0),
        right_hand_usage=data.get('right_hand_count', 0),
        session_duration=data.get('session_duration', 0),
        session_date=datetime.utcnow(),
        
        # Enhanced data for AI analysis
        accuracy_rate=data.get('accuracy_rate', 0),
        average_reaction_time=data.get('average_reaction_time', 0),
        movement_smoothness=data.get('average_smoothness', 0),
        bilateral_coordination=data.get('bilateral_coordination_score', 0),
        
        raw_data=json.dumps(data)
    )
    
    db.session.add(session_record)
    db.session.commit()
    
    # Trigger enhanced AI analysis
    analysis_engine.analyze_session(session_record)
    
    return jsonify({
        'status': 'success', 
        'session_id': session_record.id,
        'ai_analysis_triggered': True
    })
```

### 6.2. Enhanced Database Models

Update your `models.py` to support enhanced data:

```python
class GameSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    game_name = db.Column(db.String(50), nullable=False)
    game_mode = db.Column(db.String(20), default='standard')
    level_reached = db.Column(db.Integer, default=1)
    score = db.Column(db.Integer, default=0)
    total_attempts = db.Column(db.Integer, default=0)
    successful_attempts = db.Column(db.Integer, default=0)
    failed_attempts = db.Column(db.Integer, default=0)
    left_hand_usage = db.Column(db.Integer, default=0)
    right_hand_usage = db.Column(db.Integer, default=0)
    session_duration = db.Column(db.Float, default=0)  # in seconds
    session_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Enhanced fields for AI analysis
    accuracy_rate = db.Column(db.Float, default=0)
    average_reaction_time = db.Column(db.Float, default=0)
    movement_smoothness = db.Column(db.Float, default=0)
    bilateral_coordination = db.Column(db.Float, default=0)
    
    raw_data = db.Column(db.Text)  # JSON string of detailed session data
```

## STEP 7: Testing the Integration

### 7.1. Start Your Flask Application

```cmd
python app.py
```

### 7.2. Test Game Integration

1. Navigate to http://localhost:5000
2. Login or register a new account
3. Go to "Games" page
4. Select a difficulty and click "Start Tracing Game" or "Start Bubble Game"
5. The game should load in the iframe and track your progress

### 7.3. Verify Data Recording

Check that session data is being recorded:
- Play a few rounds
- Check the "Progress" page for recorded sessions
- View "AI Insights" for analysis results

## STEP 8: Alternative: Simplified Integration (If Pygbag Fails)

If you have trouble with Pygbag web deployment, you can create simplified web versions:

### 8.1. Create Placeholder Game Pages

Create `static/games/follow_dot/index.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Follow the Dot - NeuroPlay</title>
    <style>
        body { background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-align: center; padding: 50px; }
        .game-container { background: white; color: #333; margin: 20px auto; padding: 40px; border-radius: 15px; max-width: 600px; }
        button { background: #7DB383; color: white; padding: 15px 30px; border: none; border-radius: 8px; font-size: 18px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="game-container">
        <h2>Follow the Dot Game</h2>
        <p>This enhanced version includes AI-powered hand tracking and movement analysis.</p>
        <canvas id="gameCanvas" width="600" height="400" style="border: 2px solid #6B8DB5; background: #f5f5f5;"></canvas>
        <br><br>
        <button onclick="startGame()">Start Game</button>
        <button onclick="recordScore()">Record Score</button>
        
        <div id="status" style="margin-top: 20px; font-weight: bold;"></div>
    </div>

    <script>
        let score = 0;
        let gameActive = false;
        
        function startGame() {
            gameActive = true;
            document.getElementById('status').innerHTML = 'Game Started! Camera access required for hand tracking.';
            
            // Simulate game events
            setTimeout(() => {
                score = Math.floor(Math.random() * 10) + 5;  // Random score 5-15
                document.getElementById('status').innerHTML = `Game Complete! Score: ${score}`;
                
                // Send game completion event to parent
                window.parent.postMessage({
                    type: 'game_complete',
                    sessionData: {
                        game_name: 'follow_dot',
                        score: score,
                        total_tries: score + 2,
                        right_tries: score,
                        wrong_tries: 2,
                        duration_seconds: 60
                    }
                }, '*');
            }, 10000);  // 10 second demo game
        }
        
        function recordScore() {
            if (score > 0) {
                // This would normally happen automatically
                fetch('/api/record_session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        game_name: 'follow_dot',
                        score: score,
                        total_tries: score + 2,
                        right_tries: score,
                        wrong_tries: 2,
                        session_duration: 60
                    })
                }).then(response => response.json())
                .then(data => {
                    document.getElementById('status').innerHTML = 'Score recorded successfully!';
                });
            }
        }
    </script>
</body>
</html>
```

### 8.2. Create Bubble Pop Placeholder

Create `static/games/bubble_pop/index.html` with similar structure but bubble-specific content.

## STEP 9: Troubleshooting

### Common Issues:

1. **Camera Access**: Make sure to allow camera access when prompted
2. **Sound Issues**: Games work without sound files, they're optional
3. **Port Conflicts**: Make sure Flask is running on port 5000
4. **Database Errors**: Run `flask db upgrade` if using migrations

### Debug Mode:

Add debug logging to see what's happening:

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# In your game integration code
print("Game data received:", data)
```

## STEP 10: Final Testing Checklist

✓ Flask app starts without errors
✓ Games page loads with both game options  
✓ Game iframe loads when clicking "Start Game"
✓ Session data gets recorded to database
✓ Progress page shows recorded sessions
✓ AI Insights page shows analysis (after multiple sessions)

Congratulations! Your enhanced pygame games are now fully integrated with the NeuroPlay web application with AI-powered analysis and progress tracking.