"use client";

import { useEffect, useState } from "react";

const DESTINATION_COORDS = {
  dubai: { lat: 25.2048, lon: 55.2708, label: "Dubai City", defaultTemp: 32.4 },
  "dubai city": { lat: 25.2048, lon: 55.2708, label: "Dubai City", defaultTemp: 32.4 },
  "abu dhabi": { lat: 24.4539, lon: 54.3773, label: "Abu Dhabi", defaultTemp: 33.1 },
  "ras al khaimah": { lat: 25.7895, lon: 55.9432, label: "Ras Al Khaimah", defaultTemp: 31.8 },
  sharjah: { lat: 25.3463, lon: 55.4209, label: "Sharjah", defaultTemp: 32.0 },
  fujairah: { lat: 25.1288, lon: 56.3265, label: "Fujairah", defaultTemp: 30.5 },
  singapore: { lat: 1.3521, lon: 103.8198, label: "Singapore", defaultTemp: 29.5 },
  bangkok: { lat: 13.7563, lon: 100.5018, label: "Bangkok", defaultTemp: 31.0 },
  london: { lat: 51.5074, lon: -0.1278, label: "London", defaultTemp: 18.2 },
  paris: { lat: 48.8566, lon: 2.3522, label: "Paris", defaultTemp: 19.5 },
  bali: { lat: -8.4095, lon: 115.1889, label: "Bali", defaultTemp: 28.6 },
  istanbul: { lat: 41.0082, lon: 28.9784, label: "Istanbul", defaultTemp: 22.0 },
};

const weatherCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 mins

function getWeatherIcon(code, isDay = 1) {
  if (code === 0 || code === 1) return isDay ? "☀️" : "🌙";
  if (code === 2) return isDay ? "🌤️" : "☁️";
  if (code === 3) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return isDay ? "☀️" : "🌙";
}

/**
 * Fetches real-time live temperature and condition for any travel destination.
 * Uses Open-Meteo free API with local caching and realistic fallback.
 */
export async function fetchDestinationWeather(city) {
  const norm = String(city || "Dubai").trim().toLowerCase();
  const entry = DESTINATION_COORDS[norm] || DESTINATION_COORDS.dubai;

  const cacheKey = `${entry.lat},${entry.lon}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${entry.lat}&longitude=${entry.lon}&current=temperature_2m,weather_code,is_day`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Weather request failed");
    const json = await res.json();
    const cur = json.current;
    const tempNum = Number(cur.temperature_2m);
    const data = {
      temp: tempNum.toFixed(1),
      icon: getWeatherIcon(cur.weather_code, cur.is_day),
      isDay: cur.is_day === 1,
      city: entry.label,
    };
    weatherCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch {
    // Graceful fallback with realistic temp
    const fallback = {
      temp: (entry.defaultTemp || 32.4).toFixed(1),
      icon: "☀️",
      isDay: true,
      city: entry.label,
    };
    return fallback;
  }
}

/**
 * React hook to get live weather for a destination.
 */
export function useDestinationWeather(destinationName) {
  const [weather, setWeather] = useState({
    temp: "32.4",
    icon: "☀️",
    isDay: true,
    city: destinationName || "Dubai City",
    loading: true,
  });

  useEffect(() => {
    let active = true;
    fetchDestinationWeather(destinationName).then((data) => {
      if (active) {
        setWeather({ ...data, loading: false });
      }
    });
    return () => {
      active = false;
    };
  }, [destinationName]);

  return weather;
}

