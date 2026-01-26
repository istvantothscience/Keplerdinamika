import React from 'react';
import { StudentData, CharacterClass } from '../types';
import { getRankTitle, calculateLevel } from '../constants';

interface CharacterCardProps {
  student: StudentData;
}

const getClassAttributes = (type: CharacterClass) => {
  switch (type) {
    case CharacterClass.SCIENTIST:
      return { int: '+20% LOGIKA', str: '-10% ERŐ', tool: 'Multiméter' };
    case CharacterClass.PILOT:
      return { int: '+20% REFLEX', str: '+5% SEBESSÉG', tool: 'Navigációs Modul' };
    case CharacterClass.WARRIOR:
      return { int: '+20% ERŐ', str: '+10% KITARTÁS', tool: 'Plazmavágó' };
    default:
      return { int: '+5% BALANSZ', str: '+5% BALANSZ', tool: 'Szabvány Egység' };
  }
};

const CharacterCard: React.FC<CharacterCardProps> = ({ student }) => {
  const rank = getRankTitle(student.totalPoints);
  const nextLevel = Math.min(5, calculateLevel(student.totalPoints) + 1);
  const progress = (student.totalPoints % 20) * 5; 
  const attrs = getClassAttributes(student.characterType);

  const imgSrc = `https://placehold.co/300x400/0a0b10/00f2ff?text=${student.characterType.substring(0,2)}\nLVL+${student.level}&font=roboto`;

  return (
    <div className="relative group overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
      {/* Animated Gradient Border Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon/0 via-neon/10 to-neon/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none"></div>

      <div className="flex flex-row h-full">
        {/* Avatar Section */}
        <div className="w-1/3 relative border-r border-white/10 bg-black/20">
           <img 
             src={imgSrc} 
             alt="Profile" 
             className="w-full h-full object-cover opacity-80 mix-blend-screen"
           />
           <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
             <div className="text-[10px] text-neon font-mono text-center animate-pulse">ONLINE</div>
           </div>
        </div>

        {/* Info Section */}
        <div className="w-2/3 p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-2xl font-orbitron text-white uppercase tracking-widest glow-text">
                {student.name}
              </h2>
              <span className="px-2 py-1 bg-neon/10 border border-neon/30 text-neon text-[10px] rounded font-mono">
                LVL {student.level}
              </span>
            </div>
            
            <div className="text-alert font-bold text-sm tracking-wider mb-4 border-b border-white/10 pb-2">
              {rank} // {student.characterType}
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-black/30 p-2 rounded border border-white/5">
                <div className="text-[10px] text-gray-400">SPECIÁLIS</div>
                <div className="text-xs text-cyan-300 font-mono">{attrs.int}</div>
              </div>
              <div className="bg-black/30 p-2 rounded border border-white/5">
                <div className="text-[10px] text-gray-400">ESZKÖZ</div>
                <div className="text-xs text-cyan-300 font-mono">{attrs.tool}</div>
              </div>
            </div>
          </div>

          <div>
             <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-mono">
                <span>XP PROGRESS</span>
                <span>{student.totalPoints} / {(student.level) * 20 + 20}</span>
             </div>
             <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-gradient-to-r from-neon to-blue-500 shadow-[0_0_10px_#00f2ff]"
                 style={{ width: `${student.level === 5 ? 100 : progress}%` }}
               ></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterCard;
