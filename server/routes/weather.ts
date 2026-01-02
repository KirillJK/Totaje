import { Router } from 'express';
import axios from 'axios';

const router = Router();

// Cache for weather data
interface WeatherCache {
  data: any;
  timestamp: number;
}

let weatherCache: WeatherCache | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// Middleware to check authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Get weather data
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    const city = process.env.WEATHER_CITY || 'Bournemouth';

    if (!apiKey) {
      return res.status(500).json({ error: 'Weather API key not configured' });
    }

    // Check if cached data is still valid
    const now = Date.now();
    if (weatherCache && (now - weatherCache.timestamp) < CACHE_DURATION) {
      console.log('Returning cached weather data');
      return res.json(weatherCache.data);
    }

    // Fetch fresh data from API
    console.log('Fetching fresh weather data from API');
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );

    const weatherData = {
      city: response.data.name,
      temperature: Math.round(response.data.main.temp),
      description: response.data.weather[0].description,
      icon: response.data.weather[0].icon,
      humidity: response.data.main.humidity,
      windSpeed: response.data.wind.speed,
      lastUpdated: new Date().toISOString(),
    };

    // Update cache
    weatherCache = {
      data: weatherData,
      timestamp: now,
    };

    res.json(weatherData);
  } catch (error: any) {
    console.error('Weather API error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

export default router;
