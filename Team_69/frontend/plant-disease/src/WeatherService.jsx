import axios from 'axios';

// OpenWeatherMap API configuration
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || 'demo'; // You'll need to add your API key
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Fetches current weather data for a given location
 * @param {string} city - City name
 * @param {string} country - Country code (optional)
 * @returns {Promise<Object>} Weather data
 */
export const getCurrentWeather = async (city = 'Delhi', country = 'IN') => {
    try {
        const response = await axios.get(WEATHER_API_URL, {
            params: {
                q: `${city},${country}`,
                appid: WEATHER_API_KEY,
                units: 'metric' // Celsius
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
};

/**
 * Fetches weather data by geolocation coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Weather data
 */
export const getWeatherByCoords = async (lat, lon) => {
    try {
        const response = await axios.get(WEATHER_API_URL, {
            params: {
                lat,
                lon,
                appid: WEATHER_API_KEY,
                units: 'metric'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching weather data by coords:', error);
        throw error;
    }
};

/**
 * Analyzes weather conditions and predicts disease risk
 * @param {Object} weatherData - Weather data from API
 * @returns {Object} Disease risk assessment
 */
export const analyzeDiseaseRisk = (weatherData) => {
    if (!weatherData || !weatherData.main) {
        return {
            riskLevel: 'unknown',
            message: 'Unable to assess disease risk',
            recommendations: []
        };
    }

    const { temp, humidity } = weatherData.main;
    const description = weatherData.weather[0]?.description || '';

    let riskLevel = 'low';
    let risks = [];
    let recommendations = [];

    // Late Blight Risk (High humidity + moderate temperature)
    if (humidity > 80 && temp >= 10 && temp <= 25) {
        riskLevel = 'high';
        risks.push('Late Blight');
        recommendations.push('Apply fungicide preventively');
        recommendations.push('Ensure proper plant spacing for air circulation');
    }

    // Early Blight Risk (Warm + humid)
    if (humidity > 70 && temp >= 24 && temp <= 29) {
        if (riskLevel !== 'high') riskLevel = 'medium';
        risks.push('Early Blight');
        recommendations.push('Monitor plants closely for leaf spots');
        recommendations.push('Remove infected leaves immediately');
    }

    // Bacterial Spot Risk (Warm + wet conditions)
    if ((humidity > 85 || description.includes('rain')) && temp >= 25 && temp <= 30) {
        if (riskLevel !== 'high') riskLevel = 'medium';
        risks.push('Bacterial Spot');
        recommendations.push('Avoid overhead watering');
        recommendations.push('Apply copper-based bactericide');
    }

    // Mosaic Virus Risk (Hot and dry - aphid activity)
    if (temp > 30 && humidity < 50) {
        if (riskLevel === 'low') riskLevel = 'medium';
        risks.push('Viral Diseases (Aphid-transmitted)');
        recommendations.push('Monitor for aphid populations');
        recommendations.push('Use reflective mulches to deter aphids');
    }

    // General healthy conditions
    if (risks.length === 0) {
        return {
            riskLevel: 'low',
            message: 'Weather conditions are favorable for healthy crop growth',
            risks: [],
            recommendations: ['Continue regular monitoring', 'Maintain good agricultural practices']
        };
    }

    return {
        riskLevel,
        message: `${riskLevel.toUpperCase()} risk for: ${risks.join(', ')}`,
        risks,
        recommendations,
        weatherConditions: {
            temperature: temp,
            humidity,
            description
        }
    };
};

/**
 * Gets user's geolocation
 * @returns {Promise<Object>} Coordinates {lat, lon}
 */
export const getUserLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            (error) => {
                reject(error);
            }
        );
    });
};
