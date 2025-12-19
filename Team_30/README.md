# NeuroPlay - AI-Powered Therapeutic Gaming Platform

A Flask-based web application that provides therapeutic games for children with autism and developmental needs, featuring AI-powered progress tracking and webcam-based hand tracking.

## Features

- **Therapeutic Games**: Follow the Dot and Bubble Pop with webcam hand tracking
- **AI Analysis**: Advanced motor and cognitive skill assessment
- **Progress Tracking**: Detailed analytics and insights
- **Hand Tracking**: Real-time webcam-based interaction using MediaPipe
- **User Management**: Secure authentication and multi-user support
- **Professional Reports**: Exportable progress reports for therapists

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd neuroplay-project
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv neuroplay-env
   neuroplay-env\Scripts\activate  # Windows
   # or
   source neuroplay-env/bin/activate  # Linux/Mac
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application:**
   ```bash
   python app.py
   ```

5. **Access the application:**
   Open http://localhost:5000 in your browser
   Deployed Click on : https://web-production-777e8.up.railway.app/

## Usage

1. **Register** a new account or **Login** with existing credentials
2. Navigate to **Games** to play therapeutic games
3. View **Progress** to see improvement over time  
4. Check **AI Insights** for personalized recommendations

## Games

- **Follow the Dot**: Hand-eye coordination and fine motor skills
- **Bubble Pop**: Reaction time and bilateral coordination

Both games feature:
- Real-time webcam hand tracking
- Progressive difficulty levels
- Detailed performance analytics
- Autism-friendly design principles

## AI Features

- Motor skill assessment
- Cognitive performance analysis
- Personalized recommendations
- Risk scoring and early detection
- Professional-grade reporting

## Directory Structure

```
neuroplay-project/
├── app.py                 # Main Flask application
├── models.py              # Database models
├── ai_analysis.py         # AI analysis engine
├── requirements.txt       # Python dependencies
├── templates/             # HTML templates
├── static/                # CSS, JS, images
└── static/games/          # Web-based games
    ├── follow_dot/
    └── bubble_pop/
```

## License

This project is developed for educational and therapeutic purposes.
