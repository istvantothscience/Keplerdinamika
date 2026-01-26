import React, { useState } from 'react';
import { StudentData, Mission } from './types';
import { loginStudent, submitMissionProgress } from './services/api';
import CharacterCard from './components/CharacterCard';
import RadarMap from './components/RadarMap';
import TerminalChat from './components/TerminalChat';
import MissionBriefing from './components/MissionBriefing';
import SideMissionOne from './components/SideMissionOne';
import AdminDashboard from './components/AdminDashboard';

type ViewMode = 'dashboard' | 'missions' | 'side_ops' | 'profile' | 'comms';

const App: React.FC = () => {
  const [user, setUser] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ name: '', password: '' });
  
  // Navigation State
  const [view, setView] = useState<ViewMode>('dashboard');
  
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

  const handleMissionComplete = (missionId: string, newTotal: number) => {
    if (user) {
        const updatedMissions = user.completedMissions ? [...user.completedMissions, missionId] : [missionId];
        setUser({
            ...user,
            totalPoints: newTotal,
            completedMissions: updatedMissions
        });
    }
  };

  const handleMissionSelect = (mission: Mission) => {
    setSelectedMission(mission);
  };

  const handleSideMissionClick = (id: number) => {
      if (id !== 1) {
          alert(`A ${id}. számú mellékküldetés még nem elérhető. Szükséges szint: ${id+1}`);
          return;
      }

      // Check if already completed
      const missionKey = 'sm1_physics_quiz';
      if (user?.completedMissions?.includes(missionKey)) {
          // As per requirement: display message and do not open
          alert("Ezt a mellékküldetést már sikeresen teljesítetted!");
          return;
      }

      setActiveSideMission(1);
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
                placeholder="Pl. Cadet Kovacs vagy Commander"
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
             DEMO: Cadet Kovacs / 123 <br/> ADMIN: Commander / admin
          </div>
        </div>
      </div>
    );
  }

  // --- ADMIN VIEW ---
  if (user.isAdmin) {
    return <AdminDashboard onLogout={() => setUser(null)} />;
  }

  // --- STUDENT VIEW ---
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
          onMissionComplete={handleMissionComplete}
          onClose={() => setActiveSideMission(null)}
        />
      )}

      {/* HEADER TOP BAR */}
      <div className="bg-black/90 border-b border-white/5 backdrop-blur-md relative z-50">
          <div className="container mx-auto px-4 h-10 flex justify-between items-center text-[10px] sm:text-xs font-mono uppercase tracking-widest">
              <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#00ff00] animate-pulse"></div>
                  <span className="text-white font-bold tracking-[0.2em]">KEPLER<span className="text-neon">452b</span></span>
              </div>
              <div className="flex gap-6 text-gray-400">
                  <div className="hidden sm:block">SZEKTOR: <span className="text-white">ALPHA</span></div>
                  <button onClick={() => setUser(null)} className="text-alert hover:text-white transition-colors font-bold">KIJELENTKEZÉS</button>
              </div>
          </div>
      </div>

      {/* MISSION CENTER HEADER */}
      <div className="container mx-auto px-4 mt-6 mb-8 relative z-40">
          <div className="w-full bg-black/60 border border-neon/50 rounded-lg shadow-[0_0_20px_rgba(0,242,255,0.1)] backdrop-blur-xl p-3 sm:p-5 flex flex-col md:flex-row justify-between items-center gap-4">
              
              {/* Title Section */}
              <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-2 h-2 rounded-full bg-neon shadow-[0_0_10px_#00f2ff] animate-pulse hidden md:block"></div>
                  <div 
                    className="font-orbitron text-lg sm:text-2xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-neon uppercase cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setView('dashboard')}
                  >
                      KEPLER-452b <span className="text-neon">MISSZIÓKÖZPONT</span>
                  </div>
              </div>

              {/* Cadet Info Section */}
              <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto justify-between md:justify-end">
                  <div className="font-mono text-xs sm:text-sm text-right leading-tight">
                      <div className="text-gray-400 uppercase tracking-wider mb-0.5">KADÉT: <span className="text-neon font-bold ml-1">{user.name}</span></div>
                      <div className="flex items-center justify-end gap-3">
                          <span className="text-gray-500 text-[10px] sm:text-xs border border-gray-700 px-1 rounded bg-black/50">[{user.characterType}]</span>
                          <span className="text-alert font-bold text-sm sm:text-base">{user.totalPoints} PT</span>
                      </div>
                  </div>
                  
                  <div className="flex gap-2">
                      <button 
                        onClick={() => setView('profile')}
                        className={`w-10 h-10 rounded border transition-all flex items-center justify-center ${view === 'profile' ? 'bg-neon text-black border-neon' : 'border-neon/30 text-neon hover:bg-neon hover:text-black'}`}
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A7.5 7.5 0 0 1 8.863 17.24 7.222 7.222 0 0 0 4.501 20.118Z" />
                          </svg>
                      </button>
                      <button 
                         onClick={() => setUser(null)} 
                         className="w-10 h-10 rounded border border-alert/30 text-alert hover:bg-alert hover:text-black transition-all flex items-center justify-center"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 2.062-5M18 12l2.062 5M18 12H9" />
                          </svg>
                      </button>
                  </div>
              </div>
          </div>
      </div>

      <main className="container mx-auto px-4 pb-8 flex-1 relative z-10 flex flex-col">
        
        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && (
           <div className="flex-1 flex flex-col items-center justify-center animate-fadeIn">
               <div className="text-center mb-12">
                   <h2 className="text-3xl sm:text-4xl font-orbitron text-neon tracking-widest uppercase mb-2 glow-text">Parancsnoki Központ</h2>
                   <p className="text-gray-400 font-mono text-sm tracking-widest">VÁLASSZ MŰVELETET A FOLYTATÁSHOZ</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                   
                   {/* KÜLDETÉS */}
                   <button 
                     onClick={() => setView('missions')}
                     className="group relative h-40 bg-black/40 border border-neon/30 rounded-xl overflow-hidden hover:border-neon hover:shadow-[0_0_30px_rgba(0,242,255,0.2)] transition-all duration-300 flex items-center p-6 text-left"
                   >
                       <div className="absolute inset-0 bg-gradient-to-r from-neon/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <div className="mr-6 p-4 rounded-full border border-neon/50 bg-neon/10 text-neon group-hover:bg-neon group-hover:text-black transition-colors">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                           </svg>
                       </div>
                       <div>
                           <h3 className="text-xl font-orbitron text-white group-hover:text-neon transition-colors mb-1">KÜLDETÉS</h3>
                           <p className="text-xs text-gray-400 font-mono">Fő szektorok és kampány küldetések</p>
                           <div className="mt-2 flex gap-1">
                               <div className="w-2 h-2 rounded-full bg-neon"></div>
                               <div className="w-2 h-2 rounded-full bg-gray-700"></div>
                               <div className="w-2 h-2 rounded-full bg-gray-700"></div>
                           </div>
                       </div>
                   </button>

                   {/* MELLÉKKÜLDETÉS */}
                   <button 
                     onClick={() => setView('side_ops')}
                     className="group relative h-40 bg-black/40 border border-alert/30 rounded-xl overflow-hidden hover:border-alert hover:shadow-[0_0_30px_rgba(255,140,0,0.2)] transition-all duration-300 flex items-center p-6 text-left"
                   >
                       <div className="absolute inset-0 bg-gradient-to-r from-alert/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <div className="mr-6 p-4 rounded-full border border-alert/50 bg-alert/10 text-alert group-hover:bg-alert group-hover:text-black transition-colors">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M21 9.75v10.5a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 20.25V9.75M21 9.75V7.5a2.25 2.25 0 0 0-2.25-2.25h-4.5A2.25 2.25 0 0 0 12 7.5v2.25m9 0v-2.25a2.25 2.25 0 0 0-2.25-2.25H18M3 9.75V7.5a2.25 2.25 0 0 1 2.25-2.25h4.5A2.25 2.25 0 0 1 12 7.5v2.25m-9 0v-2.25a2.25 2.25 0 0 1 2.25-2.25H6" />
                             <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                           </svg>
                       </div>
                       <div>
                           <h3 className="text-xl font-orbitron text-white group-hover:text-alert transition-colors mb-1">MELLÉKKÜLDETÉS</h3>
                           <p className="text-xs text-gray-400 font-mono">Kiegészítő feladatok és szimulációk</p>
                           <div className="mt-2 flex gap-1">
                               <div className="w-2 h-2 rounded-full bg-alert"></div>
                           </div>
                       </div>
                   </button>

                   {/* KARAKTER */}
                   <button 
                     onClick={() => setView('profile')}
                     className="group relative h-40 bg-black/40 border border-blue-500/30 rounded-xl overflow-hidden hover:border-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300 flex items-center p-6 text-left"
                   >
                       <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <div className="mr-6 p-4 rounded-full border border-blue-500/50 bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-black transition-colors">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
                           </svg>
                       </div>
                       <div>
                           <h3 className="text-xl font-orbitron text-white group-hover:text-blue-500 transition-colors mb-1">KARAKTER</h3>
                           <p className="text-xs text-gray-400 font-mono">Kadét adatlap, rang és képességek</p>
                       </div>
                   </button>

                   {/* SZÁMÍTÓGÉP */}
                   <button 
                     onClick={() => setView('comms')}
                     className="group relative h-40 bg-black/40 border border-yellow-500/30 rounded-xl overflow-hidden hover:border-yellow-500 hover:shadow-[0_0_30px_rgba(234,179,8,0.2)] transition-all duration-300 flex items-center p-6 text-left"
                   >
                       <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <div className="mr-6 p-4 rounded-full border border-yellow-500/50 bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
                           </svg>
                       </div>
                       <div>
                           <h3 className="text-xl font-orbitron text-white group-hover:text-yellow-500 transition-colors mb-1">SZÁMÍTÓGÉP</h3>
                           <p className="text-xs text-gray-400 font-mono">Fedélzeti AI és Tudásbázis</p>
                           <div className="mt-2">
                               <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1 rounded animate-pulse">ONLINE</span>
                           </div>
                       </div>
                   </button>
               </div>
           </div>
        )}

        {/* MISSIONS VIEW */}
        {view === 'missions' && (
            <div className="flex-1 flex flex-col items-center animate-fadeIn">
                 <div className="w-full flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                     <h2 className="text-2xl font-orbitron text-neon">KÜLDETÉS TÉRKÉP</h2>
                     <button onClick={() => setView('dashboard')} className="text-xs font-mono text-gray-400 hover:text-white flex items-center gap-1">
                         <span>←</span> VISSZA A PARANCSNOKI HÍDRA
                     </button>
                 </div>
                 <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-2">
                         <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                             <RadarMap currentPoints={user.totalPoints} onSelectMission={handleMissionSelect} />
                             <div className="text-center mt-4 text-xs text-gray-500 font-mono">
                                 Kattintson az aktív szektorokra a részletekért.
                             </div>
                         </div>
                     </div>
                     <div className="lg:col-span-1">
                         <div className="bg-white/5 border border-white/10 rounded-xl p-6 h-full">
                             <h3 className="text-alert font-orbitron text-lg mb-4">AKTÍV CÉLKITŰZÉSEK</h3>
                             <ul className="space-y-4 text-sm font-mono text-gray-300">
                                 <li className="flex items-start gap-2">
                                     <span className="text-neon">►</span>
                                     <span>Érje el a következő szintet (LVL {Math.min(5, user.level + 1)}) a szektorok feloldásához.</span>
                                 </li>
                                 <li className="flex items-start gap-2">
                                     <span className="text-neon">►</span>
                                     <span>Végezze el a házi feladatokat a Classroomban.</span>
                                 </li>
                                 <li className="flex items-start gap-2">
                                     <span className="text-neon">►</span>
                                     <span>Konzultáljon a fedélzeti számítógéppel extra pontokért.</span>
                                 </li>
                             </ul>
                         </div>
                     </div>
                 </div>
            </div>
        )}

        {/* SIDE OPS VIEW */}
        {view === 'side_ops' && (
            <div className="flex-1 flex flex-col animate-fadeIn">
                <div className="w-full flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                     <h2 className="text-2xl font-orbitron text-alert">MELLÉKKÜLDETÉSEK</h2>
                     <button onClick={() => setView('dashboard')} className="text-xs font-mono text-gray-400 hover:text-white flex items-center gap-1">
                         <span>←</span> VISSZA A PARANCSNOKI HÍDRA
                     </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {[1, 2, 3, 4].map(i => {
                       const isCompleted = i === 1 && user.completedMissions?.includes('sm1_physics_quiz');
                       return (
                         <div 
                            key={i} 
                            onClick={() => handleSideMissionClick(i)}
                            className={`
                                relative bg-black/40 border p-6 rounded-xl transition-all cursor-pointer group overflow-hidden
                                ${i === 1 
                                    ? (isCompleted ? 'border-green-500/50 hover:border-green-500 hover:bg-green-500/5' : 'border-alert/50 hover:border-alert hover:bg-alert/5')
                                    : 'border-white/10 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                                }
                            `}
                         >
                           <div className="flex justify-between items-center mb-4">
                             <span className={isCompleted ? "text-green-500 font-orbitron text-xl" : "text-alert font-orbitron text-xl"}>
                                 OP-{i.toString().padStart(2, '0')}
                             </span>
                             {isCompleted ? (
                                 <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-1 rounded border border-green-500/30">TELJESÍTVE</span>
                             ) : i === 1 ? (
                                 <span className="text-[10px] bg-alert/20 text-alert px-2 py-1 rounded border border-alert/30 animate-pulse">AKTÍV</span>
                             ) : (
                                 <span className="text-[10px] bg-gray-800 text-gray-500 px-2 py-1 rounded border border-gray-700">ZÁROLVA</span>
                             )}
                           </div>
                           <h3 className="text-white font-mono font-bold mb-2">
                             {i === 1 ? 'Ionrugós Hipertérugrás' : `Szimuláció #${i}`}
                           </h3>
                           <p className="text-xs text-gray-400 mb-4 h-10">
                             {i === 1 ? 'Tesztelje a Newton II. törvényét egy rugós kilövő szerkezeten. Jutalom: +10 PT' : 'Adatállomány sérült. A feloldáshoz magasabb szint szükséges.'}
                           </p>
                           {i === 1 && !isCompleted && (
                               <div className="flex items-center text-xs font-mono text-neon gap-2 group-hover:gap-4 transition-all">
                                   <span>INDÍTÁS</span>
                                   <span>→</span>
                               </div>
                           )}
                           {isCompleted && (
                               <div className="flex items-center text-xs font-mono text-green-500 gap-2">
                                   <span>ARCHIVÁLVA</span>
                                   <span>✓</span>
                               </div>
                           )}
                         </div>
                       );
                   })}
                </div>
            </div>
        )}

        {/* PROFILE VIEW */}
        {view === 'profile' && (
            <div className="flex-1 flex flex-col items-center animate-fadeIn">
                <div className="w-full flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                     <h2 className="text-2xl font-orbitron text-white">KARAKTER ADATLAP</h2>
                     <button onClick={() => setView('dashboard')} className="text-xs font-mono text-gray-400 hover:text-white flex items-center gap-1">
                         <span>←</span> VISSZA A PARANCSNOKI HÍDRA
                     </button>
                </div>
                <div className="w-full max-w-3xl">
                    <CharacterCard student={user} />
                    
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-white font-orbitron mb-4 text-sm">TELJESÍTMÉNY STATISZTIKA</h3>
                            <div className="space-y-3 font-mono text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Házi feladatok:</span>
                                    <span className="text-neon">{user.scores.homework} PT</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Órai munka:</span>
                                    <span className="text-neon">{user.scores.lessons.reduce((a,b)=>a+b,0)} PT</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Projektek:</span>
                                    <span className="text-neon">{user.scores.project} PT</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-700 pt-2">
                                    <span className="text-white">Összesen:</span>
                                    <span className="text-alert font-bold">{user.totalPoints} PT</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden">
                            <h3 className="text-white font-orbitron mb-4 text-sm">KASZT BÓNUSZOK</h3>
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">
                                {user.characterType === 'Tudos' ? '🔬' : user.characterType === 'Pilota' ? '🚀' : '⚔️'}
                            </div>
                            <p className="text-xs text-gray-400 font-mono leading-relaxed">
                                A {user.characterType} osztály speciális bónuszokat kap a tudományos feladatok megoldásánál. Használja a fedélzeti számítógépet a rejtett képességek aktiválásához.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* COMMS VIEW (CHAT) */}
        {view === 'comms' && (
            <div className="flex-1 flex flex-col animate-fadeIn h-full">
                <div className="w-full flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                     <h2 className="text-2xl font-orbitron text-yellow-500">FEDÉLZETI SZÁMÍTÓGÉP</h2>
                     <button onClick={() => setView('dashboard')} className="text-xs font-mono text-gray-400 hover:text-white flex items-center gap-1">
                         <span>←</span> VISSZA A PARANCSNOKI HÍDRA
                     </button>
                </div>
                <div className="flex-1 flex gap-6 overflow-hidden">
                    <div className="hidden lg:block w-64 bg-black/40 border border-white/10 rounded-xl p-4">
                        <div className="text-xs font-mono text-gray-500 mb-2">RENDSZER ÁLLAPOT</div>
                        <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-green-500 text-xs">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                AI CORE ONLINE
                            </div>
                            <div className="flex items-center gap-2 text-green-500 text-xs">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                DATABASE SYNCED
                            </div>
                        </div>
                        <div className="text-xs font-mono text-gray-500 mb-2">PARANCSOK</div>
                        <div className="space-y-2 text-[10px] text-gray-400 font-mono">
                            <p className="border-b border-gray-800 pb-1">"Mi az a tehetetlenség?"</p>
                            <p className="border-b border-gray-800 pb-1">"Számítsd ki az erőt..."</p>
                            <p className="border-b border-gray-800 pb-1">"Adj egy találós kérdést."</p>
                        </div>
                    </div>
                    <div className="flex-1 h-[600px] lg:h-auto">
                        <TerminalChat 
                            studentName={user.name} 
                            onPointsAwarded={updatePoints} 
                        />
                    </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default App;