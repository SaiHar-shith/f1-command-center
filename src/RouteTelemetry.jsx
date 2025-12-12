import { useState, useEffect } from 'react';

// --- MATH HELPER: HAVERSINE FORMULA ---
// Calculates distance between two coords if API fails
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg) => deg * (Math.PI/180);

const useSmartCommute = (origin, destination) => {
  const [data, setData] = useState({ 
    duration: 0,        
    delta: "CALC...",      
    sectors: [          
      { id: 1, status: 'PURPLE', label: 'HOME EXIT' },
      { id: 2, status: 'YELLOW', label: 'MAIN ROAD' },
      { id: 3, status: 'GREEN', label: 'GYM ENTRY' }
    ]
  });

  useEffect(() => {
    // 1. Initial Checks
    if (!origin || !destination) return;

    const calculateRoute = async () => {
      try {
        // --- ATTEMPT 1: OSRM API ---
        const url = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=false`;
        
        // Set a short timeout so we don't wait forever if server is slow
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("API Down");

        const json = await res.json();
        
        if (json.routes && json.routes.length > 0) {
          // API SUCCESS
          const seconds = json.routes[0].duration;
          const currentMins = Math.round(seconds / 60);
          updateData(currentMins);
          return; 
        }
      } catch (e) {
        // --- ATTEMPT 2: MATH FALLBACK (Crash Proof) ---
        // console.warn("API Failed, using Physics Engine...");
        
        const distKm = getDistance(origin.lat, origin.lon, destination.lat, destination.lon);
        // Assume avg city speed of 30km/h + 2 mins for lights
        const estimatedMins = Math.round((distKm / 30) * 60) + 2; 
        
        updateData(estimatedMins);
      }
    };

    const updateData = (currentMins) => {
        // Calculate "Traffic" vs Ideal time (85% of current)
        const idealMins = Math.round(currentMins * 0.85); 
        const diff = currentMins - idealMins;

        let deltaStr = "-0.0s";
        let sectorColor = "PURPLE"; 

        if (diff > 5) {
            deltaStr = `+${diff}m`; 
            sectorColor = "RED";
        } else if (diff > 0) {
            deltaStr = `+${diff}m`; 
            sectorColor = "YELLOW";
        } else {
            deltaStr = `-${Math.abs(diff)}m`; 
            sectorColor = "PURPLE";
        }

        setData({
            duration: currentMins,
            delta: deltaStr,
            sectors: [
                { id: 1, status: 'PURPLE', label: 'HOME EXIT' },
                { id: 2, status: sectorColor, label: 'HIGHWAY' }, 
                { id: 3, status: 'GREEN', label: 'GYM ENTRY' }
            ]
        });
    };

    calculateRoute();
    const interval = setInterval(calculateRoute, 60000); // Refresh every minute
    return () => clearInterval(interval);

  }, [origin, destination]);

  return data;
};

export default function RouteTelemetry({ userLocation, gymLocation }) {
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
                <h3 className="text-xs font-bold text-gray-500 tracking-[0.3em] uppercase mb-1">Commute Delta</h3>
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
                    <span className="text-xs text-[#00d2be] font-bold uppercase tracking-widest">ETA</span>
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