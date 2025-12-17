import React, { useState, useEffect } from 'react';
import { getCurrentWeather, getWeatherByCoords, getUserLocation, analyzeDiseaseRisk } from './WeatherService';
import './WeatherAlert.css';

const WeatherAlert = ({ city = null, country = 'IN' }) => {
    const [weatherData, setWeatherData] = useState(null);
    const [riskAnalysis, setRiskAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [locationName, setLocationName] = useState('');

    useEffect(() => {
        fetchWeather();
    }, [city, country]);

    const fetchWeather = async () => {
        setLoading(true);
        setError(null);

        try {
            let data;

            // Try to get user's location first if no city specified
            if (!city) {
                try {
                    const coords = await getUserLocation();
                    data = await getWeatherByCoords(coords.lat, coords.lon);
                    setLocationName(data.name);
                } catch (locError) {
                    // Fallback to default city if geolocation fails
                    console.log('Geolocation failed, using default city');
                    data = await getCurrentWeather('Delhi', country);
                    setLocationName('Delhi');
                }
            } else {
                data = await getCurrentWeather(city, country);
                setLocationName(city);
            }

            setWeatherData(data);

            // Analyze disease risk based on weather
            const analysis = analyzeDiseaseRisk(data);
            setRiskAnalysis(analysis);

            setLoading(false);
        } catch (err) {
            console.error('Weather fetch error:', err);
            setError('Unable to fetch weather data. Please try again later.');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="weather-alert-container">
                <div className="weather-loading">
                    <div className="weather-icon">🌤️</div>
                    <p>Loading weather data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="weather-alert-container">
                <div className="weather-error">
                    <div className="weather-error-title">⚠️ Weather Service Unavailable</div>
                    <div className="weather-error-message">{error}</div>
                    <button className="retry-button" onClick={fetchWeather}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!weatherData) return null;

    const { main, weather, wind } = weatherData;
    const weatherDescription = weather[0]?.description || 'N/A';
    const weatherIcon = weather[0]?.main || 'Clear';

    // Map weather conditions to emojis
    const getWeatherEmoji = (condition) => {
        const emojiMap = {
            'Clear': '☀️',
            'Clouds': '☁️',
            'Rain': '🌧️',
            'Drizzle': '🌦️',
            'Thunderstorm': '⛈️',
            'Snow': '❄️',
            'Mist': '🌫️',
            'Fog': '🌫️',
            'Haze': '🌫️'
        };
        return emojiMap[condition] || '🌤️';
    };

    return (
        <div className="weather-alert-container">
            <div className="weather-header">
                <h2 className="weather-title">
                    <span className="weather-icon">{getWeatherEmoji(weatherIcon)}</span>
                    Weather & Disease Risk
                </h2>
                <div className="location-info">
                    📍 {locationName}
                </div>
            </div>

            <div className="weather-content">
                <div className="weather-stat">
                    <div className="stat-label">Temperature</div>
                    <div className="stat-value">
                        {Math.round(main.temp)}
                        <span className="stat-unit">°C</span>
                    </div>
                </div>

                <div className="weather-stat">
                    <div className="stat-label">Humidity</div>
                    <div className="stat-value">
                        {main.humidity}
                        <span className="stat-unit">%</span>
                    </div>
                </div>

                <div className="weather-stat">
                    <div className="stat-label">Feels Like</div>
                    <div className="stat-value">
                        {Math.round(main.feels_like)}
                        <span className="stat-unit">°C</span>
                    </div>
                </div>

                <div className="weather-stat">
                    <div className="stat-label">Conditions</div>
                    <div className="stat-value" style={{ fontSize: '16px', textTransform: 'capitalize' }}>
                        {weatherDescription}
                    </div>
                </div>
            </div>

            {riskAnalysis && (
                <div className={`risk-alert ${riskAnalysis.riskLevel}`}>
                    <div className="risk-header">
                        <span className="risk-badge">{riskAnalysis.riskLevel} Risk</span>
                    </div>

                    <div className="risk-message">
                        {riskAnalysis.message}
                    </div>

                    {riskAnalysis.risks && riskAnalysis.risks.length > 0 && (
                        <div className="risk-diseases">
                            <h4>Potential Diseases:</h4>
                            <div className="disease-list">
                                {riskAnalysis.risks.map((disease, index) => (
                                    <span key={index} className="disease-tag">
                                        {disease}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {riskAnalysis.recommendations && riskAnalysis.recommendations.length > 0 && (
                        <div className="recommendations">
                            <h4>Recommendations:</h4>
                            <ul className="recommendation-list">
                                {riskAnalysis.recommendations.map((rec, index) => (
                                    <li key={index}>{rec}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WeatherAlert;
