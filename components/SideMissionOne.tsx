import React, { useRef, useEffect, useState, useCallback } from 'react';
import { submitMissionProgress } from '../services/api';

interface SideMissionOneProps {
  onClose: () => void;
  onPointsAwarded: (newTotal: number) => void;
  onMissionComplete: (missionId: string, newTotal: number) => void;
  studentName: string;
  isCompleted?: boolean;
}

type SimState = 'intro' | 'driving' | 'crashed' | 'matching' | 'completed';

const QUANTITIES = [
  { id: 'q1', label: 'Erő (F)', match: 'u1' },
  { id: 'q2', label: 'Út (s)', match: 'u2' },
  { id: 'q3', label: 'Tömeg (m)', match: 'u3' },
  { id: 'q4', label: 'Sebesség (v)', match: 'u4' },
  { id: 'q5', label: 'Idő (t)', match: 'u5' },
  { id: 'q6', label: 'Gyorsulás (a)', match: 'u6' },
];

const UNITS = [
  { id: 'u1', label: 'Newton (N)' },
  { id: 'u2', label: 'méter (m)' },
  { id: 'u3', label: 'kilogramm (kg)' },
  { id: 'u4', label: 'méter/szekundum (m/s)' },
  { id: 'u5', label: 'másodperc (s)' },
  { id: 'u6', label: 'méter/szekundum² (m/s²)' },
];

const SHUFFLED_UNITS = [...UNITS].sort(() => Math.random() - 0.5);

// Pre-generate terrain features (jumps only)
const TERRAIN_FEATURES = Array.from({ length: 20 }).map((_, i) => ({
    x: 800 + i * 300 + Math.random() * 100, // Spread out features
    type: 'jump',
    size: 15 + Math.random() * 15 // Height of jump
}));

const SideMissionOne: React.FC<SideMissionOneProps> = ({ onClose, onPointsAwarded, onMissionComplete, studentName, isCompleted }) => {
  const [simState, setSimState] = useState<SimState>('intro');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  const keysRef = useRef({ ArrowRight: false, ArrowLeft: false });
  const physicsRef = useRef({
    x: 100,
    y: 100,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVelocity: 0,
    isGrounded: true,
  });
  const itemsRef = useRef(Array(12).fill(false));

  const [selectedQuantity, setSelectedQuantity] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') keysRef.current.ArrowRight = true;
      if (e.key === 'ArrowLeft') keysRef.current.ArrowLeft = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') keysRef.current.ArrowRight = false;
      if (e.key === 'ArrowLeft') keysRef.current.ArrowLeft = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const getBaseTerrain = (x: number) => {
    return Math.sin(x * 0.002) * 50 + Math.sin(x * 0.005) * 30 + Math.sin(x * 0.015) * 15 + 250;
  };

  const [terrainFeatures, setTerrainFeatures] = useState(TERRAIN_FEATURES);

  const getTerrainHeight = useCallback((x: number) => {
    let y = getBaseTerrain(x);
    
    // Add jumps
    for (const feature of terrainFeatures) {
        if (feature.type === 'jump') {
            const dist = x - feature.x;
            if (dist > -40 && dist < 0) {
                // Ramp up
                y -= (dist + 40) * (feature.size / 40);
            } else if (dist >= 0 && dist < 10) {
                // Drop off
                y -= feature.size;
            }
        }
    }
    return y;
  }, [terrainFeatures]);

  const stuckTimerRef = useRef(0);

  const handleRestart = useCallback(() => {
      physicsRef.current.x = 100;
      physicsRef.current.y = 100; // Drop from sky
      physicsRef.current.vx = 0;
      physicsRef.current.vy = 0;
      physicsRef.current.angle = 0;
      physicsRef.current.angularVelocity = 0;
      physicsRef.current.isGrounded = false;
      stuckTimerRef.current = 0;
      setSimState('driving');
  }, []);

  const handleRestartFromBeginning = useCallback(() => {
      physicsRef.current.x = 100;
      physicsRef.current.y = 100; // Drop from sky
      physicsRef.current.vx = 0;
      physicsRef.current.vy = 0;
      physicsRef.current.angle = 0;
      physicsRef.current.angularVelocity = 0;
      physicsRef.current.isGrounded = false;
      stuckTimerRef.current = 0;
      // Reset items
      itemsRef.current = Array(12).fill(false);
      
      // Regenerate terrain features
      setTerrainFeatures(Array.from({ length: 20 }).map((_, i) => ({
          x: 800 + i * 300 + Math.random() * 100,
          type: 'jump',
          size: 15 + Math.random() * 15
      })));
      
      setSimState('driving');
  }, []);

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const p = physicsRef.current;
    const roverScreenX = 200;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, "#e8a37b");
    skyGrad.addColorStop(1, "#c26b47");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Sun
    ctx.fillStyle = "rgba(255, 240, 200, 0.8)";
    ctx.beginPath();
    ctx.arc(w * 0.7, h * 0.3, 40, 0, Math.PI * 2);
    ctx.fill();

    // Mountains (Parallax)
    ctx.fillStyle = "#a84c32";
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 20) {
      const y = Math.sin((x + p.x * 0.2) * 0.003) * 50 + 150;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.fill();

    // Terrain
    ctx.fillStyle = "#8a331c";
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w + 20; x += 5) {
      const worldX = x + p.x - roverScreenX;
      ctx.lineTo(x, getTerrainHeight(worldX));
    }
    ctx.lineTo(w, h);
    ctx.fill();

    // Checkpoints (Only Finish Line now)
    const checkpoints = [6000];
    checkpoints.forEach(cp => {
        const screenX = cp - p.x + roverScreenX;
        if (screenX > -50 && screenX < w + 50) {
            const cpY = getTerrainHeight(cp);
            ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screenX, cpY);
            ctx.lineTo(screenX, cpY - 100);
            ctx.stroke();
            ctx.fillStyle = "#00ff00";
            ctx.font = "12px orbitron";
            ctx.textAlign = "center";
            ctx.fillText("CÉL", screenX, cpY - 110);
        }
    });

    // Underground items
    ctx.font = "20px orbitron";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < 12; i++) {
      if (itemsRef.current[i]) continue;
      const itemX = 500 + i * 450;
      const screenX = itemX - p.x + roverScreenX;
      
      if (screenX > -50 && screenX < w + 50) {
        const itemY = getBaseTerrain(itemX) + 80; // Underground
        
        ctx.fillStyle = "#00f2ff";
        ctx.fillText("?", screenX, itemY);
        ctx.strokeStyle = "#00f2ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX, itemY, 20, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Draw Rover
    ctx.save();
    ctx.translate(roverScreenX, p.y - 20);
    ctx.rotate(p.angle);

    // Draw scanner funnel
    const scanGrad = ctx.createLinearGradient(0, 0, 0, 150);
    scanGrad.addColorStop(0, "rgba(0, 242, 255, 0.5)");
    scanGrad.addColorStop(1, "rgba(0, 242, 255, 0)");
    ctx.fillStyle = scanGrad;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(-80, 150);
    ctx.lineTo(80, 150);
    ctx.fill();

    // Stylized Rover (Scaled up ~1.5x)
    ctx.fillStyle = "#e0e0e0";
    ctx.fillRect(-35, -20, 70, 20); // Body
    
    ctx.fillStyle = "#333";
    ctx.fillRect(-20, -28, 15, 8); // Solar panel
    
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, -20);
    ctx.lineTo(28, -40);
    ctx.stroke();
    ctx.fillStyle = "#00f2ff"; // Camera eye
    ctx.beginPath();
    ctx.arc(28, -40, 4, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    ctx.fillStyle = "#222";
    const drawWheel = (wx: number) => {
      ctx.save();
      ctx.translate(wx, 5);
      ctx.rotate(p.x * 0.05);
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-15, 0); ctx.lineTo(15, 0);
      ctx.moveTo(0, -15); ctx.lineTo(0, 15);
      ctx.stroke();
      ctx.restore();
    };

    drawWheel(-30);
    drawWheel(0);
    drawWheel(30);

    ctx.restore();

    // Progress
    const collectedCount = itemsRef.current.filter(Boolean).length;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(10, 10, 200, 30);
    ctx.fillStyle = "#00f2ff";
    ctx.font = "14px mono";
    ctx.textAlign = "left";
    ctx.fillText(`ADATOK: ${collectedCount} / 12`, 20, 30);

  }, [getTerrainHeight]);

  const animate = useCallback(() => {
    if (simState === 'driving') {
      const p = physicsRef.current;
      const keys = keysRef.current;
      
      let input = 0;
      if (keys.ArrowRight) input = 1;
      if (keys.ArrowLeft) input = -1;

      // Gravity
      p.vy += 0.4;

      // Acceleration
      if (p.isGrounded) {
          p.vx += input * 0.5;
          p.vx *= 0.95; // Ground friction
      } else {
          p.vx *= 0.99; // Air resistance
          // Allow some mid-air rotation control
          p.angularVelocity += input * 0.005;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Prevent going backwards past start
      if (p.x < 100) {
          p.x = 100;
          p.vx = 0;
      }

      // Terrain Collision
      const terrainY = getTerrainHeight(p.x);

      // Ground collision
      if (p.y >= terrainY) {
          p.y = terrainY;
          p.vy = 0;
          p.isGrounded = true;
          
          // Match angle to terrain when grounded
          const nextY = getTerrainHeight(p.x + 5);
          const terrainAngle = Math.atan2(nextY - terrainY, 5);
          
          let angleDiff = terrainAngle - p.angle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

          p.angularVelocity += angleDiff * 0.1;
          p.angularVelocity *= 0.8; // Dampen rotation
          
          // Gravity effect on slopes
          const slope = (nextY - getTerrainHeight(p.x - 5)) / 10;
          p.vx -= slope * 0.5;
      } else if (p.y < terrainY - 5) {
          p.isGrounded = false;
      }

      p.angle += p.angularVelocity;

      // Check if stuck
      if (Math.abs(p.vx) < 0.5 && input !== 0 && p.isGrounded) {
          stuckTimerRef.current++;
          if (stuckTimerRef.current > 60) { // 1 second of being stuck
              handleRestart();
              return;
          }
      } else {
          stuckTimerRef.current = 0;
      }

      // Crash condition (flipped over)
      if (Math.abs(p.angle) > Math.PI * 0.6 && p.isGrounded) {
          handleRestart();
          return;
      }

      // Items collection
      for (let i = 0; i < 12; i++) {
        if (!itemsRef.current[i]) {
            const itemX = 500 + i * 450;
            if (Math.abs(p.x - itemX) < 60) {
                itemsRef.current[i] = true;
            }
        }
      }

      // End of track
      if (p.x > 6000) {
          const collectedCount = itemsRef.current.filter(Boolean).length;
          if (collectedCount >= 12) {
              setSimState('matching');
          } else {
              p.vx = -5;
              p.x = 5990;
          }
      }

      drawScene();
      
      if (simState === 'driving') {
         requestRef.current = requestAnimationFrame(animate);
      }
    }
  }, [simState, drawScene, getTerrainHeight, handleRestart]);

  useEffect(() => {
    if (simState === 'driving') {
      requestRef.current = requestAnimationFrame(animate);
    } else if (simState === 'intro' || simState === 'crashed') {
      drawScene();
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [simState, animate, drawScene]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
        canvas.width = canvas.parentElement?.offsetWidth || 800;
        canvas.height = 400;
        
        // Initial setup
        physicsRef.current.y = getTerrainHeight(physicsRef.current.x);
        drawScene();
    }
  }, [drawScene, getTerrainHeight]);

  const handleMatch = (qId: string, uId: string) => {
     const q = QUANTITIES.find(x => x.id === qId);
     if (q && q.match === uId) {
         const newMatched = [...matchedPairs, qId];
         setMatchedPairs(newMatched);
         setSelectedQuantity(null);
         setSelectedUnit(null);
         
         if (newMatched.length === QUANTITIES.length) {
             setTimeout(() => {
                 setSimState('completed');
                 const pts = 10;
                 onPointsAwarded(pts);
                 onMissionComplete("sm1_physics_quiz", pts);
             }, 1000);
         }
     } else {
         setSelectedQuantity(null);
         setSelectedUnit(null);
     }
  };

  useEffect(() => {
      if (selectedQuantity && selectedUnit) {
          handleMatch(selectedQuantity, selectedUnit);
      }
  }, [selectedQuantity, selectedUnit]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0b10] overflow-y-auto">
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-neon/30 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-orbitron text-neon tracking-widest">OP-01 // RONCSDERBI -&gt; FIZIKAI MENNYISÉGEK</h2>
          <div className="text-xs font-mono text-gray-400">FELSZÍNI SZKENNER ÉS ADATELEMZŐ</div>
        </div>
        <button 
            onClick={onClose}
            className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-mono rounded"
        >
            BEZÁRÁS [X]
        </button>
      </div>

      <div className="container mx-auto max-w-5xl p-6 space-y-8 pb-20 relative">
        
        {isCompleted && simState === 'intro' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                <div className="bg-green-900/80 border-2 border-green-500 p-8 rounded-xl text-center shadow-[0_0_50px_rgba(34,197,94,0.5)]">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-3xl font-orbitron text-green-400 font-bold tracking-widest mb-2">KÜLDETÉS TELJESÍTVE</h2>
                    <p className="text-green-200 font-mono">Az adatok már a rendszerben vannak.</p>
                </div>
            </div>
        )}

        {simState === 'completed' && (
            <div className="bg-green-900/20 border border-green-500 p-8 rounded-xl text-center animate-fadeIn">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-orbitron text-green-400 font-bold tracking-widest mb-2">ADATELEMZÉS SIKERES</h2>
                <p className="text-gray-300 font-mono">Minden fizikai mennyiség és mértékegység párosítva. 10 XP jóváírva.</p>
                <button onClick={onClose} className="mt-6 px-8 py-3 bg-neon text-black font-bold font-orbitron rounded hover:scale-105 transition-transform">
                    VISSZA A RADARHOZ
                </button>
            </div>
        )}

        {(simState === 'intro' || simState === 'driving' || simState === 'crashed') && (
            <div className="w-full h-[400px] bg-black border-2 border-gray-800 rounded relative shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden select-none">
                <canvas ref={canvasRef} className="w-full h-full block" />
                
                {simState === 'intro' && !isCompleted && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                        <h3 className="text-2xl font-orbitron text-neon mb-4">FELSZÍNI SZKENNELÉS</h3>
                        <p className="text-gray-300 font-mono mb-8 max-w-lg text-center">
                            Irányítsd a marsjárót a nyilakkal (vagy a gombokkal)! Vigyázz, a terep egyenetlen, könnyen felborulhatsz!
                            Gyűjtsd be mind a 12 adatot a felszín alól.
                        </p>
                        <button 
                            onClick={() => setSimState('driving')}
                            className="px-8 py-4 bg-alert text-black font-orbitron font-bold text-xl rounded hover:bg-orange-400 hover:shadow-[0_0_20px_rgba(255,140,0,0.6)] transition-all"
                        >
                            SZKENNER INDÍTÁSA
                        </button>
                    </div>
                )}

                {simState === 'crashed' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20">
                        <h3 className="text-4xl font-orbitron text-red-500 mb-4 animate-pulse">FELBORULTÁL!</h3>
                        <p className="text-gray-300 font-mono mb-8">A marsjáró egyensúlya felborult. Próbáld újra a legutóbbi ellenőrzőponttól.</p>
                        <button 
                            onClick={handleRestart}
                            className="px-8 py-4 bg-alert text-black font-orbitron font-bold text-xl rounded hover:bg-orange-400 hover:shadow-[0_0_20px_rgba(255,140,0,0.6)] transition-all"
                        >
                            ÚJRAINDÍTÁS
                        </button>
                    </div>
                )}

                {simState === 'driving' && (
                    <>
                        <div className="absolute bottom-4 left-4 flex gap-4 z-10">
                            <button 
                                onPointerDown={() => keysRef.current.ArrowLeft = true}
                                onPointerUp={() => keysRef.current.ArrowLeft = false}
                                onPointerLeave={() => keysRef.current.ArrowLeft = false}
                                className="w-16 h-16 bg-black/50 border border-neon rounded-full text-neon text-2xl flex items-center justify-center select-none active:bg-neon active:text-black"
                            >
                                &larr;
                            </button>
                            <button 
                                onPointerDown={() => keysRef.current.ArrowRight = true}
                                onPointerUp={() => keysRef.current.ArrowRight = false}
                                onPointerLeave={() => keysRef.current.ArrowRight = false}
                                className="w-16 h-16 bg-black/50 border border-neon rounded-full text-neon text-2xl flex items-center justify-center select-none active:bg-neon active:text-black"
                            >
                                &rarr;
                            </button>
                        </div>
                        <div className="absolute bottom-4 right-4 flex gap-4 z-10">
                            <button 
                                onClick={handleRestartFromBeginning}
                                className="px-4 py-2 bg-black/50 border border-alert text-alert font-mono text-sm rounded hover:bg-alert hover:text-black transition-colors"
                            >
                                ÚJRA AZ ELEJÉRŐL
                            </button>
                        </div>
                    </>
                )}
            </div>
        )}

        {simState === 'matching' && (
            <div className="bg-[#0f1115] border border-gray-800 p-8 rounded-xl animate-fadeIn">
                <h3 className="text-2xl font-orbitron text-neon mb-2 text-center">ADATOK FELDOLGOZÁSA</h3>
                <p className="text-gray-400 font-mono text-center mb-8">Párosítsd a fizikai mennyiségeket a megfelelő mértékegységekkel!</p>
                
                <div className="grid grid-cols-2 gap-12 max-w-4xl mx-auto">
                    {/* Quantities */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-orbitron text-white border-b border-gray-700 pb-2">MENNYISÉGEK</h4>
                        {QUANTITIES.map(q => {
                            const isMatched = matchedPairs.includes(q.id);
                            const isSelected = selectedQuantity === q.id;
                            return (
                                <button
                                    key={q.id}
                                    disabled={isMatched}
                                    onClick={() => setSelectedQuantity(isSelected ? null : q.id)}
                                    className={`w-full p-4 text-left font-mono text-lg rounded border transition-all
                                        ${isMatched ? 'bg-green-900/30 border-green-500/50 text-green-500 opacity-50 cursor-not-allowed' : 
                                          isSelected ? 'bg-neon/20 border-neon text-neon shadow-[0_0_15px_rgba(0,242,255,0.3)]' : 
                                          'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500'}`}
                                >
                                    {q.label}
                                </button>
                            )
                        })}
                    </div>
                    
                    {/* Units */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-orbitron text-white border-b border-gray-700 pb-2">MÉRTÉKEGYSÉGEK</h4>
                        {SHUFFLED_UNITS.map(u => {
                            const matchedQ = QUANTITIES.find(q => q.match === u.id);
                            const isMatched = matchedQ ? matchedPairs.includes(matchedQ.id) : false;
                            const isSelected = selectedUnit === u.id;
                            
                            return (
                                <button
                                    key={u.id}
                                    disabled={isMatched}
                                    onClick={() => setSelectedUnit(isSelected ? null : u.id)}
                                    className={`w-full p-4 text-left font-mono text-lg rounded border transition-all
                                        ${isMatched ? 'bg-green-900/30 border-green-500/50 text-green-500 opacity-50 cursor-not-allowed' : 
                                          isSelected ? 'bg-alert/20 border-alert text-alert shadow-[0_0_15px_rgba(255,140,0,0.3)]' : 
                                          'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500'}`}
                                >
                                    {u.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default SideMissionOne;