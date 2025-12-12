import { useState, useEffect, useRef } from 'react';

// --- SOUND ENGINE ---
const playBroadcastIntro = () => {
  // Plays ONLY the F1 Intro Sound
  const intro = new Audio('/radio_intro.mp3');
  intro.volume = 0.6; // Perfect volume for a notification
  intro.play().catch(e => console.log("Audio blocked. Click page first."));
};

// --- LOGIC ENGINE (Text Only) ---
const getRadioMessage = (mode, weather) => {
  const isRaining = weather.weather_code >= 51;
  const temp = weather.temperature_2m;
  
  // GYM MODE MESSAGES
  if (mode === 'GYM') {
    if (isRaining) return "Copy. Heavy rain detected in Sector 1. Tread carefully on the way to the gym.";
    if (temp < 10) return "Tyre blankets off. It is cold out there, make sure you get a good warmup.";
    return "Track conditions are optimal. We are looking for purple sectors today. Push hard.";
  }

  // F1 MODE MESSAGES
  if (isRaining) return "Rain is falling, track is wet. Recommend umbrella strategy.";
  if (temp > 30) return "Temps are critical. Management mode required. Stay hydrated.";
  if (temp < 5)  return "Track temps are very low. Watch out for cold grip.";
  
  // DEFAULT RANDOM MESSAGES
  const defaults = [
    "Radio check. Loud and clear.",
    "Gap to the weekend is closing. Stay focused.",
    "Head down. Long stint ahead.",
    "Battery is fully charged. Ready to deploy."
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
};

export default function RaceEngineer({ mode, weather }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
        hasMounted.current = true;
        return;
    }
    if (!weather) return;
    
    // 1. Get Text Message
    const msg = getRadioMessage(mode, weather);
    setMessage(msg);
    setVisible(true);

    // 2. Play ONLY the Intro Sound
    playBroadcastIntro();

    // 3. Hide after 5 seconds
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [mode, weather]);

  if (!visible) return null;

  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-500 pointer-events-none">
      <div className="bg-black/90 border-l-4 border-[#00d2be] rounded-r-md p-4 w-96 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a9 9 0 0 0-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7a9 9 0 0 0-9-9z"/></svg>
                </div>
                <div>
                    <h3 className="text-xs font-bold text-[#00d2be] uppercase tracking-widest leading-none">Team Radio</h3>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">P. Bonnington</h2>
                </div>
            </div>
            
            {/* LIVE ANIMATION (Kept visual interest) */}
            <div className="flex items-end gap-1 h-4">
                <div className="w-1 bg-[#00d2be] animate-[bounce_0.5s_infinite] h-full"></div>
                <div className="w-1 bg-[#00d2be] animate-[bounce_0.7s_infinite] h-2/3"></div>
                <div className="w-1 bg-[#00d2be] animate-[bounce_0.4s_infinite] h-full"></div>
            </div>
        </div>

        {/* MESSAGE TEXT */}
        <p className="text-white font-mono text-sm leading-relaxed">
            "{message}"
        </p>
      </div>
    </div>
  );
}