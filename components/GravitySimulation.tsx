import React, { useState, useEffect, useRef, useCallback } from 'react';
// Trigger Vite reload

interface GravitySimulationProps {
  onClose: () => void;
}

const GravitySimulation: React.FC<GravitySimulationProps> = ({ onClose }) => {
  const [mass, setMass] = useState(50); // kg
  const [gravity, setGravity] = useState(12); // m/s^2
  const [userGuess, setUserGuess] = useState('');
  const [feedback, setFeedback] = useState<{type: 'success' | 'error' | 'neutral', msg: string}>({ type: 'neutral', msg: '' });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // A doboz nem mozog, csak újrarajzoljuk, ha változnak az értékek
  // Nem használunk animation loopot a lengéshez

  const checkAnswer = () => {
      const correctWeight = mass * gravity;
      const guess = parseInt(userGuess);

      if (isNaN(guess)) {
          setFeedback({ type: 'error', msg: 'Kérlek adj meg egy számot!' });
          return;
      }

      if (guess === correctWeight) {
          setFeedback({ type: 'success', msg: 'HELYES! A számítás pontos.' });
      } else {
          setFeedback({ type: 'error', msg: `HIBÁS. A helyes képlet: Fs = m · g` });
      }
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string, label: string) => {
    const headlen = 15;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.fill();

    // Label Text with Background
    ctx.font = "bold 16px 'Orbitron'";
    const textWidth = ctx.measureText(label).width;
    
    // Label placement depends on vector direction to avoid overlap
    const isUp = toY < fromY;
    const labelY = isUp ? toY - 15 : toY + 25;
    const labelX = toX - textWidth / 2;

    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(labelX - 5, labelY - 14, textWidth + 10, 20);
    
    ctx.fillStyle = color;
    ctx.fillText(label, labelX, labelY);
  };

  // Helper function to draw a 3D beam/column
  const drawBeam = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, thickness: number, colorBase: string) => {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const perpAngle = angle + Math.PI / 2;
      
      const dx = Math.cos(perpAngle) * (thickness / 2);
      const dy = Math.sin(perpAngle) * (thickness / 2);

      // Gradient for metallic look
      const grad = ctx.createLinearGradient(
          x1 - dx, y1 - dy,
          x1 + dx, y1 + dy
      );
      // Simulate light hitting a cylinder/beam
      grad.addColorStop(0, '#1a202c'); // Dark edge
      grad.addColorStop(0.3, '#718096'); // Highlight
      grad.addColorStop(0.6, '#4a5568'); // Midtone
      grad.addColorStop(1, '#000000'); // Shadow edge

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x1 - dx, y1 - dy);
      ctx.lineTo(x2 - dx, y2 - dy);
      ctx.lineTo(x2 + dx, y2 + dy);
      ctx.lineTo(x1 + dx, y1 + dy);
      ctx.closePath();
      ctx.fill();
      
      // Fine outline
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
  };

  const drawRealisticCrane = (ctx: CanvasRenderingContext2D, x: number, y: number, h: number, w: number) => {
      // 3D Perspective Setup
      // x,y is the top center point
      
      const topWidth = 60; // Narrower at top
      const bottomWidth = w; // Wide stance
      const perspectiveDepth = 60; // Z-depth for 3D effect

      const groundY = y + h;

      // Coordinates for the 4 feet (Bottom)
      const bFL = { x: x - bottomWidth/2, y: groundY + 20 }; // Front Left
      const bFR = { x: x + bottomWidth/2, y: groundY + 20 }; // Front Right
      const bBL = { x: x - bottomWidth/2 + perspectiveDepth, y: groundY - 20 }; // Back Left
      const bBR = { x: x + bottomWidth/2 - perspectiveDepth, y: groundY - 20 }; // Back Right

      // Coordinates for the top platform (Top)
      const tFL = { x: x - topWidth/2, y: y };
      const tFR = { x: x + topWidth/2, y: y };
      const tBL = { x: x - topWidth/2 + 10, y: y - 10 };
      const tBR = { x: x + topWidth/2 - 10, y: y - 10 };

      // Shadows on ground
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(bFL.x, bFL.y, 20, 8, 0, 0, Math.PI*2);
      ctx.ellipse(bFR.x, bFR.y, 20, 8, 0, 0, Math.PI*2);
      ctx.ellipse(bBL.x, bBL.y, 15, 6, 0, 0, Math.PI*2);
      ctx.ellipse(bBR.x, bBR.y, 15, 6, 0, 0, Math.PI*2);
      ctx.fill();

      // --- BACK LEGS (Render first so they are behind) ---
      drawBeam(ctx, tBL.x, tBL.y, bBL.x, bBL.y, 10, '#2d3748');
      drawBeam(ctx, tBR.x, tBR.y, bBR.x, bBR.y, 10, '#2d3748');

      // Back Cross Bracing (X pattern)
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for(let i=0; i<4; i++) {
          const t1 = i/4;
          const t2 = (i+1)/4;
          // Interpolate positions
          const lx1 = tBL.x + (bBL.x - tBL.x)*t1;
          const ly1 = tBL.y + (bBL.y - tBL.y)*t1;
          const rx2 = tBR.x + (bBR.x - tBR.x)*t2;
          const ry2 = tBR.y + (bBR.y - tBR.y)*t2;
          ctx.moveTo(lx1, ly1); ctx.lineTo(rx2, ry2);

          const rx1 = tBR.x + (bBR.x - tBR.x)*t1;
          const ry1 = tBR.y + (bBR.y - tBR.y)*t1;
          const lx2 = tBL.x + (bBL.x - tBL.x)*t2;
          const ly2 = tBL.y + (bBL.y - tBL.y)*t2;
          ctx.moveTo(rx1, ry1); ctx.lineTo(lx2, ly2);
      }
      ctx.stroke();


      // --- FRONT LEGS ---
      drawBeam(ctx, tFL.x, tFL.y, bFL.x, bFL.y, 14, '#718096');
      drawBeam(ctx, tFR.x, tFR.y, bFR.x, bFR.y, 14, '#718096');

      // Front Cross Bracing (Complex Truss)
      const segments = 5;
      for(let i=0; i<segments; i++) {
          const t1 = i/segments;
          const t2 = (i+1)/segments;
          
          const lx1 = tFL.x + (bFL.x - tFL.x)*t1;
          const ly1 = tFL.y + (bFL.y - tFL.y)*t1;
          const rx1 = tFR.x + (bFR.x - tFR.x)*t1;
          const ry1 = tFR.y + (bFR.y - tFR.y)*t1;
          
          const lx2 = tFL.x + (bFL.x - tFL.x)*t2;
          const ly2 = tFL.y + (bFL.y - tFL.y)*t2;
          const rx2 = tFR.x + (bFR.x - tFR.x)*t2;
          const ry2 = tFR.y + (bFR.y - tFR.y)*t2;

          // Horizontal bar
          drawBeam(ctx, lx1, ly1, rx1, ry1, 6, '#4a5568');
          
          // Diagonal X
          drawBeam(ctx, lx1, ly1, rx2, ry2, 5, '#4a5568');
          drawBeam(ctx, rx1, ry1, lx2, ly2, 5, '#4a5568');
      }
      // Bottom horizontal bar
      drawBeam(ctx, bFL.x, bFL.y, bFR.x, bFR.y, 8, '#4a5568');

      // --- TOP ASSEMBLY (Pulley System) ---
      // Platform base
      ctx.fillStyle = '#1a202c';
      ctx.beginPath();
      ctx.moveTo(tFL.x - 5, tFL.y);
      ctx.lineTo(tFR.x + 5, tFR.y);
      ctx.lineTo(tBR.x + 5, tBR.y);
      ctx.lineTo(tBL.x - 5, tBL.y);
      ctx.fill();

      // Main Pulley Wheel
      const wheelX = x;
      const wheelY = y + 20;
      const wheelR = 18;

      // Wheel Housing
      ctx.fillStyle = '#2d3748';
      ctx.beginPath();
      ctx.moveTo(tFL.x, tFL.y);
      ctx.lineTo(wheelX - 25, wheelY);
      ctx.lineTo(wheelX + 25, wheelY);
      ctx.lineTo(tFR.x, tFR.y);
      ctx.fill();

      // The Wheel
      const gradWheel = ctx.createRadialGradient(wheelX, wheelY, 5, wheelX, wheelY, wheelR);
      gradWheel.addColorStop(0, '#718096');
      gradWheel.addColorStop(1, '#1a202c');
      ctx.fillStyle = gradWheel;
      ctx.beginPath(); ctx.arc(wheelX, wheelY, wheelR, 0, Math.PI*2); ctx.fill();
      
      // Wheel spokes detail
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let i=0; i<6; i++) {
          const ang = (i/6)*Math.PI*2;
          ctx.moveTo(wheelX, wheelY);
          ctx.lineTo(wheelX + Math.cos(ang)*wheelR, wheelY + Math.sin(ang)*wheelR);
      }
      ctx.stroke();

      // Axle
      ctx.fillStyle = '#cbd5e0';
      ctx.beginPath(); ctx.arc(wheelX, wheelY, 6, 0, Math.PI*2); ctx.fill();
  };

  const drawMetalBox = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      // Alap test
      const grad = ctx.createLinearGradient(x, y, x + size, y + size);
      grad.addColorStop(0, '#4a5568');
      grad.addColorStop(0.5, '#718096');
      grad.addColorStop(1, '#2d3748');
      
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#1a202c';
      ctx.lineWidth = 2;
      
      ctx.fillRect(x, y, size, size);
      ctx.strokeRect(x, y, size, size);

      // Fémlemez mintázat (keresztmerevítők)
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x + size, y + size);
      ctx.moveTo(x + size, y); ctx.lineTo(x, y + size);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.stroke();

      // Szegecsek a sarkokban
      ctx.fillStyle = '#cbd5e0';
      const rivetOffset = 6;
      const r = 3;
      
      const drawRivet = (cx: number, cy: number) => {
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      };

      drawRivet(x + rivetOffset, y + rivetOffset);
      drawRivet(x + size - rivetOffset, y + rivetOffset);
      drawRivet(x + rivetOffset, y + size - rivetOffset);
      drawRivet(x + size - rivetOffset, y + size - rivetOffset);

      // Tömeg felirat
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 4;
      ctx.fillText(`${mass} KG`, x + size/2, y + size/2 + 4);
      ctx.shadowBlur = 0;
  };

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // 1. HÁTTÉR (Realisztikusabb Mars Atmoszféra)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#000000'); // Űr sötétje
    skyGrad.addColorStop(0.3, '#3d1607'); // Ritka légkör
    skyGrad.addColorStop(0.6, '#8c3510'); // Vöröses horizont
    skyGrad.addColorStop(1, '#d67c3e'); // Poros felszín közeli köd
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Nap/Csillag fénye
    const sunGrad = ctx.createRadialGradient(w*0.85, h*0.2, 5, w*0.85, h*0.2, 80);
    sunGrad.addColorStop(0, '#fff');
    sunGrad.addColorStop(0.2, 'rgba(255, 220, 180, 0.8)');
    sunGrad.addColorStop(0.5, 'rgba(255, 100, 50, 0.2)');
    sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad;
    ctx.beginPath(); ctx.arc(w*0.85, h*0.2, 100, 0, Math.PI*2); ctx.fill();

    // Távoli Hegyek (Rétegek)
    // Hátsó réteg
    ctx.fillStyle = '#4a2313';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for(let i=0; i<=w; i+=40) {
        // Fraktál-szerű csúcsok
        const noise = Math.sin(i * 0.05) * 20 + Math.cos(i * 0.1) * 10;
        ctx.lineTo(i, h - 180 + noise);
    }
    ctx.lineTo(w, h);
    ctx.fill();

    // Középső réteg
    ctx.fillStyle = '#632e18';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for(let i=0; i<=w; i+=25) {
        const noise = Math.sin(i * 0.08 + 2) * 30 + Math.cos(i * 0.2) * 15;
        ctx.lineTo(i, h - 100 + noise);
    }
    ctx.lineTo(w, h);
    ctx.fill();

    // Talaj (Texturált gradiens)
    const groundGrad = ctx.createLinearGradient(0, h-60, 0, h);
    groundGrad.addColorStop(0, '#753a1f');
    groundGrad.addColorStop(1, '#3d1c0d');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, h-60, w, 60);

    // Sziklák az előtérben
    for(let i=0; i<15; i++) {
        const rx = (i * 97 + 30) % w;
        const ry = h - 10 - (i*i % 40);
        const size = 5 + (i%5);
        ctx.fillStyle = 'rgba(40, 20, 10, 0.6)';
        ctx.beginPath(); 
        ctx.ellipse(rx, ry, size*1.5, size, 0, 0, Math.PI*2); 
        ctx.fill();
    }

    // 2. DARU ÉS DOBOZ
    const centerX = w / 2;
    const craneTopY = 80;
    const craneHeight = h - 60 - craneTopY;
    
    // Daru rajzolása (Új 3D függvény)
    drawRealisticCrane(ctx, centerX, craneTopY, craneHeight, 280);

    // Kötél (Statikus, feszes)
    // Méret korrekció: Kevésbé nőjön
    const boxSize = 50 + (mass / 20); 
    
    // A kötél hossza fixen lóg
    const boxTopY = craneTopY + 120; 

    // Kötél rajzolása (sodrott hatás)
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX, craneTopY + 20); // A kerék aljáról indul
    ctx.lineTo(centerX, boxTopY);
    ctx.stroke();
    // Vékonyabb világos szál
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Csomó/Kampó
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(centerX, boxTopY - 5, 6, 0, Math.PI*2);
    ctx.fill();

    // Doboz
    drawMetalBox(ctx, centerX - boxSize/2, boxTopY, boxSize);

    // 3. VEKTOROK
    const trueWeight = mass * gravity;
    const vectorScale = 0.1; 
    const gVectorLen = Math.min(trueWeight * vectorScale, h - (boxTopY + boxSize) - 10); 
    
    drawArrow(
        ctx, 
        centerX, boxTopY + boxSize/2, 
        centerX, boxTopY + boxSize/2 + gVectorLen, 
        '#00f2ff', 
        'Fs = ?'
    );

    const fkVectorLen = gVectorLen;
    drawArrow(
        ctx, 
        centerX, boxTopY, 
        centerX, boxTopY - fkVectorLen, 
        '#ff8c00', 
        'Fk'
    );

  }, [mass, gravity]); 

  useEffect(() => {
    // Inicializálás és átméretezés
    if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.parentElement?.clientWidth || 600;
        canvasRef.current.height = 450;
        drawScene();
    }
  }, [drawScene]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-5xl bg-[#0f1115] border-2 border-neon rounded-xl shadow-[0_0_50px_rgba(0,242,255,0.2)] flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center shrink-0">
            <h2 className="text-xl font-orbitron text-neon tracking-widest flex items-center gap-2">
                GRAVITÁCIÓS TERHELÉS TESZT
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white px-3 font-bold border border-transparent hover:border-white/20 rounded">BEZÁRÁS [X]</button>
        </div>

        {/* Main Content Grid */}
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
            
            {/* Canvas Area */}
            <div className="flex-1 relative bg-black min-h-[300px]">
                <canvas ref={canvasRef} className="w-full h-full block" />
            </div>

            {/* Controls Sidepanel */}
            <div className="w-full md:w-96 bg-[#0a0b10] border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto overflow-x-hidden">
                
                <div className="bg-neon/5 border border-neon/20 p-4 rounded text-sm text-gray-300 font-mono">
                    <p className="mb-2 text-neon font-bold uppercase">Parancsnoki Utasítás:</p>
                    <p>A daru teherbírását teszteljük. Számítsd ki a doboz súlyát (F<sub>s</sub>) a tömeg és a helyi gravitáció alapján!</p>
                </div>

                {/* Formula */}
                <div className="text-center py-3 bg-white/5 rounded border border-white/10">
                    <span className="text-gray-500 text-xs block mb-1">KÉPLET</span>
                    <span className="font-orbitron text-xl text-white">F<sub>s</sub> = m · g</span>
                </div>

                {/* Sliders */}
                <div className="space-y-6">
                    {/* Mass Slider */}
                    <div>
                        <div className="flex justify-between text-sm font-bold mb-2 text-white">
                            <span>TÖMEG (m)</span>
                            <span className="text-neon whitespace-nowrap">{mass} kg</span>
                        </div>
                        <input 
                            type="range" 
                            min="10" max="500" step="10"
                            value={mass}
                            onChange={(e) => {
                                setMass(Number(e.target.value));
                                setFeedback({ type: 'neutral', msg: '' });
                            }}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon"
                        />
                    </div>

                    {/* Gravity Slider */}
                    <div>
                        <div className="flex justify-between text-sm font-bold mb-2 text-white">
                            <span>GRAVITÁCIÓ (g)</span>
                            <span className="text-alert whitespace-nowrap">{gravity} m/s²</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" max="25" step="1"
                            value={gravity}
                            onChange={(e) => {
                                setGravity(Number(e.target.value));
                                setFeedback({ type: 'neutral', msg: '' });
                            }}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-alert"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                            <span>Hold (~1.6)</span>
                            <span>Föld (~9.8)</span>
                            <span>Jupiter (~24.8)</span>
                        </div>
                    </div>
                </div>

                {/* Input & Check */}
                <div className="pt-6 border-t border-white/10 mt-auto">
                     <label className="block text-xs uppercase text-gray-400 mb-2">Számított Súlyerő (Newton):</label>
                     <div className="flex gap-2">
                         <input 
                            type="number" 
                            placeholder="?"
                            value={userGuess}
                            onChange={(e) => setUserGuess(e.target.value)}
                            className="flex-1 min-w-0 bg-black border border-gray-600 rounded p-3 text-white font-orbitron focus:border-neon outline-none"
                         />
                         <button 
                            onClick={checkAnswer}
                            className="bg-neon text-black font-bold font-orbitron px-4 rounded hover:bg-white transition-colors whitespace-nowrap"
                         >
                            ELLENŐRZÉS
                         </button>
                     </div>

                     {/* Feedback Message */}
                     {feedback.msg && (
                         <div className={`mt-4 p-3 rounded text-sm font-bold text-center border animate-fadeIn
                            ${feedback.type === 'success' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 
                              feedback.type === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/50' : ''}
                         `}>
                             {feedback.msg}
                         </div>
                     )}
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default GravitySimulation;