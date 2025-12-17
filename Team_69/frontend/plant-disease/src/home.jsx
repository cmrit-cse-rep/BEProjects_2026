import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import './home.css';
import WeatherAlert from './WeatherAlert';

export const Home = () => {
  const { user, isAuthenticated, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [currentStat, setCurrentStat] = useState(0);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const stats = [
    { number: "50K+", label: "Plants Analyzed", icon: "🌱" },
    { number: "98%", label: "Accuracy Rate", icon: "⭐" },
    { number: "12K+", label: "Happy Farmers", icon: "👥" },
    { number: "24/7", label: "AI Support", icon: "🌍" }
  ];

  const features = [
    {
      title: "AI Disease Detection",
      description: "Advanced machine learning to identify plant diseases instantly",
      icon: "📷",
      color: "feature-emerald",
      details: "Our AI analyzes images of your crops and identifies diseases with 98% accuracy. Get instant diagnosis and treatment recommendations powered by deep learning models trained on millions of plant images."
    },
    {
      title: "Smart Analytics",
      description: "Comprehensive insights and recommendations for your crops",
      icon: "📊",
      color: "feature-blue",
      details: "Track crop health over time, receive personalized recommendations, and optimize your farming practices with data-driven insights. Our analytics help you make informed decisions for better yields."
    },
    {
      title: "Real-time Monitoring",
      description: "24/7 crop health monitoring with instant alerts",
      icon: "⚡",
      color: "feature-purple",
      details: "Get instant notifications when issues are detected. Our system monitors your crops continuously and alerts you to potential problems before they become serious, saving you time and money."
    }
  ];

  useEffect(() => {
    setIsVisible(true);

    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 3000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  const handleStartAnalyzing = () => {
    // If user isn't authenticated, send them to login
    if (!isAuthenticated) {
      // Prefer direct login redirect if available, otherwise route to /login
      try {
        loginWithRedirect();
        return;
      } catch (e) {
        navigate('/login');
        return;
      }
    }

    // Authenticated users go to the potato analyze page by default
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      navigate('/potato');
    }, 200);
  };

  const handleWatchDemo = () => {
    setShowDemoModal(true);
    setIsPlaying(false);
  };

  const handlePlayDemo = () => {
    setIsPlaying(true);
    // Here you would actually play a video
    console.log('Playing demo video...');
  };

  const handleLearnMore = (featureIndex) => {
    setShowLearnMore(featureIndex);
  };

  const handleTryFree = () => {
    // If user isn't authenticated, send them to login first
    if (!isAuthenticated) {
      try {
        loginWithRedirect();
        return;
      } catch (e) {
        navigate('/login');
        return;
      }
    }

    // If authenticated, show success and go to dashboard
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      navigate('/dashboard');
    }, 1200);
  };

  const closeModal = () => {
    setShowDemoModal(false);
    setShowLearnMore(null);
    setIsPlaying(false);
  };

  return (
    <main className="home-container">
      {/* Animated background elements */}
      <div className="bg-elements">
        <div
          className="bg-orb bg-orb-1"
          style={{
            left: `${mousePosition.x * 0.1}%`,
            top: `${mousePosition.y * 0.1}%`,
          }}
        />
        <div
          className="bg-orb bg-orb-2"
          style={{
            right: `${mousePosition.x * 0.05}%`,
            bottom: `${mousePosition.y * 0.05}%`,
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="particles">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className={`main-content ${isVisible ? 'visible' : ''}`}>

        {/* Hero section */}
        <div className="hero-section">
          <div className="badge">
            <span className="badge-icon">🌱</span>
            Next-Gen Agricultural AI
          </div>

          <h1 className="hero-title">
            AgroCare
            <span className="hero-subtitle">Intelligence</span>
          </h1>

          {isAuthenticated && user ? (
            <div className="user-greeting">
              <p className="greeting-text">
                Welcome back, <span className="user-name">{user.given_name || user.name}</span>!
              </p>
              <p className="greeting-subtitle">Ready to revolutionize your farming journey?</p>
            </div>
          ) : (
            <p className="hero-description">
              Transform your agriculture with cutting-edge AI technology.
              Detect diseases, optimize yields, and grow smarter.
            </p>
          )}

          {/* CTA Buttons */}
          <div className="cta-buttons">
            <button className="btn-primary" onClick={handleStartAnalyzing}>
              Start Analyzing
              <span className="btn-arrow">→</span>
            </button>
            <button className="btn-secondary" onClick={handleWatchDemo}>
              Watch Demo
            </button>
          </div>
        </div>

        {/* Stats section */}
        <div className="stats-section">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`stat-card ${currentStat === index ? 'active' : ''}`}
              >
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Alert Section */}
        <WeatherAlert />

        {/* Features section */}
        <div className="features-section">
          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className={`feature-icon ${feature.color}`}>
                  <span>{feature.icon}</span>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>

                <div
                  className="feature-link"
                  onClick={() => handleLearnMore(index)}
                >
                  Learn more <span className="link-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bottom-cta">
          <h2 className="cta-title">Ready to Get Started?</h2>
          <p className="cta-description">Join thousands of farmers already using AgroCare AI</p>
          <button className="cta-button" onClick={handleTryFree}>
            Try It Free Today
          </button>
        </div>
      </div>

      {/* Demo Modal */}
      {showDemoModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <h2 className="modal-title">🎥 Product Demo</h2>
            <div className="video-container">
              {!isPlaying ? (
                <div className="video-placeholder" onClick={handlePlayDemo}>
                  <div className="play-button">▶</div>
                  <p className="video-text">Click to Play Demo</p>
                </div>
              ) : (
                <div className="video-player">
                  {/* Embed YouTube demo video */}
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                    <iframe
                      title="AgroCare Demo"
                      src="https://www.youtube.com/embed/GC_h255anM0?autoplay=1"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '15px' }}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
            <p className="modal-description">
              See how AgroCare AI revolutionizes farming with real-time disease detection,
              smart analytics, and actionable insights for your crops.
            </p>
            <div className="demo-features">
              <div className="demo-feature">✓ Upload crop images</div>
              <div className="demo-feature">✓ Get instant AI analysis</div>
              <div className="demo-feature">✓ Receive treatment recommendations</div>
            </div>
          </div>
        </div>
      )}

      {/* Learn More Modal */}
      {showLearnMore !== null && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content feature-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <div className="modal-icon-large">{features[showLearnMore].icon}</div>
            <h2 className="modal-title">{features[showLearnMore].title}</h2>
            <p className="modal-description">
              {features[showLearnMore].details}
            </p>
            <div className="modal-actions">
              <button className="modal-button primary" onClick={() => {
                closeModal();
                handleStartAnalyzing();
              }}>
                Get Started Now
              </button>
              <button className="modal-button secondary" onClick={closeModal}>
                Learn More Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="success-toast">
          <div className="success-icon">✓</div>
          <div className="success-content">
            <h4 className="success-title">Welcome Aboard!</h4>
            <p className="success-text">Redirecting to your dashboard...</p>
          </div>
        </div>
      )}

      {/* Scroll indicator */}
      <div className="scroll-indicator">
        <div className="scroll-wheel">
          <div className="scroll-dot"></div>
        </div>
      </div>
    </main>
  );
};