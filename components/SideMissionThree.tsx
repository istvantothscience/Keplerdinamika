import React, { useState, useEffect, useRef, useCallback } from 'react';
import { submitMissionProgress } from '../services/api';

interface SideMissionThreeProps {
  onClose: () => void;
  onPointsAwarded: (newTotal: number) => void;
  onMissionComplete: (missionId: string, newTotal: number) => void;
  studentName: string;
  isCompleted?: boolean;
}

const QUESTIONS = [
  {
    q: "Mi a rugóerő kiszámításának képlete (Hooke-törvény)?",
    options: ["F = m * a", "F = -D * x", "E = m * c^2", "W = F * s"],
    correct: 1
  },
  {
    q: "Milyen energia raktározódik az összenyomott rugóban?",
    options: ["Mozgási energia", "Gravitációs helyzeti energia", "Rugalmas helyzeti energia", "Belső energia"],
    correct: 2
  },
  {
    q: "Mi történik a rugalmas energiával a rakéta kilövésekor?",
    options: ["Hővé alakul", "Megsemmisül", "Mozgási energiává, majd gravitációs helyzeti energiává alakul", "Kémiai energiává alakul"],
    correct: 2
  },
  {
    q: "Hogyan függ a rakéta maximális magassága a rugóállandótól (D), ha a többi adat változatlan?",
    options: ["Egyenesen arányos vele", "Fordítottan arányos vele", "Négyzetesen arányos vele", "Nem függ tőle"],
    correct: 0
  },
  {
    q: "Ha kétszeresére növeljük a rugó összenyomását (x), hogyan változik a raktározott energia?",
    options: ["Kétszeresére nő", "Négyszeresére nő", "Felére csökken", "Nem változik"],
    correct: 1
  }
];

const SideMissionThree: React.FC<SideMissionThreeProps> = ({ onClose, onPointsAwarded, onMissionComplete, studentName, isCompleted }) => {
  const [gameState, setGameState] = useState<'ready' | 'launching' | 'finished'>('ready');

  // Physics Parameters
  const [springConstant, setSpringConstant] = useState(20000); // D (N/m)
  const [compression, setCompression] = useState(1.5); // x (m)
  const [mass, setMass] = useState(20); // m (kg)

  const [history, setHistory] = useState<{attempt: number, height: number}[]>([]);

  // Quiz State
  const [answers, setAnswers] = useState<number[]>(Array(5).fill(-1));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const velocityYRef = useRef(0);
  const altitudeRef = useRef(0);
  const starsRef = useRef<{x: number, y: number, size: number, speed: number}[]>([]);

  // Init stars
  useEffect(() => {
    const stars = [];
    for(let i=0; i<100; i++) {
        stars.push({
            x: Math.random() * 800,
            y: Math.random() * 400,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.5 + 0.1
        });
    }
    starsRef.current = stars;
  }, []);

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, w, h);

    // Draw Stars
    ctx.fillStyle = '#fff';
    starsRef.current.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    const groundY = h - 40;

    // Draw Ground
    ctx.fillStyle = '#111';
    ctx.fillRect(0, groundY, w, 40);
    ctx.strokeStyle = '#00f2ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();

    const centerX = w / 2;

    // Draw Ion Spring
    let springHeight = 60;
    if (gameState === 'ready') {
        springHeight = 60 - (compression * 15); // Visual compression
    } else if (gameState === 'launching') {
        springHeight = 60; // Instantly uncompresses
    } else {
        springHeight = 60;
    }

    const springTopY = groundY - springHeight;

    // Glowing spring effect
    ctx.shadowColor = '#00f2ff';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#00f2ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX - 20, groundY);
    ctx.lineTo(centerX + 20, groundY);

    let currentY = groundY;
    const zigzags = 8;
    const stepY = springHeight / zigzags;
    for (let i = 0; i < zigzags; i++) {
        currentY -= stepY;
        const dir = i % 2 === 0 ? 1 : -1;
        ctx.lineTo(centerX + (dir * 20), currentY);
    }
    ctx.lineTo(centerX, springTopY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Rocket
    let rocketVisualY = springTopY;
    if (gameState === 'launching' || gameState === 'finished') {
        if (altitudeRef.current > 0) {
            rocketVisualY = Math.max(50, springTopY - (altitudeRef.current * 2));
        }
    }

    ctx.save();
    ctx.translate(centerX, rocketVisualY);

    // Rocket Body
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(15, 0);
    ctx.lineTo(-15, 0);
    ctx.closePath();
    ctx.fill();

    // Rocket Window
    ctx.fillStyle = '#00f2ff';
    ctx.beginPath();
    ctx.arc(0, -15, 5, 0, Math.PI * 2);
    ctx.fill();

    // Rocket Fins
    ctx.fillStyle = '#ff3366';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(25, 15);
    ctx.lineTo(10, 5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(-25, 15);
    ctx.lineTo(-10, 5);
    ctx.fill();

    // Flames
    if (gameState === 'launching' && velocityYRef.current > 0) {
        ctx.fillStyle = '#ff9900';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.lineTo(0, 20 + Math.random() * 20);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();

    // HUD: Altitude
    ctx.fillStyle = '#00f2ff';
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`MAGASSÁG: ${Math.round(altitudeRef.current)} m`, 20, 40);
    ctx.fillText(`SEBESSÉG: ${Math.round(velocityYRef.current)} m/s`, 20, 70);

  }, [gameState, compression]);

  const loop = useCallback(() => {
    if (gameState === 'launching') {
        const dt = 0.015; // smooth visual dt
        const g = 10;

        velocityYRef.current -= g * dt;
        altitudeRef.current += velocityYRef.current * dt;

        // Move stars down to simulate upward movement
        if (velocityYRef.current > 0) {
            starsRef.current.forEach(star => {
                star.y += velocityYRef.current * dt * 0.5;
                if (star.y > 400) star.y = 0;
            });
        }

        if (velocityYRef.current <= 0) {
            setGameState('finished');
            setHistory(prev => [...prev, { attempt: prev.length + 1, height: altitudeRef.current }]);
        }
    }

    drawScene();
    requestRef.current = requestAnimationFrame(loop);
  }, [gameState, drawScene]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [loop]);

  const handleLaunch = () => {
    if (gameState !== 'ready') return;

    // Calculate initial velocity based on energy conservation
    // 0.5 * k * x^2 = 0.5 * m * v^2
    // v = sqrt((k * x^2) / m)
    const vInitial = Math.sqrt((springConstant * Math.pow(compression, 2)) / mass);

    velocityYRef.current = vInitial;
    altitudeRef.current = 0;
    setGameState('launching');
  };

  const handleReset = () => {
    setGameState('ready');
    altitudeRef.current = 0;
    velocityYRef.current = 0;
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
          const missionId = 'sm3_rocket';
          const newTotal = await submitMissionProgress(studentName, currentScore, missionId); // 1 point per question = 5 max
          onPointsAwarded(newTotal);
          if (currentScore === 5) {
              onMissionComplete(missionId, newTotal);
          }
      } catch (e) { console.error(e); }
  };

  // Initial draw
  useEffect(() => {
      if (gameState === 'ready') {
          drawScene();
      }
  }, [springConstant, compression, mass, gameState, drawScene]);

  const maxHistoryHeight = Math.max(100, ...history.map(h => h.height));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0b10] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-neon/30 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-orbitron text-neon tracking-widest">OP-03 // RUGÓS RAKÉTA</h2>
          <div className="text-xs font-mono text-gray-400">ENERGIAMEGMARADÁS ÉS HOOKE-TÖRVÉNY</div>
        </div>
        <button onClick={onClose} className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-mono rounded font-bold">
            BEZÁRÁS [X]
        </button>
      </div>

      <div className="container mx-auto max-w-6xl p-6 space-y-8 pb-20 relative">
        {isCompleted && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                <div className="bg-green-900/80 border-2 border-green-500 p-8 rounded-xl text-center shadow-[0_0_50px_rgba(34,197,94,0.5)]">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-3xl font-orbitron text-green-400 font-bold tracking-widest mb-2">KÜLDETÉS TELJESÍTVE</h2>
                    <p className="text-green-200 font-mono">Maximális pontszámot értél el a teszten.</p>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Simulation Viewport */}
            <div className="lg:col-span-2 w-full aspect-[2/1] bg-black border-2 border-gray-800 rounded relative shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
                <canvas ref={canvasRef} width={800} height={400} className="w-full h-full block object-cover" />
            </div>

            {/* Controls & Graph */}
            <div className="space-y-6 bg-white/5 p-6 rounded-xl border border-white/10 flex flex-col">
                <h3 className="text-neon font-orbitron border-b border-gray-700 pb-2">PARAMÉTEREK</h3>

                <div className="space-y-2">
                    <div className="flex justify-between font-mono text-neon font-bold text-sm">
                        <label>RUGÓÁLLANDÓ (D)</label>
                        <span>{springConstant} N/m</span>
                    </div>
                    <input type="range" min="1000" max="50000" step="1000" value={springConstant} onChange={(e) => setSpringConstant(Number(e.target.value))} disabled={gameState === 'launching'} className="w-full accent-neon cursor-pointer h-2 bg-gray-700 rounded-lg appearance-none" />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between font-mono text-neon font-bold text-sm">
                        <label>ÖSSZENYOMÁS (x)</label>
                        <span>{compression.toFixed(2)} m</span>
                    </div>
                    <input type="range" min="0.1" max="3.0" step="0.1" value={compression} onChange={(e) => setCompression(Number(e.target.value))} disabled={gameState === 'launching'} className="w-full accent-neon cursor-pointer h-2 bg-gray-700 rounded-lg appearance-none" />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between font-mono text-neon font-bold text-sm">
                        <label>RAKÉTA TÖMEGE (m)</label>
                        <span>{mass} kg</span>
                    </div>
                    <input type="range" min="5" max="100" step="5" value={mass} onChange={(e) => setMass(Number(e.target.value))} disabled={gameState === 'launching'} className="w-full accent-neon cursor-pointer h-2 bg-gray-700 rounded-lg appearance-none" />
                </div>

                <div className="mt-4">
                    {gameState === 'ready' || gameState === 'finished' ? (
                        <button onClick={gameState === 'finished' ? handleReset : handleLaunch} className={`w-full font-orbitron font-bold py-3 rounded transition-transform shadow-lg ${gameState === 'finished' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-neon text-black hover:scale-105 shadow-[0_0_15px_rgba(0,242,255,0.5)]'}`}>
                            {gameState === 'finished' ? 'ÚJRA' : 'KILÖVÉS'}
                        </button>
                    ) : (
                        <button disabled className="w-full bg-gray-800 text-gray-500 font-orbitron font-bold py-3 rounded cursor-not-allowed">
                            REPÜLÉS...
                        </button>
                    )}
                </div>

                {/* Graph */}
                <div className="mt-auto pt-6 border-t border-gray-700">
                    <h4 className="text-gray-400 font-mono text-xs mb-2">KILÖVÉSI ELŐZMÉNYEK (MAGASSÁG)</h4>
                    <div className="h-32 flex items-end gap-2 border-b border-l border-gray-600 p-2 relative">
                        {history.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-mono text-xs">Nincs adat</div>}
                        {history.map((h, i) => (
                            <div key={i} className="w-8 bg-neon/80 hover:bg-neon transition-all relative group flex-shrink-0" style={{ height: `${Math.max(5, (h.height / maxHistoryHeight) * 100)}%` }}>
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black px-1 rounded">
                                    {Math.round(h.height)}m
                                </div>
                            </div>
                        ))}
                    </div>
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
                                    if (oIdx === q.correct) btnClass += "bg-green-900/50 border-green-500 text-green-200";
                                    else if (isSelected) btnClass += "bg-red-900/50 border-red-500 text-red-200";
                                    else btnClass += "bg-gray-800 border-gray-700 text-gray-500";
                                } else {
                                    if (isSelected) btnClass += "bg-neon/20 border-neon text-neon";
                                    else btnClass += "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500";
                                }
                                return (
                                    <button key={oIdx} onClick={() => { if (!quizSubmitted) { const newAnswers = [...answers]; newAnswers[qIdx] = oIdx; setAnswers(newAnswers); } }} disabled={quizSubmitted} className={btnClass}>
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
                        EREDMÉNY: <span className={score === 5 ? "text-green-400" : "text-yellow-400"}>{score} / 5 PONT</span>
                    </div>
                ) : (
                    <div className="text-gray-400 font-mono text-sm">Válaszolj minden kérdésre az ellenőrzéshez!</div>
                )}
                <div className="flex gap-4 w-full md:w-auto">
                    {quizSubmitted && score < 5 && (
                        <button onClick={() => { setQuizSubmitted(false); setAnswers(Array(5).fill(-1)); setScore(0); }} className="flex-1 md:flex-none px-6 py-3 bg-gray-700 text-white font-orbitron font-bold rounded hover:bg-gray-600 transition-colors">
                            ÚJRAÍRÁS
                        </button>
                    )}
                    <button onClick={handleQuizSubmit} disabled={quizSubmitted || answers.includes(-1)} className={`flex-1 md:flex-none px-8 py-3 font-orbitron font-bold rounded transition-all ${quizSubmitted || answers.includes(-1) ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-neon text-black hover:scale-105 shadow-[0_0_15px_rgba(0,242,255,0.4)]'}`}>
                        ELLENŐRZÉS
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SideMissionThree;
