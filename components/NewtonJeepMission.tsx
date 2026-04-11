import React, { useState, useEffect, useRef } from 'react';

interface NewtonJeepMissionProps {
  onClose: () => void;
  onMissionComplete: (missionId: string, points: number) => void;
}

const NewtonJeepMission: React.FC<NewtonJeepMissionProps> = ({ onClose, onMissionComplete }) => {
  // Simulation State
  const [force, setForce] = useState<number>(500);
  const [mass, setMass] = useState<number>(1000);
  const acceleration = force / mass;

  // Animation State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const spiderOffsetRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ground scrolling speed based on acceleration
      const speed = acceleration * 5;
      offsetRef.current += speed;

      // Draw Martian Background
      ctx.fillStyle = '#0a0505'; // Very dark red/black
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const drawMountains = (yOffset: number, amplitude: number, frequency: number, parallax: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        for (let x = 0; x <= canvas.width; x += 10) {
          const absoluteX = x + offsetRef.current * parallax;
          const y = yOffset - Math.sin(absoluteX * frequency) * amplitude - Math.sin(absoluteX * frequency * 2.1) * (amplitude * 0.5);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.fill();
      };

      drawMountains(canvas.height / 2 + 20, 80, 0.005, 0.2, '#1a0a0a'); // Distant
      drawMountains(canvas.height / 2 + 40, 50, 0.01, 0.5, '#2a1010'); // Mid

      // Ground
      ctx.fillStyle = '#3a1515';
      ctx.fillRect(0, canvas.height / 2 + 50, canvas.width, canvas.height / 2 - 50);

      // Ground lines for speed effect
      ctx.strokeStyle = '#5a2525';
      ctx.lineWidth = 2;
      for (let i = -100; i < canvas.width + 100; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i - (offsetRef.current % 50), canvas.height / 2 + 50);
        ctx.lineTo(i - (offsetRef.current % 50) - 100, canvas.height);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2 + 50);
      ctx.lineTo(canvas.width, canvas.height / 2 + 50);
      ctx.stroke();

      // Spider Logic (Chasing)
      // Spider tries to catch up, but high acceleration keeps it at bay
      const targetSpiderX = Math.max(20, 150 - acceleration * 30);
      spiderOffsetRef.current += (targetSpiderX - spiderOffsetRef.current) * 0.05;
      
      const spiderX = spiderOffsetRef.current;
      const spiderY = canvas.height / 2 + 30 + Math.sin(Date.now() / 100) * 10; // Pulsating/bobbing

      // Draw Alien Spider (Realistic, Glowing, 7 legs)
      ctx.save();
      ctx.translate(spiderX, spiderY);
      
      // Shadow
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(0, 255, 102, 0.4)'; // Greenish glow
      
      // Abdomen
      ctx.fillStyle = '#0a1a10'; // Dark green/black
      ctx.beginPath();
      ctx.ellipse(-12, 0, 20, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Glowing pattern on abdomen
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-25, 0);
      ctx.lineTo(-5, 0);
      ctx.moveTo(-15, -8);
      ctx.lineTo(-15, 8);
      ctx.stroke();
      
      // Cephalothorax
      ctx.fillStyle = '#112215';
      ctx.beginPath();
      ctx.ellipse(12, 0, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Multiple Alien Eyes (glowing green/cyan)
      ctx.fillStyle = '#00ff66';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ff66';
      ctx.beginPath();
      ctx.arc(18, -4, 3, 0, Math.PI * 2);
      ctx.arc(18, 4, 3, 0, Math.PI * 2);
      ctx.arc(22, 0, 2, 0, Math.PI * 2);
      ctx.arc(14, -8, 2, 0, Math.PI * 2);
      ctx.arc(14, 8, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Legs (7 legs, jointed, glowing tips/joints)
      const drawLeg = (side: number, index: number, xOffset: number, yOffset: number, length1: number, length2: number, baseAngle: number) => {
        const time = Date.now() / 150;
        // Alternate leg movement
        const moveOffset = (index % 2 === 0) ? time : time + Math.PI;
        const legAngle = baseAngle + Math.sin(moveOffset) * 0.3;
        const kneeAngle = legAngle + (side * 0.8) + Math.cos(moveOffset) * 0.4;
        
        const kneeX = xOffset + Math.cos(legAngle) * length1;
        const kneeY = yOffset + Math.sin(legAngle) * length1;
        const footX = kneeX + Math.cos(kneeAngle) * length2;
        const footY = kneeY + Math.sin(kneeAngle) * length2;

        // Draw leg segments (dark base)
        ctx.strokeStyle = '#0a1a10';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(xOffset, yOffset);
        ctx.lineTo(kneeX, kneeY);
        ctx.lineTo(footX, footY);
        ctx.stroke();

        // Glowing inner line
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(xOffset, yOffset);
        ctx.lineTo(kneeX, kneeY);
        ctx.lineTo(footX, footY);
        ctx.stroke();
        
        // Glowing foot
        ctx.fillStyle = '#00ff66';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#00ff66';
        ctx.beginPath();
        ctx.arc(footX, footY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      };

      // Right legs (side = 1) - 4 legs
      drawLeg(1, 0, 12, 6, 22, 28, Math.PI * 0.1);
      drawLeg(1, 1, 6, 8, 25, 32, Math.PI * 0.3);
      drawLeg(1, 2, 0, 8, 25, 32, Math.PI * 0.5);
      drawLeg(1, 3, -6, 6, 22, 28, Math.PI * 0.7);

      // Left legs (side = -1) - 3 legs (missing one to make it 7)
      drawLeg(-1, 0, 12, -6, 22, 28, -Math.PI * 0.1);
      drawLeg(-1, 1, 6, -8, 25, 32, -Math.PI * 0.3);
      // Missing middle-left leg to make it the "Hétlábú Iszonyat" (Seven-Legged Horror)
      drawLeg(-1, 3, -6, -6, 22, 28, -Math.PI * 0.7);

      ctx.restore();

      // Draw Jeep (Neon Cyan)
      const jeepX = canvas.width / 2;
      const jeepY = canvas.height / 2 + 35;
      
      ctx.save();
      ctx.translate(jeepX, jeepY);
      
      // Force Vector Arrow (Forward)
      const arrowLength = (force / 1000) * 150;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f2ff';
      ctx.strokeStyle = '#00f2ff';
      ctx.fillStyle = '#00f2ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(40, -10);
      ctx.lineTo(40 + arrowLength, -10);
      ctx.stroke();
      // Arrow head
      ctx.beginPath();
      ctx.moveTo(40 + arrowLength, -10);
      ctx.lineTo(40 + arrowLength - 15, -20);
      ctx.lineTo(40 + arrowLength - 15, 0);
      ctx.fill();

      // Jeep Body (Bulkiness based on mass)
      const jeepScale = 0.8 + (mass / 2000) * 0.6;
      ctx.scale(jeepScale, jeepScale);
      
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f2ff';
      ctx.fillStyle = '#00f2ff';
      
      // More realistic car shape
      ctx.beginPath();
      ctx.moveTo(-35, -10);
      ctx.lineTo(35, -10); // Bottom chassis
      ctx.lineTo(35, -20); // Front bumper
      ctx.lineTo(15, -25); // Hood
      ctx.lineTo(5, -40);  // Windshield
      ctx.lineTo(-20, -40); // Roof
      ctx.lineTo(-35, -25); // Rear window
      ctx.fill();
      
      // Windows
      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(5, -35);
      ctx.lineTo(-15, -35);
      ctx.lineTo(-20, -25);
      ctx.fill();
      
      // Wheels
      ctx.fillStyle = '#111';
      ctx.strokeStyle = '#00f2ff';
      ctx.lineWidth = 3;
      
      const drawWheel = (wx: number, wy: number) => {
        ctx.beginPath();
        ctx.arc(wx, wy, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Wheel spokes rotating
        ctx.save();
        ctx.translate(wx, wy);
        ctx.rotate(offsetRef.current * 0.2);
        ctx.beginPath();
        ctx.moveTo(-12, 0); ctx.lineTo(12, 0);
        ctx.moveTo(0, -12); ctx.lineTo(0, 12);
        ctx.stroke();
        ctx.restore();
      };
      
      drawWheel(-20, -5);
      drawWheel(20, -5);

      ctx.restore();

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [force, mass, acceleration]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#050505] overflow-y-auto text-cyan-400 font-mono selection:bg-cyan-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-cyan-500/30 p-4 flex justify-between items-center shadow-[0_0_20px_rgba(0,242,255,0.1)]">
        <div>
          <h2 className="text-2xl font-bold tracking-widest text-cyan-500 drop-shadow-[0_0_8px_rgba(0,242,255,0.8)]">OP-03 // NEWTON-1 MOCSÁRJÁRÓ</h2>
          <div className="text-xs text-cyan-700">DINAMIKA ALAPTÖRVÉNYE SZIMULÁTOR</div>
        </div>
        <button 
            onClick={onClose}
            className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-colors font-bold rounded shadow-[0_0_10px_rgba(255,0,0,0.3)]"
        >
            BEZÁRÁS [X]
        </button>
      </div>

      <div className="container mx-auto max-w-6xl p-6 space-y-8 pb-20">
        
        {/* Top Panel: Simulation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Controls */}
          <div className="bg-[#0a0f0a] border border-cyan-500/50 p-6 rounded-lg shadow-[0_0_15px_rgba(0,242,255,0.1)] flex flex-col gap-6">
            <h3 className="text-xl font-bold border-b border-cyan-500/30 pb-2">VEZÉRLŐPULT</h3>
            
            <div className="space-y-2">
              <label className="flex justify-between text-sm">
                <span>Húzóerő (F) [Newton]</span>
                <span className="font-bold text-cyan-300">{force} N</span>
              </label>
              <input 
                type="range" 
                min="100" max="1000" step="100"
                value={force}
                onChange={(e) => setForce(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex justify-between text-sm">
                <span>Dzsip Tömege (m) [kg]</span>
                <span className="font-bold text-cyan-300">{mass} kg</span>
              </label>
              <input 
                type="range" 
                min="500" max="2000" step="100"
                value={mass}
                onChange={(e) => setMass(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* Stats Box */}
            <div className="mt-auto bg-black border border-cyan-500/30 p-4 rounded">
              <h4 className="text-xs text-cyan-600 mb-2">FEDÉLZETI STATISZTIKA</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">F:</div><div className="text-right">{force} N</div>
                <div className="text-gray-400">m:</div><div className="text-right">{mass} kg</div>
                <div className="col-span-2 border-t border-cyan-900 my-1"></div>
                <div className="text-cyan-300 font-bold">Gyorsulás (a):</div>
                <div className="text-right text-cyan-300 font-bold text-lg drop-shadow-[0_0_5px_rgba(0,242,255,0.5)]">
                  {acceleration.toFixed(2)} m/s²
                </div>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="lg:col-span-2 bg-black border border-cyan-500/50 rounded-lg overflow-hidden relative shadow-[0_0_20px_rgba(0,242,255,0.15)] flex flex-col aspect-[2/1] max-h-[60vh]">
            <div className="absolute top-2 left-2 text-xs text-cyan-800 z-10">KAMERA: KÜLSŐ // SZEKTOR: KEPLER-452B MOCSÁR</div>
            <canvas ref={canvasRef} width={800} height={400} className="w-full h-full object-cover" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default NewtonJeepMission;