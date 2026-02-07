"use client";
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import emailjs from '@emailjs/browser';

// --- CONFIGURATION (Clean & Secure) ---
const EMAIL_SERVICE_ID = process.env.NEXT_PUBLIC_EMAIL_SERVICE_ID!;
const EMAIL_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAIL_TEMPLATE_ID!;
const EMAIL_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAIL_PUBLIC_KEY!;

// --- PROFANITY FILTER LIST ---
const BAD_WORDS = ["shit", "fuck", "damn", "bitch", "crap", "piss", "dick", "darn", "cock", "pussy", "ass", "asshole", "fag", "bastard", "slut", "douche", "wanker", "bullshit"];

// --- TYPES ---
type TerminalMode = 'SHELL' | 'EMAIL_FROM' | 'EMAIL_COMPOSE';

// --- MANUAL CONTENT ---
const MANUAL_PAGES = [
  { 
    title: "01 // THE STACK", 
    content: "Next.js frontend powered by RUST. Compiled into Wasm. Runs native-speed calculations in your browser.", 
    icon: "⚙️" 
  },
  { 
    title: "02 // HIGH DENSITY", 
    content: "Particles count = 7,000. JavaScript chokes around 500. RUST eats this for breakfast.", 
    icon: "🌌" 
  },
  { 
    title: "03 // DISTRIBUTED COMPUTING", 
    content: "Using your GPU / CPU to render because it saves me server costs, and warms up your lap. You're welcome.", 
    icon: "🔥" 
  },
  { 
    title: "04 // PING", 
    content: "Need something coded?. Send a transmission via the terminal. (Press '~' or tap the [ >_ ] button).",
    icon: "📡" 
  }
];

// --- HELPER FUNCTIONS ---
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const filterProfanity = (text: string) => {
  let clean = text;
  BAD_WORDS.forEach(word => {
     const regex = new RegExp(`\\b${word}\\b`, 'gi');
     clean = clean.replace(regex, "🤬");
  });
  return clean;
};

// Helper to generate retro progress bar string
const getProgressBar = (percent: number) => {
    const width = 20; // Total width of bar in characters
    const filledCount = Math.round((percent / 100) * width);
    const emptyCount = width - filledCount;
    // Using block characters for retro feel
    const bar = '█'.repeat(filledCount) + '░'.repeat(emptyCount);
    // Pad percentage to ensure stable width (e.g. " 5%" vs "100%")
    const percentStr = percent.toString().padStart(3, ' ');
    return `>> ${bar} ${percentStr}%`;
};

// --- EXPLODING TEXT COMPONENT ---
const ExplodingText = ({ text }: { text: string }) => {
  const words = text.split(" ");
  return (
    <p className="text-emerald-300/80 leading-relaxed flex flex-wrap gap-x-1.5 gap-y-1">
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="whitespace-nowrap flex">
          {word.split("").map((char, charIndex) => (
            <motion.span
              key={`${wordIndex}-${charIndex}`}
              initial={{ opacity: 0, x: (Math.random() - 0.5) * 500, y: (Math.random() - 0.5) * 500, rotate: Math.random() * 360, scale: 0 }}
              animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 30, duration: 0.5, delay: (wordIndex * 5 + charIndex) * 0.01 }}
              className="relative inline-block"
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </p>
  );
};

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [fps, setFps] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState("0 KB");
  
  // TERMINAL STATE
  const [isTerminalOpen, setTerminalOpen] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<string[]>(["DEVBRO KERNEL [v1.0.5]", "Type 'help' for commands.", ""]);
  const [inputVal, setInputVal] = useState("");
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const [terminalMode, setTerminalMode] = useState<TerminalMode>('SHELL');
  
  // EMAIL STATE
  const [emailDraft, setEmailDraft] = useState({ from: '', body: '' });
  const [isTransmitting, setIsTransmitting] = useState(false);
  
  // UI STATE
  const [isManualOpen, setManualOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  // ENGINE STATE
  const engineRef = useRef<any>(null);
  const [isOverclocked, setIsOverclocked] = useState(false);
  const [isDestructing, setIsDestructing] = useState(false);

  const changePage = (dir: number) => {
    let newPage = currentPage + dir;
    if (newPage < 0) newPage = MANUAL_PAGES.length - 1;
    if (newPage >= MANUAL_PAGES.length) newPage = 0;
    setCurrentPage(newPage);
  };

  useEffect(() => {
    async function startEngine() {
      try {
        const wasmModule = await import('particle-sim');
        const wasmInstance: any = await wasmModule.default();
        const particleCount = 7000; 
        const engine = wasmModule.Engine.new(window.innerWidth, window.innerHeight, particleCount);
        engineRef.current = engine;
        const ctx = canvasRef.current?.getContext('2d');
        const handleMouseMove = (e: MouseEvent) => engine.update_mouse(e.clientX, e.clientY);
        window.addEventListener('mousemove', handleMouseMove);

        let lastFrameTime = performance.now();
        let frameCount = 0;

        const render = () => {
          if (isDestructing) return;
          const iterations = isOverclocked ? 3 : 1;
          let ptr;
          for(let i=0; i<iterations; i++) ptr = engine.tick();
          
          const particles = new Float64Array(wasmInstance.memory.buffer, ptr, particleCount * 5);
          if (ctx) {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            for (let i = 0; i < particles.length; i += 5) {
              const x = particles[i];
              const y = particles[i + 1];
              if (isOverclocked) ctx.fillStyle = '#EF4444'; 
              else ctx.fillStyle = '#10B981'; 
              ctx.beginPath();
              ctx.rect(x, y, 1.5, 1.5); 
              ctx.fill();
            }
          }
          frameCount++;
          const now = performance.now();
          if (frameCount >= 30) {
            const delta = now - lastFrameTime;
            setFps(Math.round((1000 / (delta / frameCount))));
            setMemoryUsage(`${(wasmInstance.memory.buffer.byteLength / 1024).toFixed(0)} KB`);
            lastFrameTime = now;
            frameCount = 0;
          }
          requestAnimationFrame(render);
        };
        render();
        return () => window.removeEventListener('mousemove', handleMouseMove);
      } catch (e) { console.error("Wasm Error:", e); }
    }
    startEngine();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        setTerminalOpen(prev => !prev);
        setTimeout(() => terminalInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setManualOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOverclocked, isDestructing]);

  // --- THE 15s MODEM SEQUENCE ---
  const startTransmission = async () => {
      setIsTransmitting(true);
      let transmissionSuccess = false;
      
      try {
        const audio = new Audio('/modem.mp3');
        audio.volume = 0.5;
        audio.play();
      } catch (e) { console.log("Audio blocked"); }

      // Helper to auto-scroll terminal
      const scrollTerminal = () => {
         setTimeout(() => { const body = document.getElementById('terminal-body'); if(body) body.scrollTop = body.scrollHeight; }, 10);
      };

      // Helper to add a new line
      const addLog = (text: string) => {
          setTerminalHistory(prev => [...prev, text]);
          scrollTerminal();
      };

       // Helper to update the very last line (for progress bar animation)
       const updateLastLog = (text: string) => {
        setTerminalHistory(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1] = text;
            return newHistory;
        });
        scrollTerminal();
    };

      // --- Timeline Sequence ---
      addLog(">> DIALING");
      setTimeout(() => addLog(">> CONNECTING..."), 2500); 
      setTimeout(() => addLog(">> HANDSHAKE: ACK_RECEIVED"), 14500);       
      setTimeout(() => addLog(">> UPLOADING PACKET..."), 15000);

      // Send email in background immediately
      emailjs.send( EMAIL_SERVICE_ID, EMAIL_TEMPLATE_ID, { user_email: emailDraft.from, message: emailDraft.body, }, EMAIL_PUBLIC_KEY )
        .then(() => { transmissionSuccess = true; })
        .catch((error) => { console.error(error); transmissionSuccess = false; });


      // --- Progress Bar Animation Sequence (starts at 16s) ---
      setTimeout(() => {
        let percent = 0;
        // Add initial empty bar line
        addLog(getProgressBar(0));

        const interval = setInterval(() => {
            percent += 2; // Increment speed
            if (percent >= 100) {
                percent = 100;
                clearInterval(interval);
                // Ensure final state is set
                updateLastLog(getProgressBar(100));

                // Show final result based on the flag
                setTimeout(() => {
                        if(transmissionSuccess) addLog(">> TRANSMISSION SENT :)");
                        else { addLog(">> ERROR: CARRIER LOST"); addLog(">> CHECK CONFIGURATION"); }
                }, 500);

            } else {
                // Update existing bar line
                updateLastLog(getProgressBar(percent));
            }
        }, 50); // Update frequency (50ms * 50 steps = 2.5s duration)
    }, 16000);

      // --- Reset Terminal (at 23s) ---
      setTimeout(() => {
          setTerminalMode('SHELL');
          setEmailDraft({ from: '', body: '' });
          setIsTransmitting(false);
          // setTerminalHistory(prev => [...prev, "", "root@devbro:~$ _"]);
      }, 23000);
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputVal.trim();
    
    // 1. SHELL MODE
    if (terminalMode === 'SHELL') {
        const newHistory = [...terminalHistory, `root@devbro:~$ ${val}`];
        const cmd = val.toLowerCase();
        switch (cmd) {
           case 'help': newHistory.push("COMMANDS: sendmail"); break;
            // case 'help': newHistory.push("COMMANDS: sendmail, overclock, normal, clear, rm -rf /"); break;
            // case 'normal': setIsOverclocked(false); newHistory.push(">> SYSTEMS NORMALIZED."); break;
            // case 'overclock': setIsOverclocked(true); newHistory.push(">> CLOCK SPEED INCREASED."); break;
            // case 'clear': setTerminalHistory([]); setInputVal(""); return;
            case 'sendmail': 
                setTerminalMode('EMAIL_FROM');
                newHistory.push(">> LAUNCHING MAIL PROTOCOL v1.0");
                newHistory.push(">> ENTER YOUR EMAIL (FOR REPLY):");
                break;
            case 'rm -rf /': setIsDestructing(true); setTimeout(() => window.location.reload(), 3000); break;
            default: if(val) newHistory.push(`Unknown command: ${cmd}`);
        }
        setTerminalHistory(newHistory);
        setInputVal("");
    } 
    // 2. EMAIL VALIDATION STEP
    else if (terminalMode === 'EMAIL_FROM') {
        const history = [...terminalHistory, `${val}`];
        
        if (!isValidEmail(val)) {
             history.push(">> ERROR: INVALID_EMAIL_FORMAT. RETRY:");
             setTerminalHistory(history);
             setInputVal("");
        } else {
             history.push(">> ADDRESS VERIFIED.");
             setTerminalHistory(history);
             setEmailDraft(prev => ({ ...prev, from: val }));
             setTerminalMode('EMAIL_COMPOSE');
             setInputVal("");
        }
    }

    setTimeout(() => { const body = document.getElementById('terminal-body'); if(body) body.scrollTop = body.scrollHeight; }, 10);
  };

  if (isDestructing) return <div className="h-screen w-full bg-blue-900 text-white font-mono flex items-center justify-center flex-col p-10"><h1 className="text-4xl mb-4">:(</h1><p>CRITICAL_PROCESS_DIED</p></div>;

  return (
    <main className={`relative min-h-screen bg-black text-white overflow-hidden font-mono selection:bg-emerald-500 selection:text-black ${isOverclocked ? "shake-screen" : ""}`}>
      <style jsx global>{`
        .shake-screen { animation: shake 0.5s infinite; }
        @keyframes shake { 0% { transform: translate(1px, 1px); } 50% { transform: translate(-1px, 2px); } 100% { transform: translate(1px, -2px); } }
      `}</style>

      <canvas ref={canvasRef} width={1920} height={1080} className="absolute inset-0 z-0 opacity-40 pointer-events-none" />

      {/* TERMINAL */}
      <div className={`fixed top-0 left-0 w-full bg-neutral-900/95 border-b-2 border-emerald-500 z-50 transition-all duration-300 ease-out shadow-2xl ${isTerminalOpen ? 'h-[60vh]' : 'h-0 overflow-hidden'}`}>
        <div id="terminal-body" className="h-full p-6 overflow-y-auto font-mono text-sm relative">
            
            {/* HISTORY LOGS */}
            {terminalHistory.map((line, i) => (
                <div key={i} className={`${line.startsWith(">>") ? "text-emerald-500" : isOverclocked ? "text-red-400" : "text-emerald-300/80"} mb-1 whitespace-pre-wrap`}>
                    {line}
                </div>
            ))}

            {/* COMPOSE MESSAGE BOX (With Profanity Filter) */}
            {terminalMode === 'EMAIL_COMPOSE' && !isTransmitting && (
                <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="border border-emerald-500/50 p-2 bg-emerald-900/10 relative group hover:border-emerald-400 transition-colors">
                        <div className="absolute -top-3 left-4 bg-[#0a0a0a] px-2 text-[10px] text-emerald-500 font-bold tracking-widest border border-emerald-500/50">
                            MESSAGE_BUFFER.TXT
                        </div>
                        <textarea
                            autoFocus
                            value={emailDraft.body}
                            onChange={(e) => {
                                const cleanText = filterProfanity(e.target.value);
                                setEmailDraft(prev => ({ ...prev, body: cleanText }));
                            }}
                            className="w-full h-32 bg-transparent text-emerald-300 font-mono outline-none resize-none placeholder-emerald-800/50 p-2"
                            placeholder="> TYPE YOUR ENCRYPTED MESSAGE HERE..."
                        />
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                        <button 
                            onClick={startTransmission}
                            disabled={!emailDraft.body.trim()}
                            className="group relative px-6 py-2 bg-emerald-900/50 border border-emerald-500 text-emerald-400 font-bold tracking-widest hover:bg-emerald-500 hover:text-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            [ INITIATE_UPLINK ]
                            <div className="absolute inset-0 border border-emerald-500 blur-[2px] opacity-50 group-hover:opacity-100" />
                        </button>
                    </div>
                </div>
            )}

            {/* SINGLE LINE INPUT (Hidden during compose/transmit) */}
            {terminalMode !== 'EMAIL_COMPOSE' && !isTransmitting && (
                <form onSubmit={handleCommand} className="flex gap-2 mt-2">
                    <span className="text-emerald-400 font-bold">
                        {terminalMode === 'SHELL' ? 'root@devbro:~$' : 'FROM:'}
                    </span>
                    <input 
                        ref={terminalInputRef} 
                        type="text" 
                        value={inputVal} 
                        onChange={(e) => setInputVal(e.target.value)} 
                        className="bg-transparent outline-none flex-1 text-emerald-300 placeholder-emerald-800" 
                        autoFocus 
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck="false"
                        placeholder={terminalMode === 'EMAIL_FROM' ? 'user@example.com' : ''}
                    />
                </form>
            )}
        </div>
      </div>

      {/* MANUAL MODAL */}
      <AnimatePresence>
        {isManualOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="relative w-full max-w-lg bg-black/90 border border-emerald-500 rounded-lg shadow-2xl overflow-hidden">
                  <div className="bg-emerald-900 bg-opacity-20 border-b border-emerald-500/50 p-4 flex justify-between items-center">
                      <span className="text-emerald-400 font-bold tracking-widest text-xs">[ READ_ME_MD ]</span>
                      <button onClick={() => setManualOpen(false)} className="text-white">✕</button>
                  </div>
                  <div className="p-8 min-h-[300px] flex flex-col justify-between">
                      <div>
                          <motion.div key={`icon-${currentPage}`} initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-4xl mb-4">{MANUAL_PAGES[currentPage].icon}</motion.div>
                          <motion.h2 key={`title-${currentPage}`} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-xl font-bold text-white mb-4">{MANUAL_PAGES[currentPage].title}</motion.h2>
                          <div key={`content-${currentPage}`}><ExplodingText text={MANUAL_PAGES[currentPage].content} /></div>
                      </div>
                      <div className="flex justify-between items-center mt-8 pt-4 border-t border-emerald-500/20">
                          <button onClick={() => changePage(-1)} className="px-4 py-2 text-xs border border-emerald-500/30 text-emerald-500 rounded">&lt; PREV</button>
                          <button onClick={() => changePage(1)} className="px-4 py-2 text-xs border border-emerald-500/30 text-emerald-500 rounded">NEXT &gt;</button>
                      </div>
                  </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD */}
      <div className={`absolute top-6 right-6 z-20 hidden md:block transition-opacity duration-300 ${isTerminalOpen ? 'opacity-0' : 'opacity-100'}`}>
        <div className={`backdrop-blur-md border p-4 rounded-lg text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)] ${isOverclocked ? "bg-red-900/20 border-red-500/30" : "bg-black/80 border-emerald-500/30"}`}>
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isOverclocked ? "bg-red-500" : "bg-emerald-500"}`} />
            <span className={`font-bold tracking-widest ${isOverclocked ? "text-red-400" : "text-emerald-400"}`}>SYSTEM MONITOR</span>
          </div> 
          <div className="space-y-1 font-mono text-white/80">
            <div className="flex justify-between gap-8"><span>FPS:</span> <span className="text-white">{fps}</span></div>
            <div className="flex justify-between gap-8"><span>RAM:</span> <span className="text-white">{memoryUsage}</span></div>
            <div className="flex justify-between gap-8"><span>PARTICLES:</span> <span className="text-emerald-400">7,000</span></div>
            <div className="pt-2 mt-2 border-t border-white/10 text-center">
                <button onClick={() => setManualOpen(true)} className="w-full py-1 border border-emerald-500/50 rounded uppercase text-[10px] tracking-widest text-emerald-400 hover:bg-emerald-500/10">[ READ_ME.md ]</button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        
        {/* NORMAL HEADLINE (NO MIRROR) */}
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500">
            I write Code.
        </h1>
        
        {/* FUNKY MAGICAL SUBTITLE */}
        <motion.p 
          animate={{ 
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          style={{ backgroundSize: "200% auto" }}
          className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 drop-shadow-[0_0_5px_rgba(232,121,249,0.5)] max-w-xl mx-auto mb-10 italic tracking-wide"
        >
            on weekends.. ✨
        </motion.p>       

        <button onClick={() => setManualOpen(true)} className="mt-8 md:hidden px-6 py-2 border border-emerald-500 text-emerald-500 rounded uppercase text-xs tracking-widest">OPEN SYSTEM MANUAL</button>

        {/* MOBILE TERMINAL TOGGLE (CENTERED UNDERNEATH MANUAL BUTTON) */}
        <button 
          onClick={() => {
            setTerminalOpen(prev => !prev);
            setTimeout(() => terminalInputRef.current?.focus(), 100);
          }}
          className="mt-4 md:hidden px-3 py-2 bg-black/50 border border-emerald-500/50 text-emerald-500/80 rounded uppercase text-xs tracking-widest hover:bg-emerald-500 hover:text-black transition-colors"
        >
          {isTerminalOpen ? "[ X_ ]" : "[ >_ ]"}
        </button>
      </div>
      
      <div className="absolute bottom-6 w-full text-center text-neutral-600 text-[10px] uppercase tracking-widest pointer-events-none">HAVE A GOOD ONE • [ DEVBRO ]</div>
    </main>
  );
}


