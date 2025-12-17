import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './navbar.css';
import { useAuth0 } from '@auth0/auth0-react';
import Login from './login';
import LogoutButton from './logout';
import { isWeb } from './utils/platform';

export const Navbar = () => {
  const { isAuthenticated } = useAuth0();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      {/* Animated background blur */}
      <div className="navbar-bg"></div>

      <ul className="navbar-nav">
        {/* Logo Section */}
        <li className="nav-item logo-section">
          <div className="logo-container">
            <span className="logo-icon">🌱</span>
            <span className="logo-text">AgroCareAI</span>
          </div>
          <div className="logo-subtitle">Smart Farming AI</div>
        </li>

        {/* Navigation Links */}
        <li className="nav-item">
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Home</span>
            <span className="nav-indicator"></span>
          </Link>
        </li>

        {/* Dropdown with enhanced styling */}
        <li className="nav-item dropdown">
          <button className="nav-link dropdown-toggle">
            <span className="nav-icon">🔬</span>
            <span className="nav-text">Predict Diseases</span>
            <span className="arrow">▼</span>
            <span className="nav-indicator"></span>
          </button>
          <ul className="dropdown-menu">
            <li>
              <Link
                to="/potato"
                className={`dropdown-item ${isActive('/potato') ? 'active' : ''}`}
              >
                <span className="dropdown-icon">🥔</span>
                <span>Potato Diseases</span>
              </Link>
            </li>
            <li>
              <Link
                to="/tomato"
                className={`dropdown-item ${isActive('/tomato') ? 'active' : ''}`}
              >
                <span className="dropdown-icon">🍅</span>
                <span>Tomato Diseases</span>
              </Link>
            </li>
            <li>
              <Link
                to="/capsicum"
                className={`dropdown-item ${isActive('/capsicum') ? 'active' : ''}`}
              >
                <span className="dropdown-icon">🫑</span>
                <span>Capsicum Diseases</span>
              </Link>
            </li>
          </ul>
        </li>

        <li className="nav-item">
          <Link
            to="/about"
            className={`nav-link ${isActive('/about') ? 'active' : ''}`}
          >
            <span className="nav-icon">ℹ️</span>
            <span className="nav-text">About</span>
            <span className="nav-indicator"></span>
          </Link>
        </li>

        <li className="nav-item">
          <Link
            to="/dashboard"
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
            <span className="nav-indicator"></span>
          </Link>
        </li>

        {/* Auth Section - Only show on web */}
        {isWeb() && (
          <li className="nav-item auth-section">
            <div className="auth-wrapper">
              {isAuthenticated ? (
                <div className="auth-button logout-button">
                  <span className="auth-icon">👤</span>
                  <LogoutButton />
                </div>
              ) : (
                <div className="auth-button login-button">
                  <span className="auth-icon">🔐</span>
                  <Login />
                </div>
              )}
            </div>
          </li>
        )}
      </ul>

      {/* Decorative elements */}
      <div className="navbar-decorations">
        <div className="decoration-dot"></div>
        <div className="decoration-dot"></div>
        <div className="decoration-dot"></div>
      </div>
    </nav>
  );
};