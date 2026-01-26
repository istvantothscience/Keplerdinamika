import React, { useRef, useEffect, useState, useCallback } from 'react';
import { submitMissionProgress } from '../services/api';

// Quiz Data derived from the provided HTML
const QUIZ_DATA = [
  { q: "Milyen hatással van az erő az űrhajóra?", a: ["Alakváltoztató hatása", "Mozgásállapotváltoztató hatása", "Nincs rá hatással"], c: 1 },
  { q: "Hogyan változik az űrhajó mozgásállapota, ha növeljük a rugó erejét?", a: ["Kisebb lesz a sebességváltozás", "Nagyobb lesz a sebességváltozás", "Nem változik"], c: 1 },
  { q: "Mi a kapcsolat a tömeg és a mozgásállapot-változás (gyorsulás) között?", a: ["Egyenes arányosság", "Fordított arányosság", "Nincs kapcsolat"], c: 1 },
  { q: "Ha ugyanazzal az erővel lökünk el egy nehezebb űrhajót, az...", a: ["Messzebbre jut", "Közelebb áll meg", "Ugyanoda jut"], c: 1 }
];

interface SideMissionOneProps {
  onClose: () => void;
  onPointsAwarded: (newTotal: number) => void;
  studentName: string;
}

const SideMissionOne: React.FC<SideMissionOneProps> = ({ onClose, onPointsAwarded, studentName }) => {
  // --- Simulation State ---
  const [force, setForce] = useState(50);
  const [mass, setMass] = useState(2.0);
  const [distance, setDistance] = useState(0);
  const [isFlying, setIsFlying] = useState(false);
  const [history, setHistory] = useState<number[]>([]);

  // --- Quiz State ---
  const [answers, setAnswers] = useState<{[key: number]: number}>({});
  const [quizResult, setQuizResult] = useState<{score: number, text: string, success: boolean} | null>(null);

  // --- Refs for Animation ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const shipXRef = useRef(80);
  const velocityRef = useRef(0);

  // Calculate acceleration for display
  const acceleration = (force / mass).toFixed(1);

  // --- Drawing Logic ---
  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const groundY = canvas.height - 40;
    
    // Draw Stars (Static Background)
    ctx.fillStyle = "white";
    for(let i=0; i<20; i++) ctx.fillRect((i*57)%canvas.width, (i*23)%canvas.height, 1, 1);

    // Draw Spring
    const springEndX = isFlying ? 60 : shipXRef.current;
    ctx.strokeStyle = "#ff8c00";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, groundY - 20);
    // Draw coiled spring segments
    for(let i=0; i<=12; i++) {
        const x = 10 + i*((springEndX-10)/12);
        const y = groundY - 20 + (i%2===0 ? 10 : -10);
        ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw Ship
    ctx.save();
    ctx.translate(shipXRef.current, groundY - 20);
    ctx.fillStyle = "#00f2ff";
    ctx.beginPath();
    ctx.moveTo(0, -15); 
    ctx.lineTo(50, 0); 
    ctx.lineTo(0, 15); 
    ctx.fill();

    // Engine Flame (only when flying and on screen)
    if(isFlying && shipXRef.current < canvas.width - 100) {
        ctx.fillStyle = "orange";
        ctx.beginPath(); 
        ctx.moveTo(-10, -5); 
        ctx.lineTo(-25 + Math.random()*5, 0); 
        ctx.lineTo(-10, 5); 
        ctx.fill();
    }
    ctx.restore();
  }, [isFlying]);

  // --- Animation Loop ---
  const animate = useCallback(() => {
    if (!isFlying) return;

    shipXRef.current += velocityRef.current;
    velocityRef.current *= 0.985; // Friction

    // Boundaries check
    if (velocityRef.current > 0.1 && shipXRef.current < (canvasRef.current?.width || 800)) {
        drawScene();
        requestRef.current = requestAnimationFrame(animate);
    } else {
        // Stop condition
        setIsFlying(false);
        const finalDist = Math.round((force / mass) * 15); // Simulated distance calc matching original
        setDistance(finalDist);
        setHistory(prev => [...prev, finalDist]);
        drawScene(); // Final draw
    }
  }, [isFlying, force, mass, drawScene]);

  // Start Animation Effect
  useEffect(() => {
    if (isFlying) {
      // Initialize flight parameters
      velocityRef.current = (force / mass) * 0.4;
      requestRef.current = requestAnimationFrame(animate);
    } else {
      // Reset position visual when not flying (if we just changed sliders)
      if (shipXRef.current < 800) { // Keep position if it flew out? No, reset for slider logic
         // Actually, the original code resets shipX based on spring compression when not flying
         if (!isFlying) {
            shipXRef.current = 40 + (force / 3);
            drawScene();
         }
      }
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isFlying, animate, force, mass, drawScene]);

  // Initial Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
        canvas.width = canvas.parentElement?.offsetWidth || 800;
        canvas.height = 350;
        drawScene();
    }
  }, [drawScene]);

  const handleLaunch = () => {
    if (isFlying) return;
    setIsFlying(true);
  };

  // --- Quiz Logic ---
  const handleQuizOptionClick = (qIndex: number, aIndex: number) => {
    if (quizResult?.success) return; // Lock if already succeeded
    setAnswers(prev => ({ ...prev, [qIndex]: aIndex }));
  };

  const checkQuiz = async () => {
    let score = 0;
    QUIZ_DATA.forEach((d, i) => { if(answers[i] === d.c) score++; });
    
    const isSuccess = score === QUIZ_DATA.length;
    
    setQuizResult({
        score,
        text: `DIAGNÓZIS: ${score} / ${QUIZ_DATA.length} adat helyes.`,
        success: isSuccess
    });

    if (isSuccess) {
        // Send points
        try {
            const newTotal = await submitMissionProgress(studentName, 10, "sm1_physics_quiz");
            onPointsAwarded(newTotal);
        } catch (e) {
            console.error("Failed to send points", e);
        }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0b10] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-neon/30 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-orbitron text-neon tracking-widest">S.M. 01 // IONRUGÓS HIPERTÉR</h2>
          <div className="text-xs font-mono text-gray-400">FIZIKAI SZIMULÁCIÓS MODUL</div>
        </div>
        <button 
            onClick={onClose}
            className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-mono rounded"
        >
            BEZÁRÁS [X]
        </button>
      </div>

      <div className="container mx-auto max-w-5xl p-6 space-y-8 pb-20">
        
        {/* Simulation Viewport */}
        <div className="w-full h-[350px] bg-black border-2 border-gray-800 rounded relative shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <canvas ref={canvasRef} className="w-full h-full block" />
            <div className="absolute top-4 right-4 font-mono text-neon text-xs bg-black/50 p-2 rounded border border-neon/20">
                LIVE FEED
            </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-xl border border-white/10">
            <div className="space-y-4">
                <div className="flex justify-between font-mono text-neon font-bold">
                    <label>RUGÓERŐ (F)</label>
                    <span>{force} N</span>
                </div>
                <input 
                    type="range" 
                    min="20" max="250" 
                    value={force} 
                    onChange={(e) => setForce(Number(e.target.value))}
                    disabled={isFlying}
                    className="w-full accent-alert cursor-pointer h-2 bg-gray-700 rounded-lg appearance-none"
                />
            </div>
            <div className="space-y-4">
                <div className="flex justify-between font-mono text-neon font-bold">
                    <label>ŰRHAJÓ TÖMEG (m)</label>
                    <span>{mass.toFixed(1)} kg</span>
                </div>
                <input 
                    type="range" 
                    min="0.5" max="8.0" step="0.5"
                    value={mass} 
                    onChange={(e) => setMass(Number(e.target.value))}
                    disabled={isFlying}
                    className="w-full accent-alert cursor-pointer h-2 bg-gray-700 rounded-lg appearance-none"
                />
            </div>
            <button 
                onClick={handleLaunch}
                disabled={isFlying}
                className={`col-span-full py-4 font-orbitron font-bold text-lg tracking-widest uppercase transition-all
                    ${isFlying 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-alert text-black hover:bg-neon hover:shadow-[0_0_20px_#00f2ff]'
                    }
                `}
            >
                {isFlying ? 'FOLYAMATBAN...' : 'LÖKET INDÍTÁSA'}
            </button>
        </div>

        {/* Telemetry Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-black p-6 border-l-4 border-alert font-mono">
                <h4 className="text-alert font-bold mb-4 tracking-wider">TELEMETRIA</h4>
                <div className="space-y-2 text-sm">
                    <p className="flex justify-between">
                        <span className="text-gray-400">Gyorsulás (a):</span>
                        <span className="text-white">{acceleration} m/s²</span>
                    </p>
                    <p className="flex justify-between">
                        <span className="text-gray-400">Távolság (s):</span>
                        <span className="text-white">{distance} m</span>
                    </p>
                    <p className="flex justify-between border-t border-gray-800 pt-2 mt-2">
                        <span className="text-gray-400">Státusz:</span>
                        <span className={isFlying ? "text-neon animate-pulse" : "text-gray-500"}>
                            {isFlying ? "REPÜLÉS" : "KÉSZENLÉT"}
                        </span>
                    </p>
                </div>
            </div>
            
            {/* Simple History Chart (SVG) */}
            <div className="md:col-span-2 bg-white/5 rounded-lg p-4 h-48 relative border border-white/10 flex items-end gap-1">
                {history.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-mono text-xs">
                        NINCS ADAT
                    </div>
                )}
                {history.map((val, idx) => {
                    // Simple normalization for visualization max 500m
                    const heightPct = Math.min((val / 500) * 100, 100); 
                    return (
                        <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                            <div 
                                style={{ height: `${heightPct}%` }} 
                                className="w-full bg-neon/50 border-t border-neon hover:bg-neon transition-all"
                            ></div>
                            <div className="text-[10px] text-gray-500 mt-1">{idx+1}</div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-1 bg-black text-neon text-xs p-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                                {val} m
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Quiz Section */}
        <div className="bg-neon/5 border border-dashed border-neon/50 p-6 rounded-xl">
             <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🛰️</span>
                <h3 className="text-xl font-orbitron text-alert">KÜLDETÉS-KIÉRTÉKELŐ</h3>
             </div>

             <div className="space-y-6">
                {QUIZ_DATA.map((item, qIdx) => (
                    <div key={qIdx} className="space-y-2">
                        <p className="font-bold text-white text-sm md:text-base">
                            {qIdx+1}. {item.q}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {item.a.map((opt, oIdx) => (
                                <button
                                    key={oIdx}
                                    onClick={() => handleQuizOptionClick(qIdx, oIdx)}
                                    disabled={quizResult?.success}
                                    className={`
                                        text-xs p-3 text-left border transition-all rounded
                                        ${answers[qIdx] === oIdx 
                                            ? 'bg-neon text-black border-neon font-bold' 
                                            : 'bg-[#1c222d] text-gray-300 border-transparent hover:border-neon'
                                        }
                                    `}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
             </div>

             <button 
                onClick={checkQuiz}
                disabled={Object.keys(answers).length < QUIZ_DATA.length || quizResult?.success}
                className={`w-full mt-8 py-4 font-orbitron font-bold text-lg rounded transition-all
                    ${quizResult?.success 
                        ? 'bg-green-500 text-black cursor-default'
                        : Object.keys(answers).length < QUIZ_DATA.length
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : 'bg-neon text-black hover:shadow-[0_0_20px_#00f2ff]'
                    }
                `}
             >
                {quizResult?.success ? 'KÜLDETÉS TELJESÍTVE! (+10 PONT)' : 'KIÉRTÉKELÉS ÉS PONTKÜLDÉS'}
             </button>

             {quizResult && (
                 <div className={`mt-4 p-4 text-center font-mono font-bold border ${quizResult.success ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-alert text-alert bg-alert/10'}`}>
                     {quizResult.text}
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default SideMissionOne;