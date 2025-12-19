# Quick Start Guide

## 🚀 Fast Setup (5 minutes)

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

**ML Pipeline:**
```bash
cd ml
pip install -r requirements.txt
```

### 2. Configure Environment

**Backend (.env):**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sepsis
JWT_SECRET=change-this-secret-key
PYTHON_PATH=python
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000
```

### 3. Train ML Models

```bash
cd ml
python train/run_all.py
```

This will:
- Download/generate dataset
- Preprocess data
- Train original Random Forest model
- Train VAE model
- Generate synthetic data
- Train combined model

### 4. Start Services

**Terminal 1 - MongoDB:**
```bash
mongod
```

**Terminal 2 - Backend:**
```bash
cd backend
npm start
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access Application

- Open: http://localhost:5173
- Register as doctor (use @cmrit.ac.in email)
- Or register as patient (use any other email)

## 📝 First Use

1. **Register** with your email (role auto-detected: `@cmrit.ac.in` = doctor, otherwise patient)
2. **Login** with your credentials
3. **Doctors** upload or enter patient vitals to generate predictions
4. **Patients** can log in once their doctor has uploaded at least one record for them
5. **View** predictions, charts, and download PDF reports

## ⚠️ Important Notes

- Make sure MongoDB is running before starting the backend
- Patients cannot submit vitals; only doctors can generate predictions
- Patients will be blocked from logging in until a doctor uploads their record
- If ML training fails, the system will use fallback predictions
- Models are saved in `ml/models/` directory

## 🐛 Troubleshooting

**"Models not found" error:**
- Run `python ml/train/run_all.py` to train models

**MongoDB connection error:**
- Ensure MongoDB is running: `mongod`
- Check connection string in backend/.env

**Python errors:**
- Ensure Python 3.8+ is installed
- Install all requirements: `pip install -r ml/requirements.txt`

