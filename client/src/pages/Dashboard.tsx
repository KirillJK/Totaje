import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface Weather {
  city: string;
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  lastUpdated: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
    fetchWeather();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/todos', {
        withCredentials: true,
      });
      setTodos(response.data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async () => {
    try {
      console.log('Fetching weather data...');
      const response = await axios.get('http://localhost:3000/api/weather', {
        withCredentials: true,
      });
      console.log('Weather response:', response.data);
      setWeather(response.data);
    } catch (error: any) {
      console.error('Failed to fetch weather:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
    } finally {
      setWeatherLoading(false);
    }
  };

  const incompleteTodos = todos.filter(t => !t.completed).length;

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Welcome</h3>
          <p className="text-gray-600">Hello, {user?.displayName}!</p>
        </div>

        <Link to="/todos" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Tasks</h3>
          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : (
            <>
              <p className="text-3xl font-bold text-orange-600">{incompleteTodos}</p>
              <p className="text-gray-600 text-sm">Pending tasks</p>
            </>
          )}
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Weather</h3>
          {weatherLoading ? (
            <p className="text-gray-600">Loading...</p>
          ) : weather ? (
            <div>
              <div className="flex items-center gap-4">
                <img
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt={weather.description}
                  className="w-16 h-16"
                />
                <div>
                  <p className="text-3xl font-bold text-blue-600">{weather.temperature}°C</p>
                  <p className="text-gray-600 capitalize">{weather.description}</p>
                  <p className="text-gray-500 text-sm">{weather.city}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Updated: {new Date(weather.lastUpdated).toLocaleTimeString()}
              </p>
            </div>
          ) : (
            <p className="text-gray-600">Weather unavailable</p>
          )}
        </div>
      </div>

      <div className="mt-6 md:mt-8 bg-white rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4">Recent Updates</h2>
        <p className="text-gray-600 text-sm md:text-base">No updates available at the moment.</p>
      </div>
    </div>
  );
};

export default Dashboard;
