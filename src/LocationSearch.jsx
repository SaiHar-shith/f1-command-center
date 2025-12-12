import { useState, useEffect } from 'react';

// --- PINNED F1 TRACKS (Now with Timezones) ---
const PINNED_TRACKS = [
  { id: 'home', name: "HANAMKONDA", country: "INDIA", lat: 18.02, lon: 79.54, type: 'HOME', timezone: "Asia/Kolkata" },
  { id: 'monaco', name: "MONACO", country: "MONACO", lat: 43.73, lon: 7.42, type: 'TRACK', timezone: "Europe/Monaco" },
  { id: 'silverstone', name: "SILVERSTONE", country: "UK", lat: 52.07, lon: -1.01, type: 'TRACK', timezone: "Europe/London" },
  { id: 'spa', name: "SPA-FRANCORCHAMPS", country: "BELGIUM", lat: 50.43, lon: 5.97, type: 'TRACK', timezone: "Europe/Brussels" },
  { id: 'suzuka', name: "SUZUKA", country: "JAPAN", lat: 34.84, lon: 136.54, type: 'TRACK', timezone: "Asia/Tokyo" },
  { id: 'austin', name: "AUSTIN", country: "USA", lat: 30.13, lon: -97.64, type: 'TRACK', timezone: "America/Chicago" },
];

export default function LocationSearch({ onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=en&format=json`);
        const data = await res.json();
        
        if (data.results) {
          const formatted = data.results.map(city => ({
            id: city.id,
            name: city.name.toUpperCase(),
            country: city.country_code ? city.country_code.toUpperCase() : "INTL",
            lat: city.latitude,
            lon: city.longitude,
            timezone: city.timezone, // <--- CRITICAL: Get the timezone
            type: 'CITY'
          }));
          setResults(formatted);
        }
      } catch (e) { console.error("Geocoding failed"); }
      setLoading(false);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <div className="absolute bottom-24 left-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      <div className="bg-black/90 border border-white/20 rounded-xl w-80 shadow-2xl overflow-hidden backdrop-blur-xl">
        
        {/* INPUT */}
        <div className="p-3 border-b border-white/10 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
                autoFocus
                type="text" 
                placeholder="SEARCH SECTOR..." 
                className="bg-transparent text-white font-mono text-sm uppercase w-full outline-none placeholder:text-gray-600"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            {loading && <div className="w-3 h-3 border-2 border-[#00d2be] border-t-transparent rounded-full animate-spin"></div>}
        </div>

        {/* RESULTS */}
        <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {query.length > 0 && results.map((item) => (
                <ResultItem key={item.id} item={item} onSelect={onSelect} />
            ))}

            {query.length === 0 && (
                <div>
                    <div className="px-3 py-2 text-[10px] font-bold text-[#00d2be] uppercase tracking-widest bg-white/5">
                        Pinned Circuits
                    </div>
                    {PINNED_TRACKS.map((item) => (
                        <ResultItem key={item.id} item={item} onSelect={onSelect} />
                    ))}
                </div>
            )}
            
            {query.length > 0 && results.length === 0 && !loading && (
                <div className="p-4 text-center text-xs text-gray-500 font-mono">NO SECTORS FOUND</div>
            )}
        </div>
        
        <button onClick={onClose} className="w-full py-2 bg-white/5 hover:bg-white/10 text-[10px] text-gray-400 uppercase tracking-widest border-t border-white/10 transition-colors">
            Close Scanner
        </button>

      </div>
    </div>
  );
}

function ResultItem({ item, onSelect }) {
  return (
    <div 
        onClick={() => onSelect(item)}
        className="px-4 py-3 hover:bg-[#00d2be]/20 cursor-pointer border-b border-white/5 transition-colors group flex justify-between items-center"
    >
        <div>
            <div className="text-white font-bold text-sm uppercase font-sans group-hover:text-[#00d2be]">
                {item.name}
            </div>
            <div className="text-[10px] text-gray-500 font-mono uppercase">
                {item.country} <span className="mx-1">//</span> {item.timezone}
            </div>
        </div>
        {item.type === 'TRACK' && <span className="text-xs">🏁</span>}
        {item.type === 'HOME' && <span className="text-xs">🏠</span>}
        {item.type === 'CITY' && <span className="text-xs opacity-50">🌍</span>}
    </div>
  );
}