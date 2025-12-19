import React from 'react';
import { Code, TrendingUp, PieChart, Briefcase, History, Settings, Github, Linkedin, Twitter } from 'lucide-react';

const About = () => {
  const teamMembers = [
    {
      name: 'Bibek Bhandari',
      role: 'Data Engineer & Frontend Lead',
      image: '/api/placeholder/400/400',
      bio: 'CSE student specializing in  user interfaces.',
      social: { github: 'https://github.com/Bibekbhandari1', linkedin: 'https://linkedin.com/in/bibek-bhandari-053283226', X: 'https://x.com/i/flow/login?redirect_after_login=%2FBibek_1111' }
    },
    //ww.linkedin.com/in/
//

    {
      name: 'Anish Nayak',
      role: 'Backend & API Developer',
      image: '/api/placeholder/400/400',
      bio: 'Building robust REST APIs and handling data integration for real-time market insights.',
      social: { github: 'https://github.com', linkedin: 'https://linkedin.com', X: 'https://twitter.com' }
    },
    {
      name: 'Arnav Nimbark',
      role: 'ML Engineer',
      image: '/api/placeholder/400/400',
      bio: 'Designing and training LSTM models to forecast stock prices with sentiment analysis.',
      social: { github: 'https://github.com', linkedin: 'https://linkedin.com', X: 'https://twitter.com' }
    }
  ];

  const technologies = [
    {
      name: 'React.js',
      icon: <Code className="h-8 w-8 text-blue-500" />,
      description: 'Frontend framework for building a dynamic and responsive user interface.'
    },
    {
      name: 'Express.js & Node.js',
      icon: <Briefcase className="h-8 w-8 text-orange-500" />,
      description: 'Backend server for RESTful APIs to fetch and serve stock & sentiment data.'
    },
    {
      name: 'LSTM Models',
      icon: <TrendingUp className="h-8 w-8 text-green-500" />,
      description: 'Deep learning networks trained to predict stock trends using historical and sentiment features.'
    },
    {
      name: 'VADER Sentiment',
      icon: <PieChart className="h-8 w-8 text-purple-500" />,
      description: 'NLP library to analyze news headlines and generate sentiment scores.'
    },
    {
      name: 'MongoDB',
      icon: <History className="h-8 w-8 text-red-500" />,
      description: 'NoSQL database to store historical stock data, sentiment scores, and user preferences.'
    },
    {
      name: 'Tailwind CSS',
      icon: <Settings className="h-8 w-8 text-teal-500" />,
      description: 'Utility-first CSS framework for rapid UI development and customization.'
    }
  ];

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-20">
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6">
            About <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">StockPredict</span>
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
            StockPredict is an advanced stock market forecasting platform that combines machine learning, sentiment analysis, and real-time data to provide accurate predictions and actionable insights.
          </p>
        </div>

        <div className="mb-32 flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Vision</h2>
            <div className="space-y-4 text-lg text-gray-600 dark:text-gray-300">
              <p>
                Empower individual investors with professional-grade forecasting tools and real-time market insights.
              </p>
              <p>
                Leverage deep learning and NLP techniques to interpret market trends and news sentiment.
              </p>
              <p>
                Continuously refine our models to improve accuracy and adapt to changing market conditions.
              </p>
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <div className="relative h-96 overflow-hidden rounded-3xl shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-70"></div>
              <div className="absolute inset-0 flex items-center justify-center text-white p-8">
                <div className="text-center">
                  <h3 className="text-3xl font-bold mb-6">Data-Driven Strategies</h3>
                  <p className="text-xl max-w-md mx-auto">
                    Harness the power of historical price data and news sentiment to make informed trading decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-32">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            Technologies We Use
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {technologies.map((tech, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700">{tech.icon}</div>
                  <h3 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">{tech.name}</h3>
                </div>
                <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700">
                <div className="relative">
                  <img src={member.image} alt={member.name} className="w-full h-64 object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-24"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl font-bold text-white">{member.name}</h3>
                    <p className="text-blue-300 font-medium">{member.role}</p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-300 mb-6">{member.bio}</p>
                  <div className="flex space-x-4">
                    <a href={member.social.github} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"><Github className="h-5 w-5" /></a>
                    <a href={member.social.linkedin} className="text-gray-400 hover:text-blue-500 transition-colors duration-200"><Linkedin className="h-5 w-5" /></a>
                    <a href={member.social.twitter} className="text-gray-400 hover:text-blue-400 transition-colors duration-200"><Twitter className="h-5 w-5" /></a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-20">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to start predicting?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Sign up now and leverage data-driven predictions to optimize your investment strategy.
            </p>
            <button className="bg-white text-blue-600 font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              Get Started for Free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;