import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  Settings,
  LogOut,
  Menu,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../store/auth';
import { cn } from '../../utils';
import ARIcon from '../../assets/augmented-reality.png';

interface HeaderProps {
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowUserMenu(false);
  };

  const mockNotificationCount = 3;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo + Mobile Menu */}
          <div className="flex items-center space-x-3 sm:space-x-6 min-w-0">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
              aria-label="Toggle mobile menu"
              aria-expanded={false}
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/" className="flex items-center min-w-0 space-x-2 sm:space-x-3">
              <img src={ARIcon} alt="Augmented Reality Icon" className="h-6 w-6 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xl font-bold text-gray-900 truncate">MedAR</span>
                <span className="text-xs text-gray-500 hidden sm:block truncate">
                  Healthcare AR Education
                </span>
              </div>
            </Link>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center space-x-3 sm:space-x-6 min-w-0">
            {user ? (
              <>
                {user.role === 'student' && (
                  <div className="hidden lg:flex items-center space-x-6 mr-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4" aria-hidden="true" />
                      <span>{user.enrolledCourses.length} Courses</span>
                    </div>
                  </div>
                )}

                {/* Notification Bell - always visible on mobile */}
                <button
                  className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label={`Notifications ${mockNotificationCount > 0 ? `(${mockNotificationCount} unread)` : ''}`}
                >
                  <Bell className="h-6 w-6" />
                  {mockNotificationCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                      aria-hidden="true"
                    >
                      {mockNotificationCount}
                    </span>
                  )}
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="User account menu"
                    aria-expanded={showUserMenu}
                    aria-haspopup="true"
                  >
                    <div className="h-8 w-8 bg-gradient-to-br from-primary-500 to-medical-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden md:block text-left min-w-0">
                      <div className="text-sm font-medium text-gray-700 truncate">{user.name}</div>
                      <div className="text-xs text-gray-500 capitalize truncate">{user.role}</div>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-gray-400 transition-transform hidden md:block',
                        showUserMenu && 'transform rotate-180'
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu-button"
                    >
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        <User className="h-4 w-4 mr-3" aria-hidden="true" />
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        <Settings className="h-4 w-4 mr-3" aria-hidden="true" />
                        Settings
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4 mr-3" aria-hidden="true" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3 sm:space-x-6">
                <Link
                  to="/login"
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-primary-600 to-medical-500 hover:from-primary-700 hover:to-medical-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 shadow-sm"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
