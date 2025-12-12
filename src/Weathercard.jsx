import { useEffect, useState } from 'react';

export default function WeatherCard() {
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState("Locating...");

  useEffect(() => {
    if (!navigator.geolocation) {
        setLocationName("GPS Offline");
        return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      
      // 1. Fetch Weather
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code`);
      const weatherData = await weatherRes.json();
      setWeather(weatherData.current);

      // 2. Reverse Geocode to get City Name (using a free OSM service)
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const geoData = await geoRes.json();
        // Try to find the most relevant city name
        const city = geoData.address.city || geoData.address.town || geoData.address.village || "Unknown Location";
        setLocationName(city);
      } catch (e) {
        setLocationName("Local Sector");
      }
    }, () => setLocationName("GPS Denied"));
  }, []);

  if (!weather) return <div className="race-card bg-[#1a1a2e] h-full rounded-2xl animate-pulse border-b-cyan-900/50"></div>;

  // Map weather code to a simple condition string
  const getCondition = (code) => {
    if (code === 0) return "Clear Sky";
    if (code < 3) return "Partly Cloudy";
    if (code < 50) return "Overcast";
    if (code < 80) return "Rain Showers";
    return "Storm Conditions";
  };

  return (
    // Use the same race-card utility, but override the glow color to cyan
    <div className="race-card bg-[#1a1a2e] rounded-2xl p-6 h-full flex flex-col justify-between relative overflow-hidden group" style={{'--glow-color': 'var(--cyan-glow)'}}>
      
      {/* Decorative angular background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/20 to-transparent [clip-path:polygon(100%_0,0_0,100%_100%)]"></div>
      
      <div>
         <div className="flex items-center gap-2 mb-4 font-mono text-xs uppercase tracking-wider text-cyan-400">
            <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_5px_#00f7ff]"></span>
            Local Atmos
         </div>
         <h2 className="text-white text-lg font-bold truncate">{locationName}</h2>
         <p className="text-cyan-200 text-sm font-mono uppercase">{getCondition(weather.weather_code)}</p>
      </div>

      <div className="flex items-end justify-between mt-6">
         <div>
            <span className="text-5xl font-black text-white tracking-tighter">
               {Math.round(weather.temperature_2m)}<span className="text-2xl text-cyan-400">°C</span>
            </span>
         </div>
         <div className="text-right font-mono text-xs text-cyan-300">
            <span className="block uppercase text-gray-500">Wind Vel.</span>
            <span className="text-lg font-bold">{weather.wind_speed_10m}</span> km/h
         </div>
      </div>
    </div>
  );
}