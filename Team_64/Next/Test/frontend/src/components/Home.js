import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Timeline,
  Notifications,
  ShowChart,
  Insights,
  BarChart,
} from '@mui/icons-material';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Stock Price Predictions",
      description: "Get accurate predictions of stock prices using our advanced machine learning models.",
      icon: <ShowChart style={{ fontSize: 36 }} />,
      color: "primary",
    },
    {
      title: "AI-Powered Predictions",
      description: "Leverage advanced machine learning algorithms to predict future stock price movements and trends.",
      icon: <Insights style={{ fontSize: 36 }} />,
      color: "secondary",
    },
    {
      title: "Comprehensive Analytics",
      description: "Dive deep into market data with our comprehensive analytics tools and interactive visualizations.",
      icon: <BarChart style={{ fontSize: 36 }} />,
      color: "primary",
    },
    {
      title: "Custom Alert System",
      description: "Set up personalized alerts for price changes, volume spikes, and important market events.",
      icon: <Notifications style={{ fontSize: 36 }} />,
      color: "secondary",
    },
    {
      title: "News Integration",
      description: "Stay informed with the latest financial news and how they might impact your investments.",
      icon: <Timeline style={{ fontSize: 36 }} />,
      color: "primary",
    },
    {
      title: "Market Trends",
      description: "Identify emerging market trends and potential investment opportunities early.",
      icon: <TrendingUp style={{ fontSize: 36 }} />,
      color: "secondary",
    },
  ];

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Stock price Predictions
                <span className="text-secondary-light"> Powered by AI</span>
              </h1>
              <p className="text-xl mb-8 opacity-90">
                Make data-driven investment decisions with our cutting-edge stock market analysis platform
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => navigate('/dashboard')} 
                  className="bg-secondary text-white font-semibold py-3 px-8 rounded-lg text-base hover:-translate-y-1 transition-all duration-300 hover:shadow-lg"
                >
                  Go to Dashboard
                </button>
                <button 
                  onClick={() => navigate('/news')} 
                  className="border border-white text-white font-semibold py-3 px-8 rounded-lg text-base hover:bg-white hover:bg-opacity-10 transition-all duration-300 hover:-translate-y-1"
                >
                  Latest News
                </button>
              </div>
            </div>
            <div className="hidden md:block relative h-96 w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-light/10 to-transparent rounded-lg"></div>
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 rounded-lg shadow-2xl"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-3">Market at a Glance</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 text-center mb-12">
            Real-time insights from global markets
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="glass-effect bg-white dark:bg-dark-paper rounded-2xl p-6 text-center shadow-lg transition-all duration-300 hover:-translate-y-1">
              <p className="text-4xl font-bold text-primary mb-2">38.4K+</p>
              <p className="text-lg font-semibold">Active Traders</p>
            </div>
            <div className="glass-effect bg-white dark:bg-dark-paper rounded-2xl p-6 text-center shadow-lg transition-all duration-300 hover:-translate-y-1">
              <p className="text-4xl font-bold text-secondary mb-2">5.2M+</p>
              <p className="text-lg font-semibold">Daily Transactions</p>
            </div>
            <div className="glass-effect bg-white dark:bg-dark-paper rounded-2xl p-6 text-center shadow-lg transition-all duration-300 hover:-translate-y-1">
              <p className="text-4xl font-bold text-primary mb-2">94%</p>
              <p className="text-lg font-semibold">Prediction Accuracy</p>
            </div>
            <div className="glass-effect bg-white dark:bg-dark-paper rounded-2xl p-6 text-center shadow-lg transition-all duration-300 hover:-translate-y-1">
              <p className="text-4xl font-bold text-secondary mb-2">8K+</p>
              <p className="text-lg font-semibold">Stocks Analyzed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-dark-DEFAULT/30">
        <div className="container mx-auto px-4">
          <h2 className="gradient-text text-3xl text-center mb-3">Why Choose Our Platform</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 text-center max-w-3xl mx-auto mb-12">
            Our stock analysis platform combines cutting-edge technology with user-friendly design
            to help you make informed investment decisions
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card p-6 flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${feature.color === 'primary' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-gradient-to-r from-primary-dark/80 via-primary/70 to-secondary/70 rounded-xl text-white p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Trading Smarter?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Get access to our advanced analytics, real-time market data, and AI-powered predictions
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-white text-primary font-semibold py-3 px-8 rounded-lg text-lg hover:bg-opacity-90 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              Explore Dashboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 