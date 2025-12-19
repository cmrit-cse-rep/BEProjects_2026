# Setup Instructions

## Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB (running locally or connection string)
- npm or yarn

## Step 1: Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

### Backend Environment Variables (.env)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sepsis
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
PYTHON_PATH=python
```

## Step 2: ML Pipeline Setup

```bash
cd ml
pip install -r requirements.txt

# Run the training pipeline
python train/download_data.py
python train/preprocess.py
python train/train_original_model.py
python train/train_vae.py
python train/generate_synthetic_data.py
python train/train_combined_model.py
```

**Note:** If the PhysioNet download fails, the script will automatically generate synthetic data for demonstration purposes.

## Step 3: Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API URL
npm run dev
```

### Frontend Environment Variables (.env)

```env
VITE_API_URL=http://localhost:5000
```

## Step 4: Start MongoDB

Make sure MongoDB is running:

```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongod
```

## Step 5: Run the Application

1. Start MongoDB
2. Start Backend: `cd backend && npm start`
3. Start Frontend: `cd frontend && npm run dev`

## Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## User Registration

- **Doctors**: Register with `@cmrit.ac.in` email address
- **Patients**: Register with any other email address (gmail, yahoo, etc.)

## Troubleshooting

### Python Model Not Found
If you get errors about missing models, make sure you've run all the training scripts in order.

### MongoDB Connection Error
Ensure MongoDB is running and the connection string in `.env` is correct.

### Python Shell Error
Make sure Python is in your PATH. You can specify the Python path in `.env`:
```
PYTHON_PATH=python3
```

