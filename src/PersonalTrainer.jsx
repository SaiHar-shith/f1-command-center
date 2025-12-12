import { useState, useEffect, useRef } from 'react';

// --- THE "BRAIN" (Procedural Logic) ---
const VOCABULARY = {
  intros: [
    "Copy that.", "Affirmative.", "Received.", "Logging entry.", 
    "Analyzing telemetry.", "Listening.", "Parameters set."
  ],
  workouts: {
    push: ["Focus: Incline Bench Press (4x8) and Weighted Dips.", "Protocol: Overhead Press followed by Lateral Raises.", "Mission: Cable Flyes and Tricep Extensions."],
    pull: ["Focus: Heavy Deadlifts (3x5).", "Protocol: Weighted Pull-ups to failure.", "Mission: Barbell Rows and Face Pulls."],
    legs: ["Focus: Low-bar Squats (4x6).", "Protocol: Romanian Deadlifts and Lunges.", "Mission: High volume Leg Press."],
    cardio: ["Zone 2 Running for 45 mins.", "HIIT Sprints: 30s ON, 30s OFF.", "Ruck march with 20kg load."],
    core: ["Hanging Leg Raises: 4x15.", "Plank: 3 sets to failure.", "Ab Wheel Rollouts."]
  },
  diet: [
    "Fuel Recommendation: Lean Chicken Breast and Rice.", 
    "Hydration Critical: Drink 500ml water immediately.", 
    "Recovery: Salmon, Sweet Potato, and Greens.", 
    "Breakfast: Oats, Whey Protein, and Berries."
  ],
  motivation: [
    "Discipline equals freedom.", "Light weight, baby.", "Pain is weakness leaving the body.", 
    "Do not negotiate with yourself.", "Stay the course.", "Focus on the mission."
  ],
  outros: [
    "Execute.", "Get to work.", "Over and out.", "Stay hard.", "End transmission."
  ]
};

// --- LOGIC ENGINE ---
const generateResponse = (input, day) => {
  const lower = input.toLowerCase();
  
  // 1. Pick a random Intro
  const intro = VOCABULARY.intros[Math.floor(Math.random() * VOCABULARY.intros.length)];
  
  // 2. Determine Core Advice based on Keywords & Context
  let core = "";
  
  if (lower.includes("chest") || lower.includes("push") || lower.includes("bench")) core = getRandom(VOCABULARY.workouts.push);
  else if (lower.includes("back") || lower.includes("pull") || lower.includes("deadlift")) core = getRandom(VOCABULARY.workouts.pull);
  else if (lower.includes("leg") || lower.includes("squat")) core = getRandom(VOCABULARY.workouts.legs);
  else if (lower.includes("cardio") || lower.includes("run")) core = getRandom(VOCABULARY.workouts.cardio);
  else if (lower.includes("abs") || lower.includes("core")) core = getRandom(VOCABULARY.workouts.core);
  else if (lower.includes("diet") || lower.includes("eat") || lower.includes("food")) core = getRandom(VOCABULARY.diet);
  else if (lower.includes("workout") || lower.includes("plan")) {
     // Smart Context: Suggest workout based on the actual day
     if (day === 'Monday' || day === 'Thursday') core = getRandom(VOCABULARY.workouts.push);
     else if (day === 'Tuesday' || day === 'Friday') core = getRandom(VOCABULARY.workouts.pull);
     else core = getRandom(VOCABULARY.workouts.legs);
  }
  else if (lower.includes("tired") || lower.includes("skip") || lower.includes("sore")) {
    core = "Fatigue is a mental state. Modify intensity, but maintain consistency.";
  } else {
    core = "Awaiting specific parameters. State muscle group or dietary needs.";
  }

  // 3. Pick a random Outro
  const outro = VOCABULARY.outros[Math.floor(Math.random() * VOCABULARY.outros.length)];
  
  // 4. Randomly add motivation (40% chance)
  const motivation = Math.random() > 0.6 ? ` ${getRandom(VOCABULARY.motivation)}` : "";

  return `${intro} ${core}${motivation} ${outro}`;
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// --- COMPONENT ---
export default function PersonalTrainer({ visible }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    if (visible && messages.length === 0) {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      setMessages([{ 
        sender: 'AI', 
        text: `System Online. Today is ${today}. Awaiting mission parameters.` 
      }]);
    }
  }, [visible]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userText = input;
    setMessages(prev => [...prev, { sender: 'ME', text: userText }]);
    setInput("");
    setIsTyping(true);

    // Simulate Network Delay for realism
    setTimeout(() => {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const aiResponse = generateResponse(userText, today);
      
      setIsTyping(false);
      setMessages(prev => [...prev, { sender: 'AI', text: aiResponse }]);
    }, 800); 
  };

  if (!visible) return null;

  return (
    <div className="absolute bottom-24 right-8 w-80 z-50 animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      {/* GLASS CONTAINER */}
      <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[450px]">
        
        {/* HEADER */}
        <div className="bg-[#00d2be]/10 p-3 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-[#00d2be] flex items-center justify-center shadow-[0_0_10px_#00d2be]">
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
             </div>
             <div>
                <h3 className="text-xs font-bold text-[#00d2be] tracking-widest uppercase">TRAINER.AI</h3>
                <div className="text-[9px] text-gray-400 font-mono uppercase flex items-center gap-1">
                   <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Active
                </div>
             </div>
          </div>
        </div>

        {/* CHAT AREA */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
           {messages.map((msg, i) => (
             <div key={i} className={`flex ${msg.sender === 'ME' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs font-sans leading-relaxed whitespace-pre-line ${
                   msg.sender === 'ME' 
                   ? 'bg-white/10 text-white border border-white/5 rounded-br-none' 
                   : 'bg-[#00d2be]/10 text-[#00d2be] border border-[#00d2be]/20 rounded-bl-none'
                }`}>
                   {msg.text}
                </div>
             </div>
           ))}
           
           {/* TYPING INDICATOR */}
           {isTyping && (
             <div className="flex justify-start">
               <div className="bg-[#00d2be]/5 border border-[#00d2be]/10 rounded-2xl px-3 py-2 rounded-bl-none flex gap-1">
                 <div className="w-1 h-1 bg-[#00d2be] rounded-full animate-bounce"></div>
                 <div className="w-1 h-1 bg-[#00d2be] rounded-full animate-bounce delay-100"></div>
                 <div className="w-1 h-1 bg-[#00d2be] rounded-full animate-bounce delay-200"></div>
               </div>
             </div>
           )}
        </div>

        {/* INPUT AREA */}
        <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-black/50">
           <div className="relative">
             <input 
               type="text" 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Enter protocol (e.g. Chest, Diet)..." 
               className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-3 pr-10 text-xs text-white focus:outline-none focus:border-[#00d2be]/50 transition-colors placeholder:text-gray-600"
             />
             <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-[#00d2be] rounded-full flex items-center justify-center hover:bg-[#00a090] transition-colors">
                <svg className="w-3 h-3 text-black transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
             </button>
           </div>
        </form>

      </div>
    </div>
  );
}