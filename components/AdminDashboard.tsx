import React, { useState, useEffect } from 'react';
import { getAllStudents, submitMissionProgress, getAdminSheetLink, resetStudentProgress } from '../services/api';
import { calculateLevel, getRankTitle } from '../constants';
import { CharacterClass, StudentData } from '../types';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  // In a real app, this would fetch from the server. Here we reference the local mock data.
  // We use a state to trigger re-renders when we modify points locally.
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    getAllStudents().then(setStudents);
  }, []);

  const handleGivePoints = async (studentName: string, amount: number) => {
    setLoading(studentName);
    await submitMissionProgress(studentName, amount, 'admin_manual_grant');
    
    // Refresh local view
    const updatedStudents = await getAllStudents();
    setStudents(updatedStudents);
    setLoading(null);
  };

  const handleResetProgress = async (studentName: string) => {
    if (window.confirm(`Biztosan nullázni szeretnéd ${studentName} minden eredményét és küldetését? Ez a művelet nem vonható vissza!`)) {
      setLoading(studentName);
      await resetStudentProgress(studentName);
      
      // Refresh local view
      const updatedStudents = await getAllStudents();
      setStudents(updatedStudents);
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-mono p-6 relative overflow-hidden">
      {/* Background FX */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,_#330000_0%,_transparent_70%)] pointer-events-none opacity-50"></div>
      <div className="fixed inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-end border-b border-red-900/50 pb-4 mb-8">
        <div>
          <h1 className="text-4xl font-orbitron text-red-500 tracking-widest uppercase">Parancsnoki Híd</h1>
          <p className="text-xs text-red-400/50 font-mono">KEPLER-452B // ADMINISZTRÁCIÓS ALRENDSZER</p>
        </div>
        <div className="flex gap-4">
           <a 
             href={getAdminSheetLink()} 
             target="_blank" 
             rel="noreferrer"
             className="px-4 py-2 bg-green-900/20 border border-green-500/50 text-green-500 hover:bg-green-500 hover:text-black transition-colors text-xs font-bold rounded flex items-center gap-2"
           >
             <span>📊</span> GOOGLE SHEET MEGNYITÁSA
           </a>
           <button 
             onClick={onLogout}
             className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-xs font-bold rounded"
           >
             KIJELENTKEZÉS
           </button>
        </div>
      </div>

      {/* Main Content - "The Database" */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Panel: Overview */}
        <div className="lg:col-span-1 space-y-4">
            <div className="bg-black/40 border border-red-900/30 p-4 rounded-lg">
                <h3 className="text-red-500 font-orbitron text-sm mb-2">STÁTUSZ JELENTÉS</h3>
                <div className="space-y-2 text-xs text-gray-400">
                    <div className="flex justify-between">
                        <span>AKTÍV KADÉTOK:</span>
                        <span className="text-white font-bold">{students.length}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>ÁTLAG SZINT:</span>
                        <span className="text-white font-bold">
                            {(students.length > 0 ? students.reduce((acc, s) => acc + calculateLevel(s.totalPoints), 0) / students.length : 0).toFixed(1)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>ÖSSZ PONT:</span>
                        <span className="text-white font-bold">
                            {students.reduce((acc, s) => acc + s.totalPoints, 0)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-black/40 border border-red-900/30 p-4 rounded-lg">
                <h3 className="text-red-500 font-orbitron text-sm mb-2">NAPLÓ (LOG)</h3>
                <div className="text-[10px] text-gray-500 font-mono space-y-1 h-32 overflow-hidden">
                    <p>{'>'} Rendszer indítása...</p>
                    <p>{'>'} Adatbázis kapcsolat: <span className="text-green-500">MOCK_MODE</span></p>
                    <p>{'>'} Szinkronizálás a Google Szerverekkel...</p>
                    <p>{'>'} <span className="text-yellow-500">FIGYELEM:</span> 3 új kitüntetés elérhető.</p>
                </div>
            </div>
        </div>

        {/* Center Panel: The Table */}
        <div className="lg:col-span-3 bg-black/60 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-mono">
                    <thead className="bg-white/5 border-b border-white/10 text-xs text-gray-400 uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Név / Azonosító</th>
                            <th className="p-4">Kaszt</th>
                            <th className="p-4">Szint / Rang</th>
                            <th className="p-4 text-center">Pontszám (XP)</th>
                            <th className="p-4 text-right">Műveletek</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {students.map((student) => {
                            const level = calculateLevel(student.totalPoints);
                            const rank = getRankTitle(student.totalPoints);
                            const isLoading = loading === student.name;

                            return (
                                <tr key={student.name} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4">
                                        <div className="font-bold text-white group-hover:text-neon transition-colors">
                                            {student.name}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`
                                            px-2 py-1 rounded text-[10px] border
                                            ${student.characterType === CharacterClass.SCIENTIST ? 'border-blue-500 text-blue-400 bg-blue-500/10' : ''}
                                            ${student.characterType === CharacterClass.PILOT ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10' : ''}
                                            ${student.characterType === CharacterClass.WARRIOR ? 'border-red-500 text-red-400 bg-red-500/10' : ''}
                                        `}>
                                            {student.characterType}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-xs text-gray-300">LVL {level}</div>
                                        <div className="text-[10px] text-gray-500">{rank}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="font-orbitron text-lg text-neon">{student.totalPoints}</span>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button 
                                            onClick={() => handleGivePoints(student.name, 5)}
                                            disabled={isLoading}
                                            className="px-2 py-1 bg-white/5 hover:bg-neon hover:text-black border border-white/20 hover:border-neon rounded text-xs transition-all disabled:opacity-50"
                                        >
                                            {isLoading ? '...' : '+5 XP'}
                                        </button>
                                        <button 
                                            onClick={() => handleGivePoints(student.name, 10)}
                                            disabled={isLoading}
                                            className="px-2 py-1 bg-white/5 hover:bg-neon hover:text-black border border-white/20 hover:border-neon rounded text-xs transition-all disabled:opacity-50"
                                        >
                                            {isLoading ? '...' : '+10 XP'}
                                        </button>
                                        <button 
                                            onClick={() => handleResetProgress(student.name)}
                                            disabled={isLoading}
                                            className="px-2 py-1 bg-red-900/20 hover:bg-red-500 hover:text-white border border-red-500/50 hover:border-red-500 rounded text-xs transition-all disabled:opacity-50 ml-2"
                                            title="Haladás nullázása"
                                        >
                                            {isLoading ? '...' : 'RESET'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {students.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                    {loading === null && students.length === 0 ? "Betöltés..." : "Nincs megjeleníthető adat."}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;