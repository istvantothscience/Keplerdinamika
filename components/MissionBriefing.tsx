import React from 'react';
import { Mission } from '../types';

interface MissionBriefingProps {
  mission: Mission;
  onClose: () => void;
  onOpenSimulation?: () => void; // New prop
  onOpenQuiz?: () => void;
}

const MissionBriefing: React.FC<MissionBriefingProps> = ({ mission, onClose, onOpenSimulation, onOpenQuiz }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl bg-black border-2 border-neon rounded-lg shadow-[0_0_50px_rgba(0,242,255,0.3)] overflow-hidden flex flex-col md:flex-row h-[85vh]">
        
        {/* Background Grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

        {/* Left Column: Visuals (Smaller width now: w-2/5) */}
        <div className="md:w-2/5 relative border-r border-white/10 bg-black overflow-hidden group hidden md:flex items-center justify-center">
          <img 
            src={mission.imageUrl} 
            alt={mission.title}
            className="w-full h-full object-contain opacity-80"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50"></div>
          
          {/* Scanline Effect (Static Grid) */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none z-10"></div>
          
          {/* Moving Scan Bar Animation */}
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-transparent via-neon/10 to-transparent h-[20%] w-full animate-scan opacity-30"></div>

          <div className="absolute top-4 left-4 z-20">
             <h2 className="text-3xl font-orbitron text-white glow-text drop-shadow-md">{mission.id}</h2>
             <div className="text-neon text-sm font-mono tracking-widest bg-black/60 px-2 inline-block rounded">{mission.title.toUpperCase()}</div>
          </div>
        </div>

        {/* Right Column: Computer Interface (Wider width now: w-3/5) */}
        <div className="w-full md:w-3/5 flex flex-col bg-black/90 relative">
          
          {/* Header */}
          <div className="p-4 border-b border-neon/30 flex justify-between items-center bg-neon/5 shrink-0">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="font-mono text-neon text-xs">INCOMING TRANSMISSION...</div>
            <button onClick={onClose} className="text-gray-500 hover:text-white px-2">✕</button>
          </div>

          {/* Chatbot Story Content */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto font-mono scrollbar-thin scrollbar-thumb-neon/20">
            <div className="mb-6 flex items-start gap-4">
               <div className="w-12 h-12 rounded border border-neon bg-black flex items-center justify-center text-2xl shrink-0 shadow-[0_0_15px_rgba(0,242,255,0.2)]">🤖</div>
               <div className="bg-neon/10 border border-neon/30 p-5 rounded-tr-none rounded-lg text-neon shadow-[0_0_10px_rgba(0,242,255,0.1)] w-full">
                 <p className="mb-3 font-bold text-sm uppercase tracking-wider text-white border-b border-neon/20 pb-1">Fedélzeti Számítógép:</p>
                 {/* Increased Font Size here */}
                 <p className="whitespace-pre-line text-base md:text-lg leading-relaxed text-gray-100">{mission.story}</p>
               </div>
            </div>
            
            <div className="mt-8 border-l-4 border-alert pl-6 ml-6 bg-alert/5 p-4 rounded-r">
              <h3 className="text-alert font-orbitron text-base mb-2">KÜLDETÉS CÉLJA:</h3>
              <p className="text-gray-300 text-sm md:text-base">{mission.description}</p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-6 border-t border-white/10 bg-white/5 shrink-0 flex flex-col md:flex-row gap-4">
             <a 
               href={mission.classroomLink} 
               target="_blank" 
               rel="noreferrer"
               className="flex-1 text-center py-4 bg-neon hover:bg-white text-black font-orbitron font-bold tracking-widest text-lg md:text-xl rounded shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all hover:scale-[1.01] flex items-center justify-center"
             >
               {mission.id === 'TESZT' ? 'MINTA DOLGOZAT' : mission.id === 'PROJEKT' ? 'PROJEKT FELADAT' : ['S01', 'S02', 'S03', 'S04', 'S05', 'S06'].includes(mission.id) ? 'FELADATLAP' : 'CLASSROOM'}
             </a>

             {/* Simulation Button for Sector 3 and 5 */}
             {['S03', 'S05'].includes(mission.id) && onOpenSimulation && (
                <button 
                  onClick={onOpenSimulation}
                  className="flex-1 text-center py-4 bg-alert hover:bg-orange-400 text-black font-orbitron font-bold tracking-widest text-lg md:text-xl rounded shadow-[0_0_20px_rgba(255,140,0,0.4)] transition-all hover:scale-[1.01]"
                >
                  SZIMULÁCIÓ
                </button>
             )}

             {/* Quiz Button for Sector 1 only */}
             {['S01'].includes(mission.id) && onOpenQuiz && (
                <button 
                  onClick={onOpenQuiz}
                  className="flex-1 text-center py-4 bg-purple-500 hover:bg-purple-400 text-black font-orbitron font-bold tracking-widest text-lg md:text-xl rounded shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all hover:scale-[1.01]"
                >
                  ELLENŐRZŐ KVÍZ
                </button>
             )}
          </div>
          
          <p className="text-center text-xs text-gray-500 pb-4 bg-white/5 font-mono border-t-0 -mt-2">
               FIGYELEM: A küldetés elhagyása után a valóság újra unalmas lehet.
          </p>

        </div>
      </div>
    </div>
  );
};

export default MissionBriefing;