# Deployment Guide

This guide will help you deploy the Landslide Risk Assessment project to Render (or similar platforms).

## Prerequisites

1. A GitHub account with the repository pushed
2. A Render account (sign up at https://render.com - free tier available)

## Deployment Steps

### Option 1: Deploy using Render Dashboard (Recommended)

#### Backend Deployment (Flask API)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `a3094/Major-project01`
4. Configure the service:
   - **Name**: `landslide-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `cd landslide-backend && pip install -r requirements.txt`
   - **Start Command**: `cd landslide-backend && gunicorn app:app --bind 0.0.0.0:$PORT`
   - **Root Directory**: Leave empty (or set to `landslide-backend` if needed)
5. Click "Create Web Service"
6. Wait for deployment to complete
7. **Copy the URL** (e.g., `https://landslide-backend.onrender.com`)

#### Frontend Deployment (React App)

1. In Render Dashboard, click "New +" → "Static Site"
2. Connect your GitHub repository: `a3094/Major-project01`
3. Configure the service:
   - **Name**: `landslide-frontend`
   - **Build Command**: `cd landslide-frontend && npm install && npm run build`
   - **Publish Directory**: `landslide-frontend/build`
   - **Root Directory**: Leave empty
4. Add Environment Variable:
   - **Key**: `REACT_APP_API_BASE`
   - **Value**: Your backend URL from step above (e.g., `https://landslide-backend.onrender.com`)
5. Click "Create Static Site"
6. Wait for deployment to complete

### Option 2: Deploy using render.yaml (Alternative)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository: `a3094/Major-project01`
4. Render will detect `render.yaml` and create both services
5. **Important**: After deployment, update the `REACT_APP_API_BASE` environment variable in the frontend service with your backend URL

### Option 3: Deploy to Railway

#### Backend
1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Python
5. Set **Root Directory** to `landslide-backend`
6. Add start command: `gunicorn app:app --bind 0.0.0.0:$PORT`

#### Frontend
1. Create a new service in the same project
2. Set **Root Directory** to `landslide-frontend`
3. Add environment variable: `REACT_APP_API_BASE` = your backend URL
4. Build command: `npm install && npm run build`
5. Start command: `npx serve -s build -p $PORT`

### Option 4: Deploy to Heroku

#### Backend
```bash
cd landslide-backend
heroku create landslide-backend-app
git subtree push --prefix landslide-backend heroku main
```

#### Frontend
```bash
cd landslide-frontend
heroku create landslide-frontend-app --buildpack https://github.com/mars/create-react-app-buildpack.git
heroku config:set REACT_APP_API_BASE=https://landslide-backend-app.herokuapp.com
git subtree push --prefix landslide-frontend heroku main
```

## Post-Deployment

1. **Update Frontend API URL**: Make sure the frontend's `REACT_APP_API_BASE` environment variable points to your deployed backend URL
2. **Test the API**: Visit your backend URL + `/predict?location=San Francisco` to test
3. **Test the Frontend**: Visit your frontend URL and try a prediction

## Environment Variables

### Backend
- `PORT`: Automatically set by the platform (usually 5000 or provided)

### Frontend
- `REACT_APP_API_BASE`: Your backend deployment URL (e.g., `https://landslide-backend.onrender.com`)

## Troubleshooting

1. **Backend not starting**: Check logs in Render dashboard. Ensure `gunicorn` is in requirements.txt
2. **Frontend can't connect to backend**: Verify `REACT_APP_API_BASE` is set correctly
3. **CORS errors**: The backend already has CORS enabled, but ensure the frontend URL is allowed
4. **Model files missing**: The models should be in `landslide-backend/models/`. If missing, you may need to train them first or add them to the repository

## Notes

- Render free tier services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- For production, consider upgrading to a paid plan for always-on services

