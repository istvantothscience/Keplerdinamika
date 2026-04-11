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

// Planet definitions
interface Planet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  color: string;
  name: string;
  active: boolean;
  isCue?: boolean;
}

const POCKET_RADIUS = 30;
const EVENT_HORIZON_RADIUS = 200;
const POCKETS = [
  { x: 0, y: 0 },
  { x: 400, y: 0 },
  { x: 800, y: 0 },
  { x: 0, y: 400 },
  { x: 400, y: 400 },
  { x: 800, y: 400 },
];

const INITIAL_PLANETS: Planet[] = [
  { id: 0, x: 200, y: 200, vx: 0, vy: 0, radius: 15, mass: 1, color: '#3b82f6', name: 'Föld', active: true, isCue: true }, // Earth
  { id: 1, x: 600, y: 200, vx: 0, vy: 0, radius: 15, mass: 1, color: '#ef4444', name: 'Mars', active: true },
  { id: 2, x: 630, y: 180, vx: 0, vy: 0, radius: 20, mass: 1.5, color: '#f59e0b', name: 'Jupiter', active: true },
  { id: 3, x: 630, y: 220, vx: 0, vy: 0, radius: 18, mass: 1.2, color: '#fcd34d', name: 'Szaturnusz', active: true },
  { id: 4, x: 660, y: 160, vx: 0, vy: 0, radius: 14, mass: 0.9, color: '#10b981', name: 'Uránusz', active: true },
  { id: 5, x: 660, y: 200, vx: 0, vy: 0, radius: 14, mass: 0.9, color: '#3b82f6', name: 'Neptunusz', active: true },
  { id: 6, x: 660, y: 240, vx: 0, vy: 0, radius: 12, mass: 0.8, color: '#eab308', name: 'Vénusz', active: true },
];

const drawPlanet = (ctx: CanvasRenderingContext2D, planet: Planet) => {
    const { x, y, radius: r, name } = planet;

    ctx.save();

    // Draw back half of Saturn's ring
    if (name === 'Szaturnusz') {
        ctx.beginPath();
        ctx.ellipse(x, y, r * 2.2, r * 0.5, Math.PI / 8, Math.PI, Math.PI * 2);
        ctx.strokeStyle = 'rgba(180, 83, 9, 0.8)';
        ctx.lineWidth = r * 0.3;
        ctx.stroke();
    }

    // Base planet circle and clipping
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();

    // Draw base color
    ctx.fillStyle = planet.color;
    ctx.fill();

    // Planet specific details
    if (name === 'Föld') {
        ctx.fillStyle = '#2563eb'; // Ocean base
        ctx.fill();
        ctx.fillStyle = '#16a34a'; // Land
        ctx.beginPath(); ctx.arc(x - r*0.2, y - r*0.3, r*0.6, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + r*0.4, y + r*0.2, r*0.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x - r*0.4, y + r*0.5, r*0.4, 0, Math.PI*2); ctx.fill();
    } else if (name === 'Jupiter') {
        ctx.fillStyle = '#d97706'; ctx.fill();
        ctx.fillStyle = '#b45309';
        ctx.fillRect(x - r, y - r*0.5, r*2, r*0.2);
        ctx.fillRect(x - r, y - r*0.1, r*2, r*0.3);
        ctx.fillRect(x - r, y + r*0.4, r*2, r*0.15);
        ctx.fillStyle = '#991b1b'; // Great red spot
        ctx.beginPath(); ctx.ellipse(x + r*0.3, y + r*0.1, r*0.3, r*0.15, 0, 0, Math.PI*2); ctx.fill();
    } else if (name === 'Mars') {
        ctx.fillStyle = '#ef4444'; ctx.fill();
        ctx.fillStyle = 'rgba(153, 27, 27, 0.5)';
        ctx.beginPath(); ctx.arc(x - r*0.3, y - r*0.2, r*0.25, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + r*0.4, y + r*0.3, r*0.15, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x - r*0.1, y + r*0.4, r*0.2, 0, Math.PI*2); ctx.fill();
    } else if (name === 'Szaturnusz') {
        ctx.fillStyle = '#fcd34d'; ctx.fill();
        ctx.fillStyle = '#d97706';
        ctx.fillRect(x - r, y - r*0.3, r*2, r*0.15);
        ctx.fillRect(x - r, y + r*0.1, r*2, r*0.2);
    } else if (name === 'Vénusz') {
        ctx.fillStyle = '#fef08a'; ctx.fill();
        ctx.fillStyle = 'rgba(202, 138, 4, 0.3)';
        ctx.fillRect(x - r, y - r*0.4, r*2, r*0.3);
        ctx.fillRect(x - r, y + r*0.2, r*2, r*0.4);
    } else if (name === 'Uránusz') {
        ctx.fillStyle = '#6ee7b7'; ctx.fill();
    } else if (name === 'Neptunusz') {
        ctx.fillStyle = '#3b82f6'; ctx.fill();
        ctx.fillStyle = 'rgba(30, 58, 138, 0.4)';
        ctx.beginPath(); ctx.arc(x + r*0.2, y - r*0.2, r*0.4, 0, Math.PI*2); ctx.fill();
    }

    // 3D sphere shading
    const pGrad = ctx.createRadialGradient(x - r*0.3, y - r*0.3, 0, x, y, r);
    pGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
    pGrad.addColorStop(0.7, 'rgba(0,0,0,0.1)');
    pGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = pGrad;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();

    ctx.restore(); // Remove clipping

    // Draw front half of Saturn's ring
    if (name === 'Szaturnusz') {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x, y, r * 2.2, r * 0.5, Math.PI / 8, 0, Math.PI);
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.9)';
        ctx.lineWidth = r * 0.3;
        ctx.stroke();
        ctx.restore();
    }

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '10px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(name, x, y - r - (name === 'Szaturnusz' ? 12 : 8));
};

const SideMissionFive: React.FC<SideMissionFiveProps> = ({ onClose, onPointsAwarded, onMissionComplete, studentName, isCompleted }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  const [gameState, setGameState] = useState<'intro' | 'aiming' | 'rolling' | 'question' | 'finished'>('intro');
  const planetsRef = useRef<Planet[]>(JSON.parse(JSON.stringify(INITIAL_PLANETS)));
  
  const [aimAngle, setAimAngle] = useState(0); // degrees
  const [aimForce, setAimForce] = useState(50); // 0-100
  
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{text: string, isCorrect: boolean} | null>(null);
  const [pocketedCount, setPocketedCount] = useState(0);

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const time = performance.now() / 200; // For animation

    // Clear
    ctx.clearRect(0, 0, w, h);
    
    // Space Background
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, w, h);
    
    // Draw stars
    ctx.fillStyle = '#ffffff';
    for(let i=0; i<100; i++) {
        // Simple pseudo-random stars based on index
        const sx = (Math.sin(i * 123) * 0.5 + 0.5) * w;
        const sy = (Math.cos(i * 321) * 0.5 + 0.5) * h;
        ctx.fillRect(sx, sy, 1, 1);
    }

    // Draw Pockets (Black Holes with Pulsating Event Horizon)
    POCKETS.forEach((p, pIdx) => {
        // 1. Draw Pulsating Event Horizon Glow
        const pulseOpacity = Math.sin(time * 0.5 + pIdx) * 0.15 + 0.3; // Ranges from 0.15 to 0.45
        const ehGradient = ctx.createRadialGradient(p.x, p.y, POCKET_RADIUS, p.x, p.y, EVENT_HORIZON_RADIUS);
        ehGradient.addColorStop(0, `rgba(168, 85, 247, ${pulseOpacity})`); // Brighter, pulsating purple glow
        ehGradient.addColorStop(0.5, `rgba(138, 43, 226, ${pulseOpacity * 0.5})`);
        ehGradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, EVENT_HORIZON_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = ehGradient;
        ctx.fill();

        // 2. Draw Black Hole Core
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, POCKET_RADIUS);
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(0.6, '#000000');
        gradient.addColorStop(0.9, '#3b0764'); // Deep purple edge
        gradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Inner event horizon ring
        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_RADIUS * 0.8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Draw Planets
    planetsRef.current.forEach(planet => {
        if (!planet.active) return;
        drawPlanet(ctx, planet);
    });

    // Draw Aiming Line (Arrow)
    if (gameState === 'aiming') {
        const cue = planetsRef.current.find(p => p.isCue);
        if (cue && cue.active) {
            const rad = aimAngle * Math.PI / 180;
            const lineLength = aimForce * 3;
            
            const endX = cue.x + Math.cos(rad) * lineLength;
            const endY = cue.y + Math.sin(rad) * lineLength;

            ctx.beginPath();
            ctx.moveTo(cue.x, cue.y);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = 'rgba(0, 242, 255, 0.8)';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Arrow head (triangle)
            const headlen = 15;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - headlen * Math.cos(rad - Math.PI / 6), endY - headlen * Math.sin(rad - Math.PI / 6));
            ctx.lineTo(endX - headlen * Math.cos(rad + Math.PI / 6), endY - headlen * Math.sin(rad + Math.PI / 6));
            ctx.lineTo(endX, endY);
            ctx.fillStyle = 'rgba(0, 242, 255, 0.8)';
            ctx.fill();
        }
    }

  }, [gameState, aimAngle, aimForce]);

  const updatePhysics = useCallback(() => {
      let isMoving = false;
      const planets = planetsRef.current;
      const friction = 0.985;
      
      for (let i = 0; i < planets.length; i++) {
          const p = planets[i];
          if (!p.active) continue;
          
          p.x += p.vx;
          p.y += p.vy;
          
          p.vx *= friction;
          p.vy *= friction;
          
          if (Math.abs(p.vx) < 0.05) p.vx = 0;
          if (Math.abs(p.vy) < 0.05) p.vy = 0;
          
          if (p.vx !== 0 || p.vy !== 0) isMoving = true;
          
          // Wall collisions
          if (p.x - p.radius < 0) { p.x = p.radius; p.vx *= -1; }
          if (p.x + p.radius > 800) { p.x = 800 - p.radius; p.vx *= -1; }
          if (p.y - p.radius < 0) { p.y = p.radius; p.vy *= -1; }
          if (p.y + p.radius > 400) { p.y = 400 - p.radius; p.vy *= -1; }
          
          // Pocket collisions & Gravity (Event Horizon)
          for (const pocket of POCKETS) {
              const dx = pocket.x - p.x;
              const dy = pocket.y - p.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              
              // Gravity Pull (Event Horizon)
              if (dist < EVENT_HORIZON_RADIUS && dist > 5) {
                  // Pull gets stronger as it gets closer
                  const pullStrength = 0.6 * (1 - dist / EVENT_HORIZON_RADIUS);
                  p.vx += (dx / dist) * pullStrength;
                  p.vy += (dy / dist) * pullStrength;
                  isMoving = true; // Keep simulating while being pulled
              }

              // Pocketed
              if (dist < POCKET_RADIUS) {
                  p.active = false;
                  p.vx = 0;
                  p.vy = 0;
                  
                  if (p.isCue) {
                      // Scratch - reset cue ball
                      setTimeout(() => {
                          const cue = planetsRef.current.find(pl => pl.isCue);
                          if (cue) {
                              cue.x = 200;
                              cue.y = 200;
                              cue.active = true;
                          }
                      }, 1000);
                  } else {
                      // Pocketed a target planet
                      setGameState('question');
                  }
              }
          }
      }
      
      // Ball collisions
      for (let i = 0; i < planets.length; i++) {
          for (let j = i + 1; j < planets.length; j++) {
              const p1 = planets[i];
              const p2 = planets[j];
              
              if (!p1.active || !p2.active) continue;
              
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              const minDist = p1.radius + p2.radius;
              
              if (dist < minDist) {
                  // Collision occurred
                  const angle = Math.atan2(dy, dx);
                  const sin = Math.sin(angle);
                  const cos = Math.cos(angle);
                  
                  // Rotate velocities
                  const v1x = p1.vx * cos + p1.vy * sin;
                  const v1y = p1.vy * cos - p1.vx * sin;
                  const v2x = p2.vx * cos + p2.vy * sin;
                  const v2y = p2.vy * cos - p2.vx * sin;
                  
                  // 1D Elastic collision
                  const v1xFinal = ((p1.mass - p2.mass) * v1x + 2 * p2.mass * v2x) / (p1.mass + p2.mass);
                  const v2xFinal = ((p2.mass - p1.mass) * v2x + 2 * p1.mass * v1x) / (p1.mass + p2.mass);
                  
                  // Update velocities (rotate back)
                  p1.vx = v1xFinal * cos - v1y * sin;
                  p1.vy = v1y * cos + v1xFinal * sin;
                  p2.vx = v2xFinal * cos - v2y * sin;
                  p2.vy = v2y * cos + v2xFinal * sin;
                  
                  // Separate to prevent sticking
                  const overlap = minDist - dist;
                  p1.x -= Math.cos(angle) * overlap / 2;
                  p1.y -= Math.sin(angle) * overlap / 2;
                  p2.x += Math.cos(angle) * overlap / 2;
                  p2.y += Math.sin(angle) * overlap / 2;
              }
          }
      }
      
      return isMoving;
  }, []);

  const loop = useCallback(() => {
      if (gameState === 'rolling') {
          const isMoving = updatePhysics();
          if (!isMoving) {
              // Check if all target planets are pocketed
              const targetsLeft = planetsRef.current.filter(p => !p.isCue && p.active).length;
              if (targetsLeft === 0) {
                  setGameState('finished');
              } else {
                  setGameState('aiming');
              }
          }
      }
      drawScene();
      requestRef.current = requestAnimationFrame(loop);
  }, [gameState, drawScene, updatePhysics]);

  useEffect(() => {
      requestRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(requestRef.current);
  }, [loop]);

  const handleShoot = () => {
      if (gameState !== 'aiming') return;
      
      const cue = planetsRef.current.find(p => p.isCue);
      if (cue && cue.active) {
          const rad = aimAngle * Math.PI / 180;
          const forceMultiplier = 0.2;
          cue.vx = Math.cos(rad) * aimForce * forceMultiplier;
          cue.vy = Math.sin(rad) * aimForce * forceMultiplier;
          setGameState('rolling');
      }
  };

  const handleAnswer = async (optIdx: number) => {
      const q = QUESTIONS[currentQuestionIdx];
      const isCorrect = optIdx === q.correct;
      
      if (isCorrect) {
          setFeedback({ text: "Helyes válasz! +2 XP", isCorrect: true });
          setScore(s => s + 2);
      } else {
          setFeedback({ text: "Helytelen válasz.", isCorrect: false });
      }
      
      setTimeout(async () => {
          setFeedback(null);
          
          let nextIdx = currentQuestionIdx + 1;
          if (nextIdx >= QUESTIONS.length) {
              nextIdx = 0; // Loop questions if needed
          }
          setCurrentQuestionIdx(nextIdx);
          
          const newPocketedCount = pocketedCount + 1;
          setPocketedCount(newPocketedCount);
          
          // Check if all 6 targets are pocketed
          if (newPocketedCount >= 6) {
              setGameState('finished');
              try {
                  const missionId = 'sm3_billiards';
                  const finalScore = score + (isCorrect ? 2 : 0);
                  const newTotal = await submitMissionProgress(studentName, finalScore, missionId);
                  onPointsAwarded(newTotal);
                  onMissionComplete(missionId, newTotal);
              } catch (e) {
                  console.error(e);
              }
          } else {
              setGameState('aiming');
          }
      }, 2000);
  };

  const handleReset = () => {
      planetsRef.current = JSON.parse(JSON.stringify(INITIAL_PLANETS));
      setGameState('aiming');
      setScore(0);
      setPocketedCount(0);
      setCurrentQuestionIdx(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#050510] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-neon/30 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-orbitron text-neon tracking-widest">OP-05 // KOZMIKUS BILLIÁRD</h2>
          <div className="text-xs font-mono text-gray-400">RUGALMAS ÜTKÖZÉSEK A TÉRBEN</div>
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
                    <p className="text-green-200 font-mono">A szimulációt már sikeresen teljesítetted.</p>
                </div>
            </div>
        )}

        {/* Simulation Viewport */}
        <div className="w-full aspect-[2/1] max-h-[60vh] bg-black border-2 border-gray-800 rounded relative shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
            <canvas ref={canvasRef} width={800} height={400} className="w-full h-full block" />
            <div className="absolute top-4 right-4 font-mono text-neon text-xs bg-black/50 p-2 rounded border border-neon/20">
                PONTOK: {score} // Eltüntetett bolygók: {pocketedCount}/6
            </div>
            
            {/* Question Overlay */}
            {gameState === 'question' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-10">
                    <div className="bg-[#0f1115] border border-neon/50 p-6 rounded-xl max-w-2xl w-full shadow-[0_0_30px_rgba(0,242,255,0.2)]">
                        <h3 className="text-xl font-orbitron text-neon mb-4">FEKETE LYUK ANOMÁLIA! VÁLASZOLJ A KÉRDÉSRE:</h3>
                        <p className="text-white font-mono mb-6">{QUESTIONS[currentQuestionIdx].q}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {QUESTIONS[currentQuestionIdx].options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    disabled={feedback !== null}
                                    className="p-3 text-left border border-gray-700 bg-gray-800 text-gray-300 rounded hover:border-neon hover:text-neon transition-colors font-mono text-sm"
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                        
                        {feedback && (
                            <div className={`mt-4 p-3 rounded text-center font-bold ${feedback.isCorrect ? 'bg-green-900/50 text-green-400 border border-green-500' : 'bg-red-900/50 text-red-400 border border-red-500'}`}>
                                {feedback.text}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Finished Overlay */}
            {gameState === 'finished' && !isCompleted && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-10">
                    <div className="bg-[#0f1115] border border-green-500 p-8 rounded-xl text-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                        <h3 className="text-3xl font-orbitron text-green-400 mb-2">SZIMULÁCIÓ VÉGE</h3>
                        <p className="text-xl text-white mb-6">Megszerzett pontok: {score}</p>
                        <button onClick={onClose} className="px-8 py-3 bg-green-500 text-black font-bold rounded hover:bg-green-400 transition-colors font-orbitron">
                            TOVÁBB
                        </button>
                    </div>
                </div>
            )}

            {/* Intro Overlay */}
            {gameState === 'intro' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-20">
                    <div className="bg-[#0f1115] border border-neon/50 p-8 rounded-xl max-w-2xl w-full shadow-[0_0_30px_rgba(0,242,255,0.2)]">
                        <h3 className="text-3xl font-orbitron text-neon mb-6 text-center">KOZMIKUS BILLIÁRD</h3>
                        <div className="text-gray-300 font-mono text-sm md:text-base space-y-4 mb-8">
                            <p>Üdvözlünk a szimulációban! A feladatod, hogy a <strong>Föld</strong> (kék bolygó) segítségével a többi bolygót a fekete lyukakba lökd.</p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-400">
                                <li>Állítsd be a lövés <strong>irányát</strong> és <strong>erejét</strong> az alsó csúszkákkal.</li>
                                <li>Kattints a <strong className="text-white">KILÖVÉS</strong> gombra az indításhoz.</li>
                                <li>Vigyázz! A fekete lyukak <strong>eseményhorizontja</strong> (lila aura) erős gravitációs vonzással bír. Ha egy bolygó túl közel ér, beszippantja!</li>
                                <li>Minden sikeresen eltüntetett bolygó után egy <strong>fizikai kérdésre</strong> kell válaszolnod a pontokért.</li>
                            </ul>
                        </div>
                        <div className="text-center">
                            <button onClick={() => setGameState('aiming')} className="px-8 py-3 bg-neon text-black font-bold rounded hover:bg-cyan-400 transition-colors font-orbitron text-xl shadow-[0_0_15px_rgba(0,242,255,0.4)]">
                                JÁTÉK KEZDETE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Controls */}
        <div className="bg-white/5 p-6 rounded-xl border border-white/10 flex flex-col md:flex-row gap-8 items-center">
            
            <div className="flex-1 w-full space-y-2">
                <div className="flex justify-between font-mono text-neon font-bold text-sm">
                    <label>LÖVÉS IRÁNYA (FOK)</label>
                    <span>{aimAngle}°</span>
                </div>
                <input 
                    type="range" min="0" max="360" step="1"
                    value={aimAngle} 
                    onChange={(e) => setAimAngle(Number(e.target.value))}
                    disabled={gameState !== 'aiming'}
                    className="w-full accent-neon cursor-pointer h-2 bg-gray-700 rounded-lg appearance-none"
                />
            </div>
            
            <div className="flex-1 w-full space-y-2">
                <div className="flex justify-between font-mono text-neon font-bold text-sm">
                    <label>LÖVÉS EREJE</label>
                    <span>{aimForce} N</span>
                </div>
                <input 
                    type="range" min="10" max="100" step="1"
                    value={aimForce} 
                    onChange={(e) => setAimForce(Number(e.target.value))}
                    disabled={gameState !== 'aiming'}
                    className="w-full accent-neon cursor-pointer h-2 bg-gray-700 rounded-lg appearance-none"
                />
            </div>

            <div className="w-full md:w-auto flex gap-4">
                <button 
                    onClick={handleShoot}
                    disabled={gameState !== 'aiming'}
                    className={`px-8 py-4 font-orbitron font-bold rounded transition-all whitespace-nowrap ${gameState === 'aiming' ? 'bg-alert text-black hover:scale-105 shadow-[0_0_15px_rgba(255,140,0,0.5)]' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                >
                    KILÖVÉS
                </button>
                <button 
                    onClick={handleReset}
                    className="px-4 py-4 bg-gray-800 text-white font-orbitron font-bold rounded hover:bg-gray-700 transition-colors"
                    title="Szimuláció újraindítása"
                >
                    ÚJRA
                </button>
            </div>
            
        </div>

      </div>
    </div>
  );
};

export default SideMissionFive;
