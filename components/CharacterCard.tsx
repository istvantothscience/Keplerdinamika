import React, { useState, useEffect } from 'react';
import { StudentData, CharacterClass } from '../types';
import { getRankTitle, calculateLevel } from '../constants';

interface CharacterCardProps {
  student: StudentData;
}

const getClassAttributes = (type: CharacterClass) => {
  switch (type) {
    case CharacterClass.SCIENTIST:
      return { specLabel: 'SPECIÁLIS KÉPESSÉG', specVal: '+20% LOGIKA', toolLabel: 'ELSŐDLEGES ESZKÖZ', toolVal: 'Multiméter' };
    case CharacterClass.PILOT:
      return { specLabel: 'SPECIÁLIS KÉPESSÉG', specVal: '+20% REFLEX', toolLabel: 'ELSŐDLEGES ESZKÖZ', toolVal: 'Navigációs Modul' };
    case CharacterClass.WARRIOR:
      return { specLabel: 'SPECIÁLIS KÉPESSÉG', specVal: '+20% ERŐ', toolLabel: 'ELSŐDLEGES ESZKÖZ', toolVal: 'Plazmavágó' };
    default:
      return { specLabel: 'KÉPESSÉG', specVal: 'BALANSZ', toolLabel: 'ESZKÖZ', toolVal: 'Szabvány Egység' };
  }
};

const CharacterCard: React.FC<CharacterCardProps> = ({ student }) => {
  const rank = getRankTitle(student.totalPoints);
  const nextLevel = Math.min(5, calculateLevel(student.totalPoints) + 1);
  const progress = (student.totalPoints % 20) * 5; 
  const attrs = getClassAttributes(student.characterType);

  // LOGIC: Image Evolution
  // We use DiceBear 'adventurer' style which looks like RPG/Sci-Fi characters with gear.
  // Different seeds for different levels ensure the character "changes" (evolves).
  const getFallbackSeed = (type: CharacterClass, level: number) => {
      // Custom seeds chosen to look distinct for levels
      const base = type === CharacterClass.PILOT ? 'Felix' : type === CharacterClass.SCIENTIST ? 'Avery' : 'Gizmo';
      return `${base}${level * 123}`; 
  };

  const localImageSrc = `/img/${student.characterType}_${student.level}.png`;
  const fallbackImageSrc = `https://api.dicebear.com/7.x/adventurer/svg?seed=${getFallbackSeed(student.characterType, student.level)}&backgroundColor=b6e3f4`;

  const [imgSrc, setImgSrc] = useState(localImageSrc);

  // Reset image source when student data changes (level up)
  useEffect(() => {
    setImgSrc(localImageSrc);
  }, [student.level, student.characterType]);

  const handleImgError = () => {
    if (imgSrc !== fallbackImageSrc) {
      setImgSrc(fallbackImageSrc);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto font-mono">
        <div className="flex flex-col md:flex-row gap-6">
            
            {/* Left Column: Avatar Frame */}
            <div className="md:w-1/3 flex flex-col gap-4">
                <div className="relative aspect-square w-full bg-black border-2 border-neon/50 rounded-lg shadow-[0_0_20px_rgba(0,242,255,0.1)] overflow-hidden group">
                    {/* Level Badge inside Image */}
                    <div className="absolute top-4 right-4 z-10">
                        <div className="bg-black/80 border border-neon text-neon text-xs font-orbitron px-2 py-1 rounded">
                            LVL {student.level}
                        </div>
                    </div>
                    
                    {/* Character Image */}
                    <img 
                        src={imgSrc} 
                        onError={handleImgError}
                        alt="Character" 
                        className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Inner Border Effect */}
                    <div className="absolute inset-2 border border-neon/20 pointer-events-none rounded"></div>
                </div>

                {/* System Status Pill */}
                <div className="flex justify-center">
                    <div className="px-4 py-1 bg-black/60 border border-green-500/30 rounded-full text-[10px] text-green-500 font-mono tracking-widest uppercase">
                        Rendszer Online
                    </div>
                </div>
            </div>

            {/* Right Column: Stats & Info */}
            <div className="md:w-2/3 flex flex-col justify-between bg-black/40 border border-white/5 rounded-xl p-6 md:p-8 relative backdrop-blur-sm">
                
                {/* Header Info */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200 uppercase tracking-wider mb-2 drop-shadow-[0_0_10px_rgba(0,242,255,0.3)]">
                            {student.name.split(' ')[0]}<br/>
                            <span className="text-white">{student.name.split(' ').slice(1).join(' ')}</span>
                        </h2>
                        <div className="text-alert font-bold text-sm md:text-base tracking-[0.2em] font-mono uppercase mt-2">
                            {rank} // {student.characterType}
                        </div>
                    </div>

                    {/* ID Badge */}
                    <div className="hidden md:block">
                        <div className="bg-cyan-900/20 border border-neon text-neon px-4 py-2 rounded text-xs font-mono shadow-[0_0_10px_rgba(0,242,255,0.1)]">
                            ID: K-452-<br/>
                            <span className="text-lg font-bold text-white">{student.totalPoints}</span>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8"></div>

                {/* Attributes Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="bg-black/60 border border-white/10 rounded p-4 relative overflow-hidden group hover:border-neon/30 transition-colors">
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{attrs.specLabel}</div>
                        <div className="text-lg text-white font-orbitron tracking-wide group-hover:text-neon transition-colors">{attrs.specVal}</div>
                    </div>
                    <div className="bg-black/60 border border-white/10 rounded p-4 relative overflow-hidden group hover:border-neon/30 transition-colors">
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{attrs.toolLabel}</div>
                        <div className="text-lg text-cyan-400 font-orbitron tracking-wide">{attrs.toolVal}</div>
                    </div>
                </div>

                {/* XP Progress Bar */}
                <div className="mt-auto">
                    <div className="flex justify-between text-xs text-gray-500 mb-2 font-mono uppercase tracking-widest">
                        <span>XP Progresszió</span>
                        <span>{student.totalPoints} / {(student.level) * 20 + 20} XP</span>
                    </div>
                    <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-neon shadow-[0_0_10px_#00f2ff]"
                            style={{ width: `${student.level === 5 ? 100 : progress}%` }}
                        ></div>
                    </div>
                    <div className="text-[10px] text-gray-600 mt-2 font-mono text-right uppercase tracking-wider">
                        Következő Szint: {nextLevel}
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

export default CharacterCard;