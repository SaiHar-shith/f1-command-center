import { useState, useEffect } from 'react';

// --- CONFIGURATION ---
// 1. Get a Key: https://console.cloud.google.com/google/maps-apis/credentials
// 2. Enable "Distance Matrix API"
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

// NOTE: Google blocks direct browser calls (CORS). 
// For dev, use a proxy like 'https://cors-anywhere.herokuapp.com/' or build your own backend.
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/"; 

const useSmartCommute = (origin, destination) => {
  const [data, setData] = useState({ 
    duration: 0,        
    delta: "SYNC...",      
    sectors: [          
      { id: 1, status: 'PURPLE', label: 'SECTOR 1' },
      { id: 2, status: 'PURPLE', label: 'SECTOR 2' },
      { id: 3, status: 'PURPLE', label: 'SECTOR 3' }
    ]
  });

  useEffect(() => {
    if (!origin || !destination) return;

    const calculateRoute = async () => {
      try {
        // --- GOOGLE MAPS DISTANCE MATRIX API ---
        const origins = `${origin.lat},${origin.lon}`;
        const dests = `${destination.lat},${destination.lon}`;
        
        // Requesting 'best_guess' traffic model for right now
        const url = `${CORS_PROXY}https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${dests}&departure_time=now&traffic_model=best_guess&key=${GOOGLE_API_KEY}`;
        
        const res = await fetch(url);
        const json = await res.json();

        if (json.rows && json.rows[0].elements[0].status === "OK") {
          const element = json.rows[0].elements[0];
          
          // 1. Standard Time (No Traffic)
          const standardSeconds = element.duration.value;
          // 2. Real Time (With Traffic)
          const trafficSeconds = element.duration_in_traffic.value;
          
          updateData(standardSeconds, trafficSeconds);
        } else {
            console.warn("Google API Error:", json);
            // Fallback logic could go here
        }

      } catch (e) {
        console.error("Traffic Telemetry Failed", e);
        // Fallback: Use standard physics/math if API fails
        fallbackCalculation(origin, destination);
      }
    };

    const updateData = (standardSec, trafficSec) => {
        const standardMins = Math.round(standardSec / 60);
        const trafficMins = Math.round(trafficSec / 60);
        
        // Calculate the "Delay" caused by traffic
        const delay = trafficMins - standardMins;
        
        let deltaStr = "±0.0m";
        let sectorColor = "PURPLE"; // Purple = Standard/Fast

        // LOGIC: Traffic coloring based on delay
        if (delay >= 10) {
            deltaStr = `+${delay}m`; 
            sectorColor = "RED"; // Heavy Traffic
        } else if (delay > 2) {
            deltaStr = `+${delay}m`; 
            sectorColor = "YELLOW"; // Moderate Traffic
        } else if (delay <= 0) {
            deltaStr = `-${Math.abs(delay)}m`; // Faster than average?!
            sectorColor = "GREEN"; 
        }

        setData({
            duration: trafficMins, // Show the REAL time
            delta: deltaStr,
            sectors: [
                { id: 1, status: 'PURPLE', label: 'EXIT' },
                // The Middle Sector represents the main commute traffic
                { id: 2, status: sectorColor, label: 'ROUTE' }, 
                { id: 3, status: 'PURPLE', label: 'ENTRY' }
            ]
        });
    };

    const fallbackCalculation = (p1, p2) => {
        // Simple Haversine Fallback if API key is invalid/missing
        const R = 6371; 
        const dLat = (p2.lat - p1.lat) * Math.PI / 180;
        const dLon = (p2.lon - p1.lon) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c; 
        const estMins = Math.round((d / 30) * 60) + 5; // Approx 30km/h speed
        
        setData({
            duration: estMins,
            delta: "EST",
            sectors: [
                { id: 1, status: 'PURPLE', label: 'OFFLINE' },
                { id: 2, status: 'PURPLE', label: 'OFFLINE' },
                { id: 3, status: 'PURPLE', label: 'OFFLINE' }
            ]
        });
    };

    calculateRoute();
    const interval = setInterval(calculateRoute, 60000 * 2); // Refresh every 2 mins to save API quota
    return () => clearInterval(interval);

  }, [origin, destination]);

  return data;
};

export default function RouteTelemetry({ userLocation, gymLocation }) {
  // Pass the props directly to the hook
  const { duration, delta, sectors } = useSmartCommute(userLocation, gymLocation);

  const getColor = (status) => {
    if (status === 'PURPLE') return 'bg-purple-500 shadow-[0_0_15px_#a855f7]';
    if (status === 'GREEN') return 'bg-green-500 shadow-[0_0_15px_#22c55e]';
    if (status === 'YELLOW') return 'bg-yellow-500 shadow-[0_0_15px_#eab308]';
    return 'bg-red-600 shadow-[0_0_15px_#dc2626]';
  };

  return (
    <div className="absolute top-1/2 -translate-y-1/2 left-10 pointer-events-none animate-in fade-in slide-in-from-left-8 duration-500">
      <div className="flex gap-6">
        
        {/* SECTOR MAP */}
        <div className="flex flex-col gap-1 h-64 w-2">
            {sectors.map((s) => (
                <div key={s.id} className={`flex-1 w-full rounded-full transition-colors duration-1000 ${getColor(s.status)} opacity-90`}></div>
            ))}
        </div>

        {/* DATA STACK */}
        <div className="flex flex-col justify-center gap-6">
            
            {/* Header */}
            <div>
                <h3 className="text-xs font-bold text-gray-500 tracking-[0.3em] uppercase mb-1">Traffic Delta</h3>
                <h1 className={`text-6xl font-black italic font-mono tracking-tighter leading-none ${delta.includes('+') ? 'text-red-500' : 'text-purple-500'}`}>
                  {delta}
                </h1>
            </div>

            {/* Sector Details */}
            <div className="space-y-3">
                {sectors.map((s) => (
                    <div key={s.id} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getColor(s.status).split(' ')[0]}`}></div>
                        <span className="text-sm font-bold text-white uppercase tracking-widest font-sans opacity-80">
                            S{s.id} <span className="text-gray-500 mx-1">//</span> {s.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* REAL ESTIMATED TIME */}
            <div className="mt-2 border-t border-white/10 pt-4">
                 <div className="flex justify-between items-end w-48">
                    <span className="text-xs text-[#00d2be] font-bold uppercase tracking-widest">ETA (Live)</span>
                    <span className="text-2xl font-mono text-white leading-none">
                        {duration > 0 ? duration : <span className="animate-pulse">...</span>}
                        <span className="text-sm text-gray-500 ml-1">MIN</span>
                    </span>
                 </div>
            </div>

        </div>
      </div>
    </div>
  );
}