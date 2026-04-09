import React from 'react';
import { StudentData, CharacterClass } from '../types';
import { getRankTitle, calculateLevel } from '../constants';

interface CharacterCardProps {
  student: StudentData;
  onBack: () => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ student, onBack }) => {
  const rank = getRankTitle(student.totalPoints);
  const nextLevel = Math.min(5, calculateLevel(student.totalPoints) + 1);
  const progress = (student.totalPoints % 20) * 5; 
  const nextLevelXP = (student.level) * 20 + 20;

  // Use DiceBear as fallback if local image missing
  const avatarUrl = `/img/${student.characterType}_${student.level}.png`;
  const fallbackUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${student.characterType}${student.level}`;

  return (
    <div className="min-h-screen bg-[#050505] p-4 flex flex-col items-center relative font-mono">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

        {/* Top Button */}
        <div className="w-full flex justify-center mb-8 relative z-20">
             <button 
                onClick={onBack}
                className="px-8 py-3 bg-transparent border border-neon text-neon hover:bg-neon hover:text-black transition-all font-bold font-orbitron rounded uppercase tracking-widest shadow-[0_0_15px_rgba(0,242,255,0.2)]"
            >
                VISSZA A PARANCSNOKI HÍDRA
            </button>
        </div>

        {/* Main Grid Container */}
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. LEFT COLUMN: CHARACTER PROFILE */}
            <div className="lg:col-span-1 border-2 border-neon rounded-2xl p-6 bg-black/60 shadow-[0_0_20px_rgba(0,242,255,0.1)] flex flex-col items-center justify-between min-h-[400px]">
                
                {/* Avatar Circle */}
                <div className="relative w-48 h-48 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-neon/30 animate-pulse"></div>
                    <div className="w-full h-full rounded-full border-2 border-neon overflow-hidden bg-black shadow-[0_0_30px_rgba(0,242,255,0.3)]">
                        <img 
                            src={avatarUrl} 
                            onError={(e) => e.currentTarget.src = fallbackUrl}
                            alt="Avatar" 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                    {/* Class Icon Overlay */}
                    <div className="absolute -bottom-2 -right-2 bg-black border border-neon p-2 rounded-lg">
                        <span className="text-2xl">🛡️</span>
                    </div>
                </div>

                {/* Name & Class */}
                <div className="text-center w-full space-y-2 mb-8">
                    <h2 className="text-3xl font-orbitron text-neon tracking-widest uppercase">{student.name}</h2>
                    <div className="text-gray-400 font-mono uppercase tracking-[0.2em] text-sm">{student.characterType}</div>
                </div>

                {/* Stats Block */}
                <div className="w-full space-y-4">
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded border border-white/10">
                        <span className="text-xs uppercase text-gray-500">RANG</span>
                        <span className="font-orbitron text-white tracking-widest">{rank}</span>
                    </div>
                    
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded border border-white/10">
                         <span className="text-xs uppercase text-gray-500">SZINT</span>
                         <span className="font-orbitron text-alert tracking-widest">LVL {student.level}</span>
                    </div>

                    <div className="bg-neon/10 border border-neon p-3 rounded">
                        <div className="flex justify-between text-neon font-bold font-orbitron mb-1">
                            <span>ÖSSZPONTSZÁM</span>
                            <span>{student.totalPoints} PT</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-2">
                        <div className="flex justify-between text-[10px] text-gray-500 mb-1 uppercase">
                            <span>Következő: {calculateLevel(student.totalPoints) < 5 ? 'Szintlépés' : 'Max Szint'}</span>
                            <span>{nextLevelXP} PT</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div style={{ width: `${student.level === 5 ? 100 : progress}%` }} className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 shadow-[0_0_10px_orange]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. RIGHT COLUMN: SCORES GRID */}
            <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* TOP: LESSONS (Órai Munka) */}
                <div className="bg-black/40 border border-neon rounded-2xl p-6 shadow-[0_0_10px_rgba(0,242,255,0.05)] relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6 border-b border-neon/30 pb-2">
                        <h3 className="text-xl font-orbitron text-neon flex items-center gap-2">
                            <span>📖</span> ÓRAI MUNKA
                        </h3>
                        <span className="font-mono text-alert font-bold">
                            {student.scores.lessons.reduce((a, b) => a + b, 0)} PT
                        </span>
                    </div>
                    <div className="grid grid-cols-6 gap-4">
                        {student.scores.lessons.map((score, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-2">
                                <span className="text-[10px] text-gray-500 font-mono">L{idx+1}</span>
                                <div className={`
                                    w-full aspect-square flex items-center justify-center rounded border
                                    ${score > 0 ? 'border-neon text-white bg-neon/10 shadow-[0_0_10px_rgba(0,242,255,0.2)]' : 'border-gray-700 text-gray-600 bg-black'}
                                `}>
                                    <span className="font-orbitron font-bold text-lg">{score > 0 ? score : 'Ø'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* MIDDLE: HOMEWORK (Házi Feladat) */}
                <div className="bg-black/40 border border-alert rounded-2xl p-6 shadow-[0_0_10px_rgba(255,140,0,0.05)] relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6 border-b border-alert/30 pb-2">
                        <h3 className="text-xl font-orbitron text-alert flex items-center gap-2">
                            <span>📄</span> HÁZI FELADAT
                        </h3>
                        <span className="font-mono text-neon font-bold">
                            {student.scores.homework.reduce((a, b) => a + b, 0)} PT
                        </span>
                    </div>
                    <div className="grid grid-cols-6 gap-4">
                        {student.scores.homework.map((score, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-2">
                                <span className="text-[10px] text-gray-500 font-mono">H{idx+1}</span>
                                <div className={`
                                    w-full aspect-square flex items-center justify-center rounded border
                                    ${score > 0 ? 'border-alert text-white bg-alert/10 shadow-[0_0_10px_rgba(255,140,0,0.2)]' : 'border-gray-700 text-gray-600 bg-black'}
                                `}>
                                    <span className="font-orbitron font-bold text-lg">{score > 0 ? score : 'Ø'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* BOTTOM: PROJECT & EXAM */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Project */}
                    <div className="bg-black/40 border border-neon rounded-2xl p-6 flex flex-col justify-between">
                         <div className="flex items-center gap-2 mb-2">
                             <span className="text-neon">⚗️</span>
                             <span className="font-orbitron text-gray-300 text-sm">PROJEKT</span>
                         </div>
                         <div className="text-4xl font-orbitron text-neon mt-2">
                             {student.scores.project > 0 ? `${student.scores.project} PT` : 'Ø PT'}
                         </div>
                    </div>

                    {/* Test */}
                    <div className="bg-black/40 border border-alert rounded-2xl p-6 flex flex-col justify-between">
                         <div className="flex items-center gap-2 mb-2">
                             <span className="text-alert">🏆</span>
                             <span className="font-orbitron text-gray-300 text-sm">TESZT</span>
                         </div>
                         <div className="text-4xl font-orbitron text-alert mt-2">
                             {student.scores.exam > 0 ? `${student.scores.exam} PT` : 'Ø PT'}
                         </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

export default CharacterCard;