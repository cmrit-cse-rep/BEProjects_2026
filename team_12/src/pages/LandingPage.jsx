import { Link } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

const LandingPage = () => {
  const authenticated = isAuthenticated();
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h1 className="text-5xl font-bold mb-4">
            Enhancing Sepsis Detection Using Variational Autoencoders
          </h1>
          <p className="text-xl mb-8 text-primary-100">
            Advanced machine learning platform for early sepsis detection and prediction
          </p>
          {!authenticated && (
            <Link to="/login" className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
              Get Started
            </Link>
          )}
          {authenticated && (
            <Link to="/dashboard" className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
      
      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">Dual ML Models</h3>
            <p className="text-gray-600">
              Original Random Forest and VAE-enhanced models for accurate predictions
            </p>
          </div>
          
          <div className="card text-center">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-xl font-semibold mb-2">Multiple File Formats</h3>
            <p className="text-gray-600">
              Upload CSV, PDF, DOCX, or images with automatic data extraction
            </p>
          </div>
          
          <div className="card text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Detailed Reports</h3>
            <p className="text-gray-600">
              Comprehensive PDF reports with metrics and recommendations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;


