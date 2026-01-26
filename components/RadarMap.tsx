import React from 'react';
import { Mission } from '../types';
import { SECTORS } from '../constants';

interface RadarMapProps {
  currentPoints: number;
  onSelectMission: (mission: Mission) => void;
}

const RadarMap: React.FC<RadarMapProps> = ({ currentPoints, onSelectMission }) => {
  // Calculate player position based on points (0-100 scale mapping to angle/radius)
  const maxPoints = 120;
  const progress = Math.min(currentPoints / maxPoints, 1);
  
  // Parametric spiral equation for visual path
  const angle = progress * Math.PI * 2.5 - (Math.PI / 2); // Start at top
  const radius = 20 + (progress * 60); // 20% to 80% of container size
  
  const cx = 50 + Math.cos(angle) * radius * 0.5;
  const cy = 50 + Math.sin(angle) * radius * 0.5;

  return (
    <div className="relative w-full aspect-square max-w-[600px] mx-auto bg-black/40 rounded-full border-2 border-neon/30 shadow-[0_0_50px_rgba(0,242,255,0.1)] overflow-hidden backdrop-blur-md mt-8">
      {/* Radar Grid Lines */}
      <div className="absolute inset-0 rounded-full border border-neon/10 scale-75"></div>
      <div className="absolute inset-0 rounded-full border border-neon/10 scale-50"></div>
      <div className="absolute inset-0 rounded-full border border-neon/10 scale-25"></div>
      
      {/* Crosshairs */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-neon/20"></div>
      <div className="absolute left-0 right-0 top-1/2 h-px bg-neon/20"></div>
      
      {/* Scanning Line Animation */}
      <div className="absolute inset-0 origin-center animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(0,242,255,0.1)_360deg)]"></div>

      {/* Sectors / Missions */}
      {SECTORS.map((sector, index) => {
        // Distribute sectors visually around the center
        const sAngle = (index / SECTORS.length) * Math.PI * 2 - (Math.PI / 2);
        const sRadius = 35 + (index * 5); // Staggered distance
        const sx = 50 + Math.cos(sAngle) * sRadius * 0.5;
        const sy = 50 + Math.sin(sAngle) * sRadius * 0.5;
        
        const isLocked = currentPoints < sector.minPoints;

        return (
          <div
            key={sector.id}
            className="absolute flex flex-col items-center z-20"
            style={{ left: `${sx}%`, top: `${sy}%`, transform: 'translate(-50%, -50%)' }}
          >
            <button
              onClick={() => !isLocked && onSelectMission(sector)}
              className={`
                w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 group relative
                ${isLocked 
                  ? 'bg-gray-800 border-2 border-gray-600 cursor-not-allowed opacity-60 grayscale' 
                  : 'bg-black/60 border-2 border-neon shadow-[0_0_20px_#00f2ff] cursor-pointer hover:scale-110 hover:bg-neon/20'
                }
              `}
            >
              {/* Pulsing effect for active missions */}
              {!isLocked && (
                <div className="absolute inset-0 rounded-full border border-neon animate-ping opacity-30"></div>
              )}
              
              <span className={`text-lg font-orbitron font-bold ${isLocked ? 'text-gray-500' : 'text-white'}`}>
                {index + 1}
              </span>
            </button>
            
            {/* Label Underneath */}
            <div className={`
              mt-2 text-[10px] font-orbitron tracking-widest px-2 py-1 rounded
              ${isLocked ? 'text-gray-500 bg-black/50' : 'text-neon bg-black/80 border border-neon/30 shadow-[0_0_10px_rgba(0,242,255,0.2)]'}
            `}>
              {isLocked ? 'ZÁROLVA' : 'KÜLDETÉS'}
            </div>
          </div>
        );
      })}

      {/* Player Dot */}
      <div 
        className="absolute w-4 h-4 -ml-2 -mt-2 bg-green-500 rounded-full shadow-[0_0_20px_#00ff00] z-10 transition-all duration-1000 ease-out"
        style={{ left: `${cx}%`, top: `${cy}%` }}
      >
        <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div>
      </div>
      
      {/* Coordinates */}
      <div className="absolute bottom-4 right-4 font-mono text-[10px] text-neon/60 bg-black/40 px-2 rounded">
        RADAR_AKTÍV // {currentPoints} PT
      </div>
    </div>
  );
};

export default RadarMap;