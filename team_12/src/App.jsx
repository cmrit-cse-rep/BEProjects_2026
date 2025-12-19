import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { isAuthenticated, isDoctor, isPatient } from './utils/auth';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import UploadPage from './pages/UploadPage';
import PredictionResult from './pages/PredictionResult';
import PatientRecords from './pages/PatientRecords';
import SuggestionsPage from './pages/SuggestionsPage';

// Protected Route Component
const ProtectedRoute = ({ children, requireDoctor = false, requirePatient = false }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  if (requireDoctor && !isDoctor()) {
    return <Navigate to="/dashboard" />;
  }
  
  if (requirePatient && !isPatient()) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                {isDoctor() ? <DoctorDashboard /> : <PatientDashboard />}
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/upload"
            element={
              <ProtectedRoute requireDoctor>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/prediction/:id"
            element={
              <ProtectedRoute>
                <PredictionResult />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/records"
            element={
              <ProtectedRoute>
                <PatientRecords />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/suggestions/:id"
            element={
              <ProtectedRoute requireDoctor>
                <SuggestionsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;


