# News Authenticity Detector

An AI-powered fake news detection system that analyzes news articles, titles, and URLs to determine authenticity using advanced language models.

## Features

- 🔍 **Multiple Input Types**: Analyze full articles, titles, or URLs
- 🤖 **AI-Powered Analysis**: Uses Groq's Llama 3.3 70B model
- 🌐 **Web Scraping**: Automatically extracts article content from URLs using Playwright
- 📰 **Source Verification**: Cross-references news titles with GNews API
- 📊 **Detailed Reports**: Provides probability scores, red flags, patterns, and reasoning
- 💎 **Beautiful UI**: Modern, responsive interface with smooth animations

## Tech Stack

### Backend
- **FastAPI**: High-performance Python web framework
- **Groq AI**: Llama 3.3 70B for advanced text analysis
- **Playwright**: Headless browser for article extraction
- **GNews**: News aggregation and verification

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Beautiful icons

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows:
  ```bash
  venv\Scripts\activated
  ```
- macOS/Linux:
  ```bash
  source venv/bin/activate
  ```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Install Playwright browsers:
```bash
playwright install chromium
```

6. The `.env` file is already configured with your Groq API key

7. Run the backend server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage

1. Start both the backend and frontend servers
2. Open `http://localhost:3000` in your browser
3. Choose your input type:
   - **Full Article**: Paste the complete article text
   - **Title Only**: Enter just the news headline
   - **Article URL**: Provide a link to the article
4. Click "Analyze News"
5. View the comprehensive analysis including:
   - Authenticity verdict
   - Fake/Real probability percentages
   - Red flags identified
   - Detected patterns
   - Detailed reasoning
   - Related sources (for title analysis)

## API Endpoints

### `POST /analyze`
Analyzes news content for authenticity.

**Request Body:**
```json
{
  "content": "string",
  "input_type": "title" | "url" | "article"
}
```

**Response:**
```json
{
  "is_fake": boolean,
  "fake_probability": number,
  "real_probability": number,
  "red_flags": string[],
  "patterns": string[],
  "reasoning": string,
  "sources_found": object[] (optional)
}
```

### `GET /health`
Health check endpoint.

## Project Structure

```
Roshan/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables
├── frontend/
│   ├── app/
│   │   ├── page.tsx        # Main page component
│   │   ├── layout.tsx      # Root layout
│   │   └── globals.css     # Global styles
│   ├── package.json
│   └── tailwind.config.ts
└── .gitignore
```

## Environment Variables

### Backend (.env)
- `GROQ_API_KEY`: Your Groq API key for AI analysis

## License

MIT

## Credits

- Powered by [Groq](https://groq.com/) AI
- Built with [Next.js](https://nextjs.org/) and [FastAPI](https://fastapi.tiangolo.com/)
