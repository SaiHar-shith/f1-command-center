import { useState, useEffect } from 'react';
import Scene from './Scene';
import RaceEngineer from './RaceEngineer';
import CountdownHUD from './CountdownHUD';
import RouteTelemetry from './RouteTelemetry';
import LocationSearch from './LocationSearch';
import PersonalTrainer from './PersonalTrainer'; // <--- 1. Import Here

// --- CONFIGURATION ---
const HOME_LOCATION = { 
  name: "HANAMKONDA", 
  country: "INDIA",
  lat: 18.02008874732819, 
  lon: 79.54670127005744,
  timezone: "Asia/Kolkata"
};
// Updated to your Hanamkonda location
const GYM_LOCATION = { 
  lat: 18.02008874732819, 
  lon: 79.54670127005744
};

const getTime = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};
const getDate = () => {
    const d = new Date();
    return {
      weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
      day: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    };
};
// Helper: Get time for a specific timezone
const getWorldTime = (tz) => {
  try {
    const d = new Date();
    return d.toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
  } catch (e) { return "--:--"; }
};
// Helper: Get date for a specific timezone
const getWorldDate = (tz) => {
  try {
    const d = new Date();
    const options = { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric' };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(d);
    const weekday = parts.find(p => p.type === 'weekday')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return { weekday, day: `${month} ${day}` };
  } catch (e) { return { weekday: "--", day: "--" }; }
};

export default function App() {
  const [mode, setMode] = useState('F1'); 
  const [weather, setWeather] = useState({ temperature_2m: 24, weather_code: 0, precipitation: 0 });
  const [currentLocation, setCurrentLocation] = useState(HOME_LOCATION);
  const [showSearch, setShowSearch] = useState(false);
  const [time, setTime] = useState("");
  const [date, setDate] = useState({ weekday: "", day: "" });

  // Auto-switch back to Home if Gym Mode is activated
  useEffect(() => {
    if (mode === 'GYM') {
        setCurrentLocation(HOME_LOCATION);
        setShowSearch(false);
    }
  }, [mode]);

  // CLOCK ENGINE
  useEffect(() => {
      setTime(getWorldTime(currentLocation.timezone));
      setDate(getWorldDate(currentLocation.timezone));
      const timer = setInterval(() => {
        setTime(getWorldTime(currentLocation.timezone));
        setDate(getWorldDate(currentLocation.timezone));
      }, 1000);
      return () => clearInterval(timer);
  }, [currentLocation]);

  // WEATHER ENGINE
  useEffect(() => {
    const fetchWeather = async () => {
        try {
            const { lat, lon } = currentLocation;
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,precipitation`);
            const data = await res.json();
            if (data.current) setWeather(data.current);
        } catch (e) { console.error("Weather API failed"); }
    };
    fetchWeather(); 
    const wTimer = setInterval(fetchWeather, 60000); 
    return () => clearInterval(wTimer);
  }, [currentLocation]);

  const handleLocationSelect = (loc) => {
      setCurrentLocation({
          name: loc.name,
          country: loc.country,
          lat: loc.lat,
          lon: loc.lon,
          timezone: loc.timezone
      });
      setShowSearch(false);
  };

  const getGymStatus = () => {
    const { weather_code, temperature_2m } = weather;
    if (weather_code >= 51) return { status: "NO GO", subtext: "TRACK WET", color: "text-red-500", borderColor: "border-red-500/50" };
    if (temperature_2m < 5) return { status: "WARNING", subtext: "LOW TEMP", color: "text-orange-500", borderColor: "border-orange-500/50" };
    return { status: "GO LIFT", subtext: "OPTIMAL", color: "text-green-500", borderColor: "border-green-500/50" };
  };
  const gymDecision = getGymStatus();

  return (
    <div className="relative w-full h-screen bg-[#050505] text-white overflow-hidden font-sans">
      
      <Scene weatherCode={weather.weather_code} />
      <RaceEngineer mode={mode} weather={weather} />
      
      {/* LEFT WIDGET SWAPPER (Countdown vs Traffic) */}
      <div className="absolute z-20 top-0 left-0 w-full h-full pointer-events-none">
         {mode === 'F1' ? (
             <CountdownHUD /> 
         ) : (
             <RouteTelemetry 
                userLocation={{ lat: HOME_LOCATION.lat, lon: HOME_LOCATION.lon }} 
                gymLocation={{ lat: GYM_LOCATION.lat, lon: GYM_LOCATION.lon }} 
             />
         )}
      </div>

      {/* SEARCH POPUP */}
      {showSearch && (
          <div className="pointer-events-auto">
             <LocationSearch onClose={() => setShowSearch(false)} onSelect={handleLocationSelect} />
          </div>
      )}

      {/* 2. THE NEW PERSONAL TRAINER (Only visible in GYM mode) */}
      <div className="pointer-events-auto">
         <PersonalTrainer visible={mode === 'GYM'} />
      </div>

      {/* MAIN UI OVERLAY */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-8 pointer-events-none select-none">
        
        {/* HEADER */}
        <header className="flex justify-between items-start">
          <div>
            <div className="text-6xl font-black tracking-tighter drop-shadow-lg transition-all duration-300">
               {time}
            </div>
            <div className="mt-1 text-sm text-gray-400 uppercase tracking-widest">
               {date.weekday}, {date.day}
            </div>
          </div>
          
          <button 
            onClick={() => setMode(mode === 'F1' ? 'GYM' : 'F1')}
            className="pointer-events-auto group relative flex items-center gap-3 px-6 py-2 rounded-full border border-white/10 bg-black/20 backdrop-blur-md hover:bg-white/5 transition-all"
          >
             <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${mode === 'F1' ? 'bg-green-500 shadow-green-500' : 'bg-blue-500 shadow-blue-500'}`}></div>
             <span className="text-xs font-bold uppercase tracking-widest text-gray-300 group-hover:text-white">
               {mode === 'F1' ? 'Live Telemetry' : 'Gym Protocol'}
             </span>
          </button>
        </header>

        {/* RIGHT PANEL (Temperature or Gym Status) */}
        <div className="absolute top-1/2 -translate-y-1/2 right-8 text-right pointer-events-auto w-64">
           {mode === 'F1' ? (
             <div className="animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="text-8xl font-black tracking-tighter text-white drop-shadow-2xl leading-none">
                 {Math.round(weather.temperature_2m)}°
               </div>
               <div className="text-sm text-gray-400 uppercase tracking-widest font-bold mt-2">Track Temp</div>
               <div className="text-[10px] text-[#00d2be] uppercase tracking-widest mt-1">
                 Sector: {currentLocation.name}
               </div>
             </div>
           ) : (
             <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col items-end gap-6">
                <div className={`border-r-4 ${gymDecision.borderColor} pr-4 py-1 text-right bg-gradient-to-l from-white/5 to-transparent pl-8 rounded-r-sm`}>
                    <div className={`text-6xl font-black italic tracking-tighter ${gymDecision.color} leading-none`}>
                        {gymDecision.status}
                    </div>
                    <div className="text-xs text-gray-300 uppercase tracking-widest mt-1">Mission Status</div>
                </div>
                {/* Weather details... */}
             </div>
           )}
        </div>

        {/* FOOTER */}
        <footer className="grid grid-cols-2 gap-8 items-end">
           <div 
             onClick={() => mode === 'F1' && setShowSearch(!showSearch)} 
             className={`transition-all duration-300 ${mode === 'F1' ? 'cursor-pointer hover:opacity-80 active:scale-95' : 'opacity-50 cursor-not-allowed'}`}
           >
              {mode === 'F1' && <div className="text-[10px] text-[#00d2be] uppercase tracking-widest mb-1 animate-pulse">
                {showSearch ? 'Close Scanner' : 'Click to Search Sector'}
              </div>}
              
              <h1 className="text-5xl font-black uppercase leading-none text-white drop-shadow-lg pointer-events-auto">
                {currentLocation.name}, <br/> {currentLocation.country}
              </h1>
           </div>
           
           <div className="flex justify-end gap-6 font-mono text-xs text-gray-400">
              <div className="flex items-center gap-2"><span className="text-orange-400 text-lg">☀</span>06:22 AM</div>
              <div className="flex items-center gap-2"><span className="text-purple-400 text-lg">☾</span>08:59 PM</div>
           </div>
        </footer>

      </div>
    </div>
  );
}