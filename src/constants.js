export const DEFAULT_CITY = 'Mumbai';

export const POPULAR_CITIES = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'New York',
  'London',
];

export const API_ENDPOINT = 'https://api.weatherapi.com/v1/current.json';

/**
 * The key is intentionally a client-side build variable. WeatherAPI keys are
 * browser-visible by nature; see the security note in the README.
 */
export const API_KEY = import.meta.env?.VITE_WEATHER_API_KEY?.trim() ?? '';

export const REQUEST_TIMEOUT_MS = 15000;

/**
 * Thresholds live in one place so the verdict logic stays explainable and
 * testable. Priority order is implemented in src/weather.js.
 */
export const PERSONALITY_THRESHOLDS = {
  freezeMaxC: 10,
  heatMinC: 35,
  pleasantMinC: 18,
  pleasantMaxC: 30,
  windyMinKph: 35,
  highUv: 8,
};
