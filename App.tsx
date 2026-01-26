import React, { useState } from 'react';
import { StudentData, Mission } from './types';
import { loginStudent, submitMissionProgress } from './services/api';
import CharacterCard from './components/CharacterCard';
import RadarMap from './components/RadarMap';
import TerminalChat from './components/TerminalChat';
import MissionBriefing from './components/MissionBriefing';
import SideMissionOne from './components/SideMissionOne';

const App: React.FC = () => {
  const [user, setUser] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ name: '', password: '' });
  const [activeTab, setActiveTab] = useState<'main' | 'side'>('main');
  
  // State for the active mission briefing overlay
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  
  // State for Side Mission
  const [activeSideMission, setActiveSideMission] = useState<number | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const student = await loginStudent(loginForm.name, loginForm.password);
      if (student) setUser(student);
      else alert('Azonosítás sikertelen. Próbálja újra.');
    } catch (err) {
      alert('Hálózati hiba.');
    } finally {
      setLoading(false);
    }
  };

  const updatePoints = (newTotal: number) => {
    if (user) {
      setUser({ ...user, totalPoints: newTotal });
    }
  };

  const handleMissionSelect = (mission: Mission) => {
    setSelectedMission(mission);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-space overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        <div className="relative z-10 w-full max-w-md p-8 bg-black/60 border border-neon/30 rounded-2xl shadow-[0_0_100px_rgba(0,242,255,0.1)] backdrop-blur-xl">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-neon to-white mb-2 tracking-tighter">
              KEPLER
            </h1>
            <div className="text-xs font-mono text-neon tracking-[0.5em]">COMMAND ACCESS</div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-neon/70 ml-1">AZONOSÍTÓ (Név)</label>
              <input 
                type="text" 
                value={loginForm.name}
                onChange={(e) => setLoginForm({...loginForm, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg text-white p-3 focus:border-neon focus:bg-neon/5 focus:outline-none transition-all font-mono text-sm"
                placeholder="Pl. Cadet Kovacs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-neon/70 ml-1">JELSZÓ</label>
              <input 
                type="password" 
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg text-white p-3 focus:border-neon focus:bg-neon/5 focus:outline-none transition-all font-mono text-sm"
                placeholder="••••••"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-neon text-black font-orbitron font-bold py-4 rounded-lg hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300 uppercase tracking-widest mt-4"
            >
              {loading ? 'KAPCSOLÓDÁS...' : 'BELÉPÉS'}
            </button>
          </form>
          <div className="mt-6 text-center text-[10px] text-gray-600 font-mono">
             DEMO: Cadet Kovacs / 123
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-mono flex flex-col relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,_#001a33_0%,_transparent_70%)] pointer-events-none"></div>
      <div className="fixed inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

      {/* Main Mission Overlay */}
      {selectedMission && (
        <MissionBriefing 
          mission={selectedMission} 
          onClose={() => setSelectedMission(null)} 
        />
      )}

      {/* Side Mission Overlay */}
      {activeSideMission === 1 && (
        <SideMissionOne 
          studentName={user.name}
          onPointsAwarded={updatePoints}
          onClose={() => setActiveSideMission(null)}
        />
      )}

      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#00ff00]"></div>
             <span className="font-orbitron text-lg tracking-widest text-white">
               KEPLER<span className="text-neon">452b</span>
             </span>
          </div>
          <div className="flex gap-6 text-xs font-mono">
             <div className="hidden sm:block text-gray-500">SZEKTOR: <span className="text-white">ALPHA</span></div>
             <button onClick={() => setUser(null)} className="text-alert hover:text-white transition-colors uppercase tracking-wider">
               Kijelentkezés
             </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1 flex flex-col lg:flex-row gap-6 relative z-10">
        
        {/* LEFT COLUMN: Dashboard (Map + Stats) */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Character Stats */}
          <CharacterCard student={user} />

          {/* Mission Control Panel */}
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-1 relative overflow-hidden backdrop-blur-sm min-h-[500px]">
             
             {/* Tab Switcher */}
             <div className="flex border-b border-white/5 bg-black/20 mb-4">
               <button 
                 onClick={() => setActiveTab('main')}
                 className={`flex-1 py-3 text-xs font-bold font-orbitron tracking-wider transition-colors ${activeTab === 'main' ? 'text-neon bg-neon/5' : 'text-gray-500 hover:text-white'}`}
               >
                 RADAR / KÜLDETÉSEK
               </button>
               <button 
                 onClick={() => setActiveTab('side')}
                 className={`flex-1 py-3 text-xs font-bold font-orbitron tracking-wider transition-colors ${activeTab === 'side' ? 'text-alert bg-alert/5' : 'text-gray-500 hover:text-white'}`}
               >
                 MELLÉKKÜLDETÉSEK
               </button>
             </div>

             <div className="p-4">
               {activeTab === 'main' ? (
                 <div className="text-center">
                   <p className="text-xs text-gray-400 mb-2 max-w-md mx-auto">
                     "Kattintson a radaron a nagyobb pöttyökre. Igen, azokra, amik alatt az van írva, hogy 'KÜLDETÉS'. Nem olyan bonyolult."
                   </p>
                   <RadarMap currentPoints={user.totalPoints} onSelectMission={handleMissionSelect} />
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {/* Side Mission Links */}
                   {[1, 2, 3, 4].map(i => (
                     <div 
                        key={i} 
                        onClick={() => {
                            if (i === 1) setActiveSideMission(1);
                            else alert(`A ${i}. számú mellékküldetés még nem elérhető.`);
                        }}
                        className="bg-black/40 border border-white/10 p-4 rounded hover:border-alert/50 hover:bg-alert/5 transition-all cursor-pointer group"
                     >
                       <div className="flex justify-between items-center mb-2">
                         <span className="text-alert font-orbitron text-sm">SIDE OP {i}</span>
                         <span className="text-[10px] bg-alert/20 text-alert px-1 rounded">OPCIONÁLIS</span>
                       </div>
                       <p className="text-xs text-gray-400 group-hover:text-gray-300">
                         {i === 1 ? 'Ionrugós Hipertérugrás Teszt (+10 PT)' : `Kiegészítő szimulációs feladat #${i}.`}
                       </p>
                     </div>
                   ))}
                   <div className="col-span-full mt-4 p-4 border border-dashed border-gray-700 rounded text-center text-xs text-gray-500">
                     TOVÁBBI FELADATOK ZÁROLVA
                   </div>
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Chat */}
        <div className="lg:w-[400px] xl:w-[450px] h-[600px] lg:h-auto flex flex-col">
           <TerminalChat 
             studentName={user.name} 
             onPointsAwarded={updatePoints} 
           />
        </div>

      </main>
    </div>
  );
};

export default App;
