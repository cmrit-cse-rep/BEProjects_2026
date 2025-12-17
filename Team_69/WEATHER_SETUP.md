# Weather-Based Alerts Feature - Setup Instructions

## 🌤️ Feature Overview
The weather-based alerts feature provides real-time weather data and disease risk predictions based on current conditions.

## 📋 Setup Steps

### 1. Get OpenWeatherMap API Key (FREE)

1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Click "Sign Up" and create a free account
3. After signing in, go to "API keys" section
4. Copy your API key

### 2. Configure Environment Variable

1. Navigate to `frontend/plant-disease/` directory
2. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and add your API key:
   ```
   VITE_WEATHER_API_KEY=your_actual_api_key_here
   ```

### 3. Test Locally

```bash
cd frontend/plant-disease
npm run dev
```

Visit the home page and dashboard - you should see the weather widget!

## 🎯 Features Included

- **Real-time Weather Data**: Temperature, humidity, and conditions
- **Automatic Geolocation**: Uses user's location (with permission)
- **Disease Risk Analysis**: 
  - Late Blight risk (high humidity + moderate temp)
  - Early Blight risk (warm + humid)
  - Bacterial Spot risk (warm + wet)
  - Viral disease risk (hot + dry)
- **Color-coded Alerts**: Green (low), Yellow (medium), Red (high)
- **Actionable Recommendations**: Specific steps to prevent diseases

## 📍 Locations

- **Default**: Delhi, India (if geolocation denied)
- **Custom**: User's actual location (if permission granted)
- **Fallback**: Works even if API fails

## 🚀 Deployment Notes

When deploying to Vercel:
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add: `VITE_WEATHER_API_KEY` = `your_api_key`
4. Redeploy the application

## 🔧 Troubleshooting

**Weather not loading?**
- Check if API key is correct in `.env`
- Ensure `.env` file is in `frontend/plant-disease/` directory
- Restart the dev server after adding `.env`

**Geolocation not working?**
- Browser will ask for permission - click "Allow"
- If denied, it falls back to Delhi
- Works on HTTPS only in production

**API Rate Limits?**
- Free tier: 60 calls/minute, 1,000,000 calls/month
- More than enough for this application!

## 📊 Disease Risk Logic

The system analyzes weather conditions:
- **Temperature**: Affects disease development
- **Humidity**: Key factor for fungal diseases
- **Precipitation**: Increases bacterial disease risk
- **Combined factors**: More accurate risk assessment

Enjoy your weather-powered disease prevention system! 🌱
