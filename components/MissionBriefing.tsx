import React from 'react';
import { Mission } from '../types';

interface MissionBriefingProps {
  mission: Mission;
  onClose: () => void;
}

const MissionBriefing: React.FC<MissionBriefingProps> = ({ mission, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-black border-2 border-neon rounded-lg shadow-[0_0_50px_rgba(0,242,255,0.3)] overflow-hidden flex flex-col md:flex-row h-[80vh]">
        
        {/* Background Grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

        {/* Left Column: Visuals */}
        <div className="md:w-1/2 relative border-r border-white/10 bg-gray-900">
          <img 
            src={mission.imageUrl} 
            alt={mission.title}
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50"></div>
          
          <div className="absolute top-4 left-4">
             <h2 className="text-3xl font-orbitron text-white glow-text">{mission.id}</h2>
             <div className="text-neon text-sm font-mono tracking-widest">{mission.title.toUpperCase()}</div>
          </div>
        </div>

        {/* Right Column: Computer Interface */}
        <div className="md:w-1/2 flex flex-col bg-black/90 relative">
          
          {/* Header */}
          <div className="p-4 border-b border-neon/30 flex justify-between items-center bg-neon/5">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="font-mono text-neon text-xs">INCOMING TRANSMISSION...</div>
            <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
          </div>

          {/* Chatbot Story Content */}
          <div className="flex-1 p-6 overflow-y-auto font-mono">
            <div className="mb-4 flex items-start gap-3">
               <div className="w-10 h-10 rounded border border-neon bg-black flex items-center justify-center text-xl">🤖</div>
               <div className="bg-neon/10 border border-neon/30 p-4 rounded-tr-none rounded-lg text-neon text-sm leading-relaxed shadow-[0_0_10px_rgba(0,242,255,0.1)]">
                 <p className="mb-2 font-bold text-xs uppercase tracking-wider text-white">Fedélzeti Számítógép:</p>
                 <p>{mission.story}</p>
               </div>
            </div>
            
            <div className="mt-8 border-l-2 border-alert pl-4 ml-4">
              <h3 className="text-alert font-orbitron text-sm mb-1">KÜLDETÉS CÉLJA:</h3>
              <p className="text-gray-400 text-xs">{mission.description}</p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-6 border-t border-white/10 bg-white/5">
             <a 
               href={mission.classroomLink} 
               target="_blank" 
               rel="noreferrer"
               className="block w-full text-center py-4 bg-neon hover:bg-white text-black font-orbitron font-bold tracking-widest text-lg rounded shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all hover:scale-[1.02]"
             >
               CLASSROOM MEGNYITÁSA
             </a>
             <p className="text-center text-[10px] text-gray-500 mt-3 font-mono">
               FIGYELEM: A küldetés elhagyása után a valóság újra unalmas lehet.
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MissionBriefing;