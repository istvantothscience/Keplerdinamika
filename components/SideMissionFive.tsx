import React, { useState, useEffect, useRef, useCallback } from 'react';
import { submitMissionProgress } from '../services/api';

interface SideMissionFiveProps {
  onClose: () => void;
  onPointsAwarded: (newTotal: number) => void;
  onMissionComplete: (missionId: string, newTotal: number) => void;
  studentName: string;
  isCompleted?: boolean;
}

const QUESTIONS = [
  {
    q: "Mi a lendület (impulzus) jele és képlete?",
    options: ["F = m * a", "p = m * v", "E = 1/2 * m * v^2", "W = F * s"],
    correct: 1
  },
  {
    q: "Tökéletesen rugalmas ütközésnél mi marad meg a zárt rendszerben?",
    options: ["Csak a lendület", "Csak a mozgási energia", "A lendület és a mozgási energia is", "Egyik sem"],
    correct: 2
  },
  {
    q: "Ha két azonos tömegű golyó tökéletesen rugalmasan ütközik (az egyik állt), mi történik?",
    options: ["Mindkettő megáll", "Sebességet cserélnek", "Összetapadnak", "Visszapattannak azonos sebességgel"],
    correct: 1
  },
  {
    q: "Mi történik a mozgási energiával rugalmatlan ütközés esetén?",
    options: ["Növekszik", "Megmarad", "Egy része hővé vagy alakváltozássá alakul", "Teljesen eltűnik"],
    correct: 2
  },
  {
    q: "Ha egy nehéz golyó ütközik egy könnyű, álló golyónak rugalmasan, a könnyű golyó...",
    options: ["Nagyobb sebességgel repül el, mint a nehéz golyó eredeti sebessége", "Ugyanolyan sebességgel repül el", "Lassabban repül el", "Helyben marad"],
    correct: 0
  }
];

const SideMissionFive: React.FC<SideMissionFiveProps> = ({ onClose, onPointsAwarded, onMissionComplete, studentName, isCompleted }) => {
  const [gameState, setGameState] = useState<'ready' | 'running' | 'finished'>('ready');
  
  // Parameters
  const [mass1, setMass1] = useState(1); // kg
  const [vel1, setVel1] = useState(5); // m/s
  const [mass2, setMass2] = useState(1); // kg
  const [vel2, setVel2] = useState(0); // m/s (initially stationary)
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Simulation state
  const pos1Ref = useRef(100);
  const pos2Ref = useRef(500);
  const currentVel1Ref = useRef(0);
  const currentVel2Ref = useRef(0);
  const hasCollidedRef = useRef(false);

  // Quiz state
  const [answers, setAnswers] = useState<number[]>(Array(5).fill(-1));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);
    
    // Background
    ctx.fillStyle = '#0a0b10';
    ctx.fillRect(0, 0, w, h);

    // Track
    const trackY = h / 2 + 30;
    ctx.fillStyle = '#333';
    ctx.fillRect(0, trackY, w, 10);
    
    // Draw Balls
    const drawBall = (x: number, m: number, color: string, label: string, v: number) => {
        const radius = 20 + Math.min(m * 2, 20); // Size based on mass
        ctx.beginPath();
        ctx.arc(x, trackY - radius, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, trackY - radius + 5);
        
        // Velocity vector
        if (Math.abs(v) > 0.1) {
            ctx.beginPath();
            ctx.moveTo(x, trackY - radius * 2 - 10);
            ctx.lineTo(x + v * 10, trackY - radius * 2 - 10);
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Arrow head
            ctx.beginPath();
            ctx.moveTo(x + v * 10, trackY - radius * 2 - 10);
            ctx.lineTo(x + v * 10 - Math.sign(v) * 5, trackY - radius * 2 - 15);
            ctx.lineTo(x + v * 10 - Math.sign(v) * 5, trackY - radius * 2 - 5);
            ctx.fill();
        }
    };

    drawBall(pos1Ref.current, mass1, '#00f2ff', 'm1', currentVel1Ref.current);
    drawBall(pos2Ref.current, mass2, '#ff3366', 'm2', currentVel2Ref.current);

    // Info
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(10, 10, 200, 80);
    ctx.fillStyle = '#00f2ff';
    ctx.textAlign = 'left';
    ctx.fillText(`v1: ${currentVel1Ref.current.toFixed(2)} m/s`, 20, 30);
    ctx.fillText(`p1: ${(mass1 * currentVel1Ref.current).toFixed(2)} kg*m/s`, 20, 50);
    
    ctx.fillStyle = '#ff3366';
    ctx.fillText(`v2: ${currentVel2Ref.current.toFixed(2)} m/s`, 20, 70);

  }, [mass1, mass2]);

  const loop = useCallback(() => {
    if (gameState === 'running') {
        const dt = 0.05;
        
        pos1Ref.current += currentVel1Ref.current * dt * 20; // scale speed for visual
        pos2Ref.current += currentVel2Ref.current * dt * 20;
        
        // Collision detection
        const radius1 = 20 + Math.min(mass1 * 2, 20);
        const radius2 = 20 + Math.min(mass2 * 2, 20);
        
        if (!hasCollidedRef.current && (pos2Ref.current - pos1Ref.current) <= (radius1 + radius2)) {
            // Elastic collision 1D
            // v1' = (v1(m1-m2) + 2*m2*v2) / (m1+m2)
            // v2' = (v2(m2-m1) + 2*m1*v1) / (m1+m2)
            const v1 = currentVel1Ref.current;
            const v2 = currentVel2Ref.current;
            
            const newV1 = (v1 * (mass1 - mass2) + 2 * mass2 * v2) / (mass1 + mass2);
            const newV2 = (v2 * (mass2 - mass1) + 2 * mass1 * v1) / (mass1 + mass2);
            
            currentVel1Ref.current = newV1;
            currentVel2Ref.current = newV2;
            hasCollidedRef.current = true;
            
            // Prevent sticking
            pos1Ref.current = pos2Ref.current - (radius1 + radius2) - 1;
        }
        
        // End condition
        if (pos1Ref.current < 0 || pos1Ref.current > 800 || pos2Ref.current > 800) {
            setGameState('finished');
        }
    }
    
    drawScene();
    requestRef.current = requestAnimationFrame(loop);
  }, [gameState, drawScene, mass1, mass2]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [loop]);

  const handleStart = () => {
      if (gameState !== 'ready') return;
      
      pos1Ref.current = 100;
      pos2Ref.current = 500;
      currentVel1Ref.current = vel1;
      currentVel2Ref.current = vel2;
      hasCollidedRef.current = false;
      
      setGameState('running');
  };
  
  const handleReset = () => {
      setGameState('ready');
      pos1Ref.current = 100;
      pos2Ref.current = 500;
      currentVel1Ref.current = vel1;
      currentVel2Ref.current = vel2;
      hasCollidedRef.current = false;
      drawScene();
  };

  const handleQuizSubmit = async () => {
      let currentScore = 0;
      answers.forEach((ans, idx) => {
          if (ans === QUESTIONS[idx].correct) currentScore++;
      });
      setScore(currentScore);
      setQuizSubmitted(true);

      try {
          const missionId = 'sm3_billiards';
          const newTotal = await submitMissionProgress(studentName, currentScore * 2, missionId); // 2 points per question = 10 max
          onPointsAwarded(newTotal);
          if (currentScore === 5) {
              onMissionComplete(missionId, newTotal);
          }
      } catch (e) { console.error(e); }
  };

  // Initial draw
  useEffect(() => {
      if (gameState === 'ready') {
          currentVel1Ref.current = vel1;
          currentVel2Ref.current = vel2;
          drawScene();
      }
  }, [vel1, vel2, mass1, mass2, gameState, drawScene]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0b10] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-neon/30 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-orbitron text-neon tracking-widest">OP-04 // NEWTON BILLIÁRD</h2>
          <div className="text-xs font-mono text-gray-400">RUGALMAS ÜTKÖZÉSEK ÉS LENDÜLET</div>
        </div>
        <button 
            onClick={onClose}
            className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-mono rounded"
        >
            BEZÁRÁS [X]
        </button>
      </div>

      <div className="container mx-auto max-w-5xl p-6 space-y-8 pb-20 relative">
        
        {isCompleted && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                <div className="bg-green-900/80 border-2 border-green-500 p-8 rounded-xl text-center shadow-[0_0_50px_rgba(34,197,94,0.5)]">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-3xl font-orbitron text-green-400 font-bold tracking-widest mb-2">KÜLDETÉS TELJESÍTVE</h2>
                    <p className="text-green-200 font-mono">Maximális pontszámot értél el a teszten.</p>
                </div>
            </div>
        )}

        {/* Simulation Viewport */}
        <div className="w-full h-[300px] bg-black border-2 border-gray-800 rounded relative shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
            <canvas ref={canvasRef} width={800} height={300} className="w-full h-full block" />
            <div className="absolute top-4 right-4 font-mono text-neon text-xs bg-black/50 p-2 rounded border border-neon/20">
                LIVE FEED // COLLISION TRACK
            </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-xl border border-white/10">
            <div className="space-y-6">
                <h3 className="text-neon font-orbitron border-b border-gray-700 pb-2">GOLYÓ 1 (KÉK)</h3>
                <div className="space-y-2">
                    <div className="flex justify-between font-mono text-neon font-bold text-sm">
                        <label>TÖMEG (m1)</label>
                        <span>{mass1} kg</span>
                    </div>
                    <input 
                        type="range" min="1" max="10" step="1"
                        value={mass1} 
                        onChange={(e) => setMass1(Number(e.target.value))}
                        disabled={gameState === 'running'}
                        className="w-full accent-neon cursor-pointer h-2 bg-gray-700 rounded-lg appearance-none"
                    />
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between font-mono text-neon font-bold text-sm">
                        <label>SEBESSÉG (v1)</label>
                        <span>{vel1} m/s</span>
                    </div>
                    <input 
                        type="range" min="1" max="15" step="1"
                        value={vel1} 
                        onChange={(e) => setVel1(Number(e.target.value))}
                        disabled={gameState === 'running'}
                        className="w-full accent-neon cursor-pointer h-2 bg-gray-700 rounded-lg appearance-none"
                    />
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-[#ff3366] font-orbitron border-b border-gray-700 pb-2">GOLYÓ 2 (PIROS)</h3>
                <div className="space-y-2">
                    <div className="flex justify-between font-mono text-[#ff3366] font-bold text-sm">
                        <label>TÖMEG (m2)</label>
                        <span>{mass2} kg</span>
                    </div>
                    <input 
                        type="range" min="1" max="10" step="1"
                        value={mass2} 
                        onChange={(e) => setMass2(Number(e.target.value))}
                        disabled={gameState === 'running'}
                        className="w-full accent-[#ff3366] cursor-pointer h-2 bg-gray-700 rounded-lg appearance-none"
                    />
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between font-mono text-[#ff3366] font-bold text-sm">
                        <label>SEBESSÉG (v2)</label>
                        <span>{vel2} m/s (ÁLL)</span>
                    </div>
                    <input 
                        type="range" min="0" max="0" step="1"
                        value={vel2} 
                        disabled
                        className="w-full accent-[#ff3366] cursor-not-allowed h-2 bg-gray-800 rounded-lg appearance-none opacity-50"
                    />
                </div>

                <div className="mt-6 flex gap-4 pt-4">
                    {gameState === 'ready' || gameState === 'finished' ? (
                        <button 
                            onClick={gameState === 'finished' ? handleReset : handleStart}
                            className={`flex-1 font-orbitron font-bold py-3 rounded transition-transform shadow-lg ${gameState === 'finished' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-alert text-black hover:scale-105 shadow-[0_0_15px_rgba(255,51,102,0.5)]'}`}
                        >
                            {gameState === 'finished' ? 'ÚJRA' : 'INDÍTÁS'}
                        </button>
                    ) : (
                        <button 
                            disabled
                            className="flex-1 bg-gray-800 text-gray-500 font-orbitron font-bold py-3 rounded cursor-not-allowed"
                        >
                            SZIMULÁCIÓ...
                        </button>
                    )}
                </div>
            </div>
        </div>
        
        {/* Quiz Section */}
        <div className="bg-[#0f1115] border border-gray-800 p-6 rounded-xl mt-8">
            <h3 className="text-2xl font-orbitron text-neon mb-6 border-b border-gray-800 pb-4">ELMÉLETI TESZT</h3>
            
            <div className="space-y-8">
                {QUESTIONS.map((q, qIdx) => (
                    <div key={qIdx} className="space-y-3">
                        <p className="text-white font-mono font-bold">{qIdx + 1}. {q.q}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {q.options.map((opt, oIdx) => {
                                const isSelected = answers[qIdx] === oIdx;
                                let btnClass = "p-3 text-left border rounded font-mono text-sm transition-colors ";
                                
                                if (quizSubmitted) {
                                    if (oIdx === q.correct) {
                                        btnClass += "bg-green-900/50 border-green-500 text-green-200";
                                    } else if (isSelected) {
                                        btnClass += "bg-red-900/50 border-red-500 text-red-200";
                                    } else {
                                        btnClass += "bg-gray-800 border-gray-700 text-gray-500";
                                    }
                                } else {
                                    if (isSelected) {
                                        btnClass += "bg-neon/20 border-neon text-neon";
                                    } else {
                                        btnClass += "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500";
                                    }
                                }

                                return (
                                    <button 
                                        key={oIdx}
                                        onClick={() => {
                                            if (!quizSubmitted) {
                                                const newAnswers = [...answers];
                                                newAnswers[qIdx] = oIdx;
                                                setAnswers(newAnswers);
                                            }
                                        }}
                                        disabled={quizSubmitted}
                                        className={btnClass}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
                {quizSubmitted ? (
                    <div className="text-xl font-orbitron">
                        EREDMÉNY: <span className={score === 5 ? "text-green-400" : "text-yellow-400"}>{score * 2} / 10 PONT</span>
                    </div>
                ) : (
                    <div className="text-gray-400 font-mono text-sm">Válaszolj minden kérdésre az ellenőrzéshez!</div>
                )}

                <div className="flex gap-4 w-full md:w-auto">
                    {quizSubmitted && score < 5 && (
                        <button 
                            onClick={() => {
                                setQuizSubmitted(false);
                                setAnswers(Array(5).fill(-1));
                                setScore(0);
                            }}
                            className="flex-1 md:flex-none px-6 py-3 bg-gray-700 text-white font-orbitron font-bold rounded hover:bg-gray-600 transition-colors"
                        >
                            ÚJRAÍRÁS
                        </button>
                    )}
                    <button 
                        onClick={handleQuizSubmit}
                        disabled={quizSubmitted || answers.includes(-1)}
                        className={`flex-1 md:flex-none px-8 py-3 font-orbitron font-bold rounded transition-all ${
                            quizSubmitted || answers.includes(-1) 
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                            : 'bg-neon text-black hover:scale-105 shadow-[0_0_15px_rgba(0,242,255,0.4)]'
                        }`}
                    >
                        ELLENŐRZÉS
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SideMissionFive;
