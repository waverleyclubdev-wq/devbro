"use client";
import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/utils/trpc';
import { motion, AnimatePresence } from 'framer-motion';

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

// MANUAL CONTENT
const MANUAL_PAGES = [
  { title: "01 // THE STACK", content: "You are looking at a Next.js frontend powered by a RUST physics engine. I compiled Rust code into WebAssembly (Wasm) to run native-speed calculations inside your browser.", icon: "⚙️" },
  { title: "02 // HIGH DENSITY", content: "Particles count = 5,000. JavaScript usually chokes around 500. Rust eats this for breakfast.", icon: "🌌" },
  { title: "03 // DISTRIBUTED COMPUTING", content: "I am using your GPU and CPU to render this. It saves me server costs and warms up your room. You're welcome.", icon: "🔥" },
 ];

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [fps, setFps] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState("0 KB");
  const [isTerminalOpen, setTerminalOpen] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<string[]>(["DEVBRO KERNEL [v1.0.5]", "Type 'help' for commands.", ""]);
  const [inputVal, setInputVal] = useState("");
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const [isManualOpen, setManualOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Engine Refs
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

        // --- 7,000 PARTICLES ---
        const particleCount = 5000; 
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

              if (isOverclocked) {
                 ctx.fillStyle = '#EF4444'; 
              } else {
                 ctx.fillStyle = '#10B981'; 
              }

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
   
  }, [isOverclocked, isDestructing]);

  if (isDestructing) return <div className="h-screen w-full bg-blue-900 text-white font-mono flex items-center justify-center flex-col p-10"><h1 className="text-4xl mb-4">:(</h1><p>CRITICAL_PROCESS_DIED</p></div>;

  return (
    <main className={`relative min-h-screen bg-black text-white overflow-hidden font-mono selection:bg-emerald-500 selection:text-black ${isOverclocked ? "shake-screen" : ""}`}>
      <style jsx global>{`
        .shake-screen { animation: shake 0.5s infinite; }
        @keyframes shake { 0% { transform: translate(1px, 1px); } 50% { transform: translate(-1px, 2px); } 100% { transform: translate(1px, -2px); } }
      `}</style>

      <canvas ref={canvasRef} width={1920} height={1080} className="absolute inset-0 z-0 opacity-40 pointer-events-none" />

      {/* MANUAL MODAL */}
      <AnimatePresence>
        {isManualOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="relative w-full max-w-lg bg-black/90 border border-emerald-500 rounded-lg shadow-2xl overflow-hidden">
                  <div className="bg-emerald-900 bg-opacity-20 border-b border-emerald-500/50 p-4 flex justify-between items-center">
                      <span className="text-emerald-400 font-bold tracking-widest text-xs">[ SYSTEM_MANUAL.md ]</span>
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
            <div className="flex justify-between gap-8"><span>PARTICLES:</span> <span className="text-emerald-400">5,000</span></div>
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
      </div>
      
      <div className="absolute bottom-6 w-full text-center text-neutral-600 text-[10px] uppercase tracking-widest">HAVE A GOOD ONE • [ DEVBRO ]</div>
    </main>
  );
}