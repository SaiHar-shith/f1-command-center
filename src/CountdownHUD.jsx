import { useState, useEffect } from 'react';

// --- LOGIC: FIND NEXT RACE ---
const useNextRace = () => {
  const [race, setRace] = useState({
    name: "AUSTRALIAN GP",
    date: new Date("2026-03-16T05:00:00Z"),
    circuit: "ALBERT PARK",
    flag: "🇦🇺"
  });

  useEffect(() => {
    const fetchRace = async () => {
      try {
        const res = await fetch('https://api.jolpi.ca/ergast/f1/current/next.json');
        const data = await res.json();
        const next = data.MRData.RaceTable.Races[0];
        
        if (next) {
          const countryMap = { "Australia": "🇦🇺", "Bahrain": "🇧🇭", "Saudi Arabia": "🇸🇦", "USA": "🇺🇸", "Italy": "🇮🇹", "Monaco": "🇲🇨", "Spain": "🇪🇸", "Canada": "🇨🇦" };
          const flag = countryMap[next.Circuit.Location.country] || "🏁";

          setRace({
            name: next.raceName.replace("Grand Prix", "GP").toUpperCase(),
            date: new Date(`${next.date}T${next.time}`),
            circuit: next.Circuit.circuitName.toUpperCase(),
            flag: flag
          });
        }
      } catch (e) { console.warn("API offline"); }
    };
    fetchRace();
  }, []);

  return race;
};

// --- LOGIC: COUNTDOWN ---
const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState({ d: "00", h: "00", m: "00", s: "00" });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft({ d: "00", h: "00", m: "00", s: "00" });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / 1000 / 60) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        
        setTimeLeft({
          d: days < 10 ? `0${days}` : days,
          h: hours < 10 ? `0${hours}` : hours,
          m: mins < 10 ? `0${mins}` : mins,
          s: secs < 10 ? `0${secs}` : secs
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
};

// --- ULTRA-SLEEK COMPONENT ---
export default function CountdownHUD() {
  const race = useNextRace();
  const t = useCountdown(race.date);

  return (
    <div className="absolute top-1/2 -translate-y-1/2 left-10 pointer-events-none animate-in fade-in slide-in-from-left-8 duration-1000">
      
      <div className="flex gap-6">
        
        {/* 1. THE TEAL ANCHOR LINE */}
        {/* A glowing vertical bar that defines the edge */}
        <div className="w-1 bg-[#00d2be] rounded-full shadow-[0_0_15px_#00d2be] opacity-80 h-auto"></div>

        {/* 2. THE CONTENT STACK */}
        <div className="flex flex-col justify-center">
            
            {/* Header: Next GP */}
            <div className="flex items-center gap-3 mb-2 opacity-70">
                <span className="text-xl filter grayscale contrast-200">{race.flag}</span>
                <span className="text-xs font-bold text-[#00d2be] tracking-[0.3em] uppercase">Next Grand Prix</span>
            </div>

            {/* Race Name (Huge) */}
            <h1 className="text-5xl font-black italic text-white tracking-tighter uppercase font-sans leading-none mb-6 drop-shadow-2xl">
              {race.name}
            </h1>

            {/* The Numbers (Clean Row) */}
            <div className="flex items-baseline gap-8">
                
                {/* Time Unit Group */}
                <div className="group">
                    <div className="text-6xl font-thin text-white font-mono tracking-tighter leading-none group-hover:text-[#00d2be] transition-colors">
                        {t.d}
                    </div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">Days</div>
                </div>

                {/* Time Unit Group */}
                <div className="group">
                    <div className="text-6xl font-thin text-white font-mono tracking-tighter leading-none group-hover:text-[#00d2be] transition-colors">
                        {t.h}
                    </div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">Hrs</div>
                </div>

                {/* Time Unit Group */}
                <div className="group">
                    <div className="text-6xl font-thin text-white font-mono tracking-tighter leading-none group-hover:text-[#00d2be] transition-colors">
                        {t.m}
                    </div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">Mins</div>
                </div>

            </div>

            {/* Footer: Circuit Location */}
            <div className="mt-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-[#00d2be] rounded-full animate-pulse"></div>
                <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">
                    {race.circuit}
                </p>
            </div>

        </div>
      </div>
    </div>
  );
}