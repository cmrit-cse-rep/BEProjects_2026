import { Link, useNavigate } from 'react-router-dom';
import { clearAuth, getAuth } from '../utils/auth';

const Navbar = () => {
  const navigate = useNavigate();
  const { user } = getAuth();
  
  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };
  
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              Sepsis Detection
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-gray-700">
                  {user.name} ({user.role})
                </span>
                <Link to="/dashboard" className="text-gray-700 hover:text-primary-600">
                  Dashboard
                </Link>
                {user.role === 'doctor' && (
                  <Link to="/upload" className="text-gray-700 hover:text-primary-600">
                    Upload
                  </Link>
                )}
                <Link to="/records" className="text-gray-700 hover:text-primary-600">
                  Records
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;


