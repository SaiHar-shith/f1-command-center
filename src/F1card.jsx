import { useEffect, useState } from 'react';

export default function F1Card() {
  const [race, setRace] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hardcoded date/track for the 2026 season opener to ensure it looks good now.
  // In the future, you'd connect the API back here.
  const DEMO_RACE = {
    season: "2026",
    round: "1",
    raceName: "Australian Grand Prix",
    circuit: "Albert Park",
    date: "2026-03-16",
    // A simplified SVG path of the Albert Park circuit for the background
    trackPath: "M 180 50 L 220 60 L 250 100 L 240 150 L 200 180 L 150 170 L 100 150 L 60 180 L 30 160 L 20 100 L 50 50 L 100 30 L 150 40 Z"
  };

  useEffect(() => {
    // Simulate API loading for effect
    setTimeout(() => {
       setRace(DEMO_RACE);
       setLoading(false);
    }, 800);
  }, []);

  const getDaysAway = (dateString) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const raceDate = new Date(dateString);
    return Math.ceil((raceDate - today) / (1000 * 60 * 60 * 24));
  };

  if (loading) return <div className="race-card bg-carbon h-72 rounded-2xl animate-pulse border-b-red-900/50"></div>;

  return (
    // The main card container with the carbon texture and red glow on hover
    <div className="race-card bg-carbon rounded-2xl overflow-hidden relative h-full flex flex-col justify-between group" style={{'--glow-color': 'var(--race-red)'}}>
      
      {/* Background Glowing Track Map */}
      <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-full opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-500" viewBox="0 0 300 200">
         <path d={race.trackPath} fill="none" stroke="var(--race-red)" strokeWidth="2" className="blur-[2px]" />
         <path d={race.trackPath} fill="none" stroke="var(--race-red)" strokeWidth="1" />
      </svg>
      
      {/* Top Header Section */}
      <div className="p-6 relative z-10 bg-gradient-to-b from-black/80 to-transparent">
         <div className="flex justify-between items-center mb-2 font-mono text-xs uppercase tracking-wider text-red-500">
            <div className="flex items-center gap-2">
               <span className="inline-block w-2 h-2 bg-red-600 rounded-sm"></span>
               Next Event
            </div>
            <span>Rnd {race.round} / {race.season}</span>
         </div>
         <h2 className="text-2xl md:text-3xl font-black italic uppercase leading-none text-white">
            {race.raceName.replace("Grand Prix", "")}
            <span className="block text-red-600 text-lg md:text-xl">Grand Prix</span>
         </h2>
      </div>

      {/* Bottom "Dashboard" Data Section */}
      <div className="relative z-10 p-4 bg-black/50 border-t border-white/10 backdrop-blur-sm grid grid-cols-3 divide-x divide-white/10">
         
         {/* Data Point 1: Days Away */}
         <div className="px-4 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-[10px] text-gray-400 uppercase mb-1">T-Minus</span>
            <span className="text-3xl font-bold text-white leading-none">{getDaysAway(race.date)}</span>
            <span className="font-mono text-[10px] text-red-500 uppercase font-bold mt-1">Days</span>
         </div>

         {/* Data Point 2: Circuit */}
         <div className="px-4 flex flex-col items-center justify-center text-center col-span-2">
             <span className="font-mono text-[10px] text-gray-400 uppercase mb-1">Circuit Location</span>
             <span className="text-lg font-bold text-white leading-tight truncate w-full">{race.circuit}</span>
             <span className="font-mono text-[10px] text-gray-500 uppercase mt-1">
               {new Date(race.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
             </span>
         </div>
      </div>
    </div>
  );
}