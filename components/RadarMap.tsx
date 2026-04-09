import React from 'react';
import { Mission } from '../types';
import { SECTORS } from '../constants';

interface RadarMapProps {
  currentPoints: number;
  onSelectMission: (mission: Mission) => void;
}

const RadarMap: React.FC<RadarMapProps> = ({ currentPoints, onSelectMission }) => {
  // --- PLAYER POSITION CALCULATION ---
  // Find which sector segment the player is currently traversing
  let activeIndex = 0;
  for (let i = 0; i < SECTORS.length; i++) {
    if (currentPoints >= SECTORS[i].minPoints) {
      activeIndex = i;
    }
  }

  const currentSector = SECTORS[activeIndex];
  const nextSector = SECTORS[activeIndex + 1];

  let segmentProgress = 0;
  if (nextSector) {
    const range = nextSector.minPoints - currentSector.minPoints;
    const diff = currentPoints - currentSector.minPoints;
    // Calculate how far we are between two missions (0.0 to 1.0)
    segmentProgress = Math.min(Math.max(diff / range, 0), 1);
  }

  // Calculate Angle
  const totalItems = SECTORS.length;
  // Base angle for current mission
  const startAngle = (activeIndex / totalItems) * Math.PI * 2 - (Math.PI / 2);
  // Angle for next mission (full circle wrap logic handled by math)
  const endAngle = ((activeIndex + 1) / totalItems) * Math.PI * 2 - (Math.PI / 2);
  
  // Interpolated Angle for the dot
  const playerAngle = startAngle + (endAngle - startAngle) * segmentProgress;
  
  // Radius calculation: Spiral out from 30% to 75% as they progress level to level
  // This ensures the dot gets closer to the outer "Test/Project" rings as they advance.
  const maxRadiusPercent = 75;
  const minRadiusPercent = 35;
  const globalProgress = Math.min(currentPoints / 100, 1);
  const playerRadius = minRadiusPercent + (globalProgress * (maxRadiusPercent - minRadiusPercent));
  
  const cx = 50 + Math.cos(playerAngle) * playerRadius;
  const cy = 50 + Math.sin(playerAngle) * playerRadius;

  return (
    <div className="relative w-full aspect-square max-w-[600px] mx-auto bg-black rounded-full border-4 border-gray-800 shadow-[0_0_80px_rgba(0,242,255,0.15)] overflow-hidden">
      {/* Background Grid - Polar Coordinates */}
      <div className="absolute inset-0 rounded-full border border-neon/20 scale-[0.85]"></div>
      <div className="absolute inset-0 rounded-full border border-neon/10 scale-[0.60]"></div>
      <div className="absolute inset-0 rounded-full border border-neon/5 scale-[0.35]"></div>
      
      {/* Radial Lines */}
      {SECTORS.map((_, i) => (
        <div key={i} className="absolute top-1/2 left-1/2 w-full h-px bg-neon/10 origin-left" style={{ transform: `rotate(${(i / totalItems) * 360 - 90}deg)` }}></div>
      ))}

      {/* Crosshairs */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-neon/30 shadow-[0_0_10px_#00f2ff]"></div>
      <div className="absolute left-0 right-0 top-1/2 h-px bg-neon/30 shadow-[0_0_10px_#00f2ff]"></div>
      
      {/* Scanning Line Animation - Enhanced */}
      <div className="absolute inset-0 origin-center animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(0,242,255,0.4)_360deg)] opacity-50 z-0"></div>

      {/* Sectors / Missions Nodes */}
      {SECTORS.map((sector, index) => {
        const sAngle = (index / totalItems) * Math.PI * 2 - (Math.PI / 2);
        
        // Main missions are on the main ring (70%), Special ones slightly further (85%)
        const dist = sector.type === 'main' ? 70 : 85; 
        
        const sx = 50 + Math.cos(sAngle) * (dist / 2);
        const sy = 50 + Math.sin(sAngle) * (dist / 2);
        
        const isLocked = currentPoints < sector.minPoints;
        const isPassed = currentPoints >= sector.minPoints;
        
        // Colors based on type
        let borderColor = 'border-neon';
        let glowColor = 'shadow-cyan-500';
        let textColor = 'text-neon';
        
        if (sector.type === 'exam') {
            borderColor = 'border-red-500';
            glowColor = 'shadow-red-500';
            textColor = 'text-red-500';
        } else if (sector.type === 'project') {
            borderColor = 'border-yellow-500';
            glowColor = 'shadow-yellow-500';
            textColor = 'text-yellow-500';
        }

        return (
          <div
            key={sector.id}
            className="absolute flex flex-col items-center z-20 w-24 h-24 justify-center pointer-events-none"
            style={{ left: `${sx}%`, top: `${sy}%`, transform: 'translate(-50%, -50%)' }}
          >
            {/* Connection Line to center (faint) */}
            {!isLocked && (
                <div className={`absolute w-1 h-1 bg-${textColor.split('-')[1]}-500 rounded-full opacity-50`}></div>
            )}

            <button
              onClick={() => !isLocked && onSelectMission(sector)}
              className={`
                w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 group relative pointer-events-auto active:scale-90
                ${isLocked 
                  ? 'bg-gray-900/80 border border-gray-700 cursor-not-allowed grayscale opacity-50' 
                  : `bg-black/80 border-2 ${borderColor} cursor-pointer hover:scale-110 hover:bg-white/10 ${isPassed ? 'shadow-[0_0_15px_' + (sector.type==='exam'?'#ef4444':sector.type==='project'?'#eab308':'#06b6d4') + ']' : ''}`
                }
              `}
            >
              {/* Ping effect for next available mission */}
              {!isLocked && !isPassed && (
                <div className={`absolute inset-0 rounded-full border ${borderColor} animate-ping opacity-50`}></div>
              )}
              
              <span className={`text-[10px] md:text-xs font-orbitron font-bold ${isLocked ? 'text-gray-600' : 'text-white'}`}>
                {sector.type === 'exam' ? 'VIZS' : sector.type === 'project' ? 'PRJ' : index + 1}
              </span>
            </button>
            
            {/* Label */}
            <div className={`
              mt-1 text-[8px] font-mono tracking-widest px-1 py-0.5 rounded text-center whitespace-nowrap backdrop-blur-md
              ${isLocked ? 'text-gray-600 bg-black/50' : `${textColor} bg-black/80 border border-white/10`}
            `}>
               {sector.type === 'exam' ? 'ZÁRÓVIZSGA' : sector.type === 'project' ? 'PROJEKT' : 'SZEKTOR ' + (index+1)}
            </div>
          </div>
        );
      })}

      {/* Player Dot */}
      <div 
        className="absolute w-4 h-4 -ml-2 -mt-2 z-30 transition-all duration-700 ease-out"
        style={{ left: `${cx}%`, top: `${cy}%` }}
      >
        <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75"></div>
        <div className="absolute inset-0 bg-green-400 rounded-full border-2 border-white shadow-[0_0_20px_#4ade80]"></div>
      </div>
      
      {/* Center Core */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black border border-neon/50 rounded-full flex items-center justify-center shadow-[0_0_30px_#00f2ff] z-10">
          <div className="w-2 h-2 bg-neon rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default RadarMap;