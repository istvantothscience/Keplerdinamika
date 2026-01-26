import React from 'react';
import { Mission } from '../types';
import { SECTORS } from '../constants';

interface MissionSelectorProps {
  currentPoints: number;
  onSelectMission: (mission: Mission) => void;
}

const MissionSelector: React.FC<MissionSelectorProps> = ({ currentPoints, onSelectMission }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <h3 className="text-xl font-orbitron text-neon tracking-wider">
          <span className="mr-2">◈</span> MISSION SECTORS
        </h3>
        <span className="text-xs font-mono text-gray-500 animate-pulse">SYNCING...</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTORS.map((sector) => {
          const isLocked = currentPoints < sector.minPoints;

          return (
            <button
              key={sector.id}
              disabled={isLocked}
              onClick={() => onSelectMission(sector)}
              className={`
                relative p-4 text-left border-l-4 transition-all duration-300 group
                ${isLocked 
                  ? 'bg-gray-900/50 border-gray-700 opacity-60 cursor-not-allowed grayscale' 
                  : 'bg-blue-900/20 border-neon hover:bg-neon/10 hover:shadow-[0_0_15px_rgba(0,242,255,0.2)] hover:border-l-8 cursor-pointer'
                }
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`font-orbitron font-bold text-lg ${isLocked ? 'text-gray-500' : 'text-white'}`}>
                  {sector.id}
                </span>
                {isLocked ? (
                  <span className="text-xs text-red-500 font-mono border border-red-900 px-1 bg-red-900/20">LOCKED</span>
                ) : (
                  <span className="text-xs text-neon font-mono border border-neon px-1 bg-neon/10 animate-pulse">ACTIVE</span>
                )}
              </div>
              
              <h4 className={`font-mono text-md mb-1 ${isLocked ? 'text-gray-600' : 'text-cyan-300'}`}>
                {sector.title}
              </h4>
              <p className="text-xs text-gray-400 line-clamp-2 h-8">
                {sector.description}
              </p>
              
              {isLocked && (
                 <div className="mt-2 text-xs text-alert font-mono">
                   REQUIRED: {sector.minPoints} PTS
                 </div>
              )}

              {/* Decorative corner */}
              {!isLocked && (
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-neon"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MissionSelector;
