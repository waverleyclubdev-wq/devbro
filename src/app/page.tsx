"use client";
import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/utils/trpc';
import { motion, AnimatePresence } from 'framer-motion';

// --- SMARTER EXPLODING TEXT ---
const ExplodingText = ({ text }: { text: string }) => {
  const words = text.split(" ");
  return (
    <div className="text-emerald-300/80 leading-relaxed flex flex-wrap gap-x-2 gap-y-1">
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="whitespace-nowrap inline-block">
          {word.split("").map((char, charIndex) => (
            <motion.span
              key={`${wordIndex}-${charIndex}`}
              initial={{ opacity: 0, x: (Math.random() - 0.5) * 500, y: (Math.random() - 0.5) * 500, rotate: Math.random() * 360, scale: 0 }}
              animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 30, duration: 0.5, delay: (wordIndex * 5 + charIndex) * 0.005 }}
              className="inline-block"
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </div>
  );
};

// MANUAL CONTENT
const MANUAL_PAGES = [
  { title: "01 // THE STACK", content: "You are looking at a Next.js frontend powered by a RUST physics engine. I compiled Rust code into WebAssembly (Wasm) to run native-speed calculations inside your browser.", icon: "⚙️" },
  { title: "02 // THE FLEX", content: "Why Rust? Open the console (~) and type 'galaxy'. That triggers an N-Body Gravity Simulation (250k calculations/frame). Or type 'entangle' to force 500 particles to find partners and lock into quantum binary orbits.", icon: "🌌" },
  { title: "03 // DISTRIBUTED COMPUTING", content: "I am using your GPU and CPU to render this. It saves me server costs and warms up your room. You're welcome.", icon: "🔥" },
  { title: "04 // COMMANDS", content: "Press '~' (Tilde) to open the terminal. Try: 'galaxy', 'entangle', 'normal', 'overclock', or 'rm -rf /'.", icon: "💀" }
];

export default function Home() {
  const { data } = trpc.getProfile.useQuery();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [fps, setFps] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState("0 KB");
  const [isTerminalOpen, setTerminalOpen] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<string[]>(["DEVBRO KERNEL [v1.0.5]", "Type 'help' for commands.", ""]);
  const [inputVal, setInputVal] = useState("");
  const terminalInputRef = useRef<HTMLInputElement>(null);
  
  // MANUAL STATES
  const [isManualOpen, setManualOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Engine Refs
  const engineRef = useRef<any>(null);
  const [isGalaxyMode, setIsGalaxyMode] = useState(false);
  const [isEntangleMode, setIsEntangleMode] = useState(false);
  const [isOverclocked, setIsOverclocked] = useState(false);
  const [isMatrixMode, setIsMatrixMode] = useState(false);
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

        const particleCount = 500;
        const engine = wasmModule.Engine.new(window.innerWidth, window.innerHeight, particleCount);
        engineRef.current = engine;

        const ctx = canvasRef.current?.getContext('2d');
        const handleMouseMove = (e: MouseEvent) => engine.update_mouse(e.clientX, e.clientY);
        window.addEventListener('mousemove', handleMouseMove);

        let lastFrameTime = performance.now();
        let frameCount = 0;

        const render = () => {
          if (isDestructing) return;
          const iterations = isOverclocked ? 5 : 1;
          let ptr;
          for(let i=0; i<iterations; i++) ptr = engine.tick();
          
          const particles = new Float64Array(wasmInstance.memory.buffer, ptr, particleCount * 5);

          if (ctx) {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            ctx.lineWidth = 0.5;

            // RENDER LOOP
            for (let i = 0; i < particles.length; i += 5) {
              const x = particles[i];
              const y = particles[i + 1];
              const vx = particles[i + 2];
              const vy = particles[i + 3];

              // Styling Logic
              if (isEntangleMode) {
                 // ENTANGLE: Hot Pink / Cyan
                 ctx.fillStyle = '#FF00FF'; 
                 ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
              } else if (isGalaxyMode) {
                 const speed = Math.sqrt(vx*vx + vy*vy);
                 ctx.fillStyle = `rgba(${100 + speed*50}, 100, 255, 0.8)`;
                 ctx.strokeStyle = 'rgba(100, 100, 255, 0.2)';
              } else if (isMatrixMode) {
                  ctx.fillStyle = '#00FF41'; 
                  ctx.strokeStyle = 'rgba(0, 255, 65, 0.2)';
              } else if (isOverclocked) {
                 ctx.fillStyle = '#EF4444'; ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
              } else {
                 ctx.fillStyle = '#10B981'; ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
              }

              ctx.beginPath();
              
              // --- THE BOND LINES (This is what you were missing) ---
              // If in Entangle Mode, draw a line between Particle A and Particle B
              if (isEntangleMode && (i/5) % 2 === 0 && i + 5 < particles.length) {
                  const bx = particles[i+5];
                  const by = particles[i+6];
                  
                  // Calculate Distance
                  const dx = x - bx;
                  const dy = y - by;
                  const dist = Math.sqrt(dx*dx + dy*dy);

                  // Safety Check: Only draw if they are close (hides glitches)
                  if (dist < 100) {
                      ctx.moveTo(x, y);
                      ctx.lineTo(bx, by);
                      ctx.stroke();
                  }
              }

              // Draw the Particle Shape
              if (isMatrixMode) {
                ctx.rect(x, y, 3, 8);
              } else {
                ctx.arc(x, y, isOverclocked ? 2 : 1.5, 0, Math.PI * 2);
              }
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
  }, [isOverclocked, isGalaxyMode, isEntangleMode, isMatrixMode, isDestructing]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim().toLowerCase();
    const newHistory = [...terminalHistory, `root@devbro:~$ ${inputVal}`];
    if (!engineRef.current) return;

    // Helper to clear states
    const resetModes = () => { setIsGalaxyMode(false); setIsEntangleMode(false); setIsOverclocked(false); setIsMatrixMode(false); };

    switch (cmd) {
      case 'help': newHistory.push("COMMANDS: galaxy, entangle, matrix, normal, overclock, rm -rf /"); break;
      case 'galaxy': 
        resetModes(); engineRef.current.set_mode(1); setIsGalaxyMode(true); 
        newHistory.push(">> INITIALIZING N-BODY GALAXY..."); break;
      case 'entangle': 
        resetModes(); engineRef.current.set_mode(2); setIsEntangleMode(true); 
        newHistory.push(">> QUANTUM PAIRING INITIATED..."); 
        newHistory.push(">> ESTABLISHING BINARY ORBITS."); break;
      case 'matrix':
        resetModes(); engineRef.current.set_mode(1); 
        setIsMatrixMode(true);
        newHistory.push(">> WAKE UP, NEO."); break;
      case 'normal': 
        resetModes(); engineRef.current.set_mode(0); 
        newHistory.push(">> PHYSICS NORMALIZED."); break;
      case 'overclock': 
        resetModes(); setIsOverclocked(true); engineRef.current.set_mode(0); 
        newHistory.push(">> CLOCK SPEED INCREASED."); break;
      case 'rm -rf /': setIsDestructing(true); setTimeout(() => window.location.reload(), 3000); break;
      case 'clear': setTerminalHistory([]); setInputVal(""); return;
      default: newHistory.push(`Unknown command: ${cmd}`);
    }
    setTerminalHistory(newHistory); setInputVal("");
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
      <div className={`fixed top-0 left-0 w-full bg-neutral-900/95 border-b-2 ${isGalaxyMode ? "border-violet-500" : isEntangleMode ? "border-pink-500" : isMatrixMode ? "border-green-500" : "border-emerald-500"} z-50 transition-all duration-300 ease-out shadow-2xl ${isTerminalOpen ? 'h-[50vh]' : 'h-0 overflow-hidden'}`}>
        <div id="terminal-body" className="h-full p-6 overflow-y-auto font-mono text-sm">
            {terminalHistory.map((line, i) => <div key={i} className={`${isGalaxyMode ? "text-violet-400" : isEntangleMode ? "text-pink-400" : isMatrixMode ? "text-green-500" : "text-emerald-500/80"} mb-1`}>{line}</div>)}
            <form onSubmit={handleCommand} className="flex gap-2 mt-2">
                <span className={`${isGalaxyMode ? "text-violet-400" : isEntangleMode ? "text-pink-400" : isMatrixMode ? "text-green-500" : "text-emerald-400"} font-bold`}>root@devbro:~$</span>
                <input ref={terminalInputRef} type="text" value={inputVal} onChange={(e) => setInputVal(e.target.value)} className={`bg-transparent outline-none flex-1 ${isGalaxyMode ? "text-violet-300" : isEntangleMode ? "text-pink-300" : isMatrixMode ? "text-green-500" : "text-emerald-300"}`} autoFocus />
            </form>
        </div>
      </div>

      {/* MANUAL MODAL */}
      <AnimatePresence>
        {isManualOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className={`relative w-full max-w-3xl bg-black/90 border ${isGalaxyMode ? "border-violet-500" : isEntangleMode ? "border-pink-500" : isMatrixMode ? "border-green-500" : "border-emerald-500"} rounded-lg shadow-2xl overflow-hidden`}>
                  <div className={`bg-opacity-20 border-b p-4 flex justify-between items-center ${isGalaxyMode ? "bg-violet-900 border-violet-500/50" : isEntangleMode ? "bg-pink-900 border-pink-500/50" : isMatrixMode ? "bg-green-900 border-green-500/50" : "bg-emerald-900 border-emerald-500/50"}`}>
                      <span className={`${isGalaxyMode ? "text-violet-400" : isEntangleMode ? "text-pink-400" : isMatrixMode ? "text-green-400" : "text-emerald-400"} font-bold tracking-widest text-xs`}>[ SYSTEM_MANUAL.md ]</span>
                      <button onClick={() => setManualOpen(false)} className="text-white hover:opacity-70">✕</button>
                  </div>
                  <div className="p-8 min-h-[350px] flex flex-col justify-between">
                      <div>
                          <motion.div key={`icon-${currentPage}`} initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-5xl mb-6">{MANUAL_PAGES[currentPage].icon}</motion.div>
                          <motion.h2 key={`title-${currentPage}`} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-2xl font-bold text-white mb-6">{MANUAL_PAGES[currentPage].title}</motion.h2>
                          <div key={`content-${currentPage}`}><ExplodingText text={MANUAL_PAGES[currentPage].content} /></div>
                      </div>
                      <div className={`flex justify-between items-center mt-8 pt-4 border-t ${isGalaxyMode ? "border-violet-500/20" : isEntangleMode ? "border-pink-500/20" : isMatrixMode ? "border-green-500/20" : "border-emerald-500/20"}`}>
                          <button onClick={() => changePage(-1)} className={`px-6 py-2 text-xs border rounded transition-colors ${isGalaxyMode ? "border-violet-500/30 text-violet-500" : isEntangleMode ? "border-pink-500/30 text-pink-500" : isMatrixMode ? "border-green-500/30 text-green-500" : "border-emerald-500/30 text-emerald-500"}`}>&lt; PREV</button>
                          <div className="flex gap-2">{MANUAL_PAGES.map((_, i) => (<div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === currentPage ? (isGalaxyMode ? 'bg-violet-500' : isEntangleMode ? 'bg-pink-500' : isMatrixMode ? 'bg-green-500' : 'bg-emerald-500') : 'bg-neutral-800'}`} />))}</div>
                          <button onClick={() => changePage(1)} className={`px-6 py-2 text-xs border rounded transition-colors ${isGalaxyMode ? "border-violet-500/30 text-violet-500" : isEntangleMode ? "border-pink-500/30 text-pink-500" : isMatrixMode ? "border-green-500/30 text-green-500" : "border-emerald-500/30 text-emerald-500"}`}>NEXT &gt;</button>
                      </div>
                  </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD */}
      <div className={`absolute top-6 right-6 z-20 hidden md:block transition-opacity duration-300 ${isTerminalOpen ? 'opacity-0' : 'opacity-100'}`}>
        <div className={`backdrop-blur-md border p-4 rounded-lg text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)] ${isOverclocked ? "bg-red-900/20 border-red-500/30" : isGalaxyMode ? "bg-black/80 border-violet-500/30" : isEntangleMode ? "bg-black/80 border-pink-500/30" : isMatrixMode ? "bg-black/80 border-green-500/30" : "bg-black/80 border-emerald-500/30"}`}>
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isOverclocked ? "bg-red-500" : isGalaxyMode ? "bg-violet-500" : isEntangleMode ? "bg-pink-500" : isMatrixMode ? "bg-green-500" : "bg-emerald-500"}`} />
            <span className={`font-bold tracking-widest ${isOverclocked ? "text-red-400" : isGalaxyMode ? "text-violet-400" : isEntangleMode ? "text-pink-400" : isMatrixMode ? "text-green-400" : "text-emerald-400"}`}>SYSTEM MONITOR</span>
          </div> 
          <div className="space-y-1 font-mono text-white/80">
            <div className="flex justify-between gap-8"><span>FPS:</span> <span className="text-white">{fps}</span></div>
            <div className="flex justify-between gap-8"><span>RAM:</span> <span className="text-white">{memoryUsage}</span></div>
            <div className="flex justify-between gap-8"><span>MODE:</span> <span className={`${isGalaxyMode ? "text-violet-400" : isEntangleMode ? "text-pink-400" : isMatrixMode ? "text-green-400" : "text-emerald-400"}`}>{isGalaxyMode ? "N-BODY SIM" : isEntangleMode ? "QUANTUM PAIRS" : isMatrixMode ? "MATRIX RAIN" : "STANDARD"}</span></div>
            <div className="pt-2 mt-2 border-t border-white/10 text-center">
                <button onClick={() => setManualOpen(true)} className={`w-full py-1 border rounded uppercase text-[10px] tracking-widest ${isGalaxyMode ? "border-violet-500/50 text-violet-400 hover:bg-violet-500/10" : isEntangleMode ? "border-pink-500/50 text-pink-400 hover:bg-pink-500/10" : isMatrixMode ? "border-green-500/50 text-green-400 hover:bg-green-500/10" : "border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"}`}>[ READ_ME.md ]</button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500">{data?.headline || "Loading..."}</h1>
        <p className="text-lg md:text-xl text-neutral-400 max-w-xl mx-auto mb-10 leading-relaxed">{data?.tagline}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
          {data?.stack.map((item, i) => <div key={i} className="px-4 py-3 bg-white/5 border border-white/5 rounded-md text-sm text-neutral-300"><span className="text-emerald-500 mr-2">$</span> {item}</div>)}
        </div>
        <button onClick={() => setManualOpen(true)} className="mt-8 md:hidden px-6 py-2 border border-emerald-500 text-emerald-500 rounded uppercase text-xs tracking-widest">OPEN SYSTEM MANUAL</button>
      </div>
      
      <div className="absolute bottom-6 w-full text-center text-neutral-600 text-[10px] uppercase tracking-widest">SORRY ABOUT THE FAN NOISE 🚁 • [ DEVBRO ]</div>
    </main>
  );
}