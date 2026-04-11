import React, { useState, useEffect } from 'react';
import { StudentData, Mission, CharacterClass } from './types';
import { loginStudent, registerStudent } from './services/api';
import { getRankTitle } from './constants';
import RadarMap from './components/RadarMap';
import TerminalChat from './components/TerminalChat';
import MissionBriefing from './components/MissionBriefing';
import SideMissionOne from './components/SideMissionOne';
import SideMissionTwo from './components/SideMissionTwo';
import SideMissionThree from './components/SideMissionThree';
import SideMissionFour from './components/SideMissionFour';
import SideMissionFive from './components/SideMissionFive';
import SideMissionSix from './components/SideMissionSix';
import GravitySimulation from './components/GravitySimulation'; // Imported new component
import NewtonJeepMission from './components/NewtonJeepMission';
import AdminDashboard from './components/AdminDashboard';
import CharacterCard from './components/CharacterCard';
import Prologue from './components/Prologue';
import { grantPointsTool } from './services/geminiService';
import { PHYSICS_KNOWLEDGE_BASE } from './knowledgeBase';

type ViewState = 'dashboard' | 'profile' | 'prologue';
type DashboardTab = 'main' | 'side';

// --- DECORATIVE COMPONENTS ---
const Screw = () => (
  <div className="w-2 h-2 rounded-full bg-gray-600 border border-gray-800 shadow-inner flex items-center justify-center">
    <div className="w-1 h-[1px] bg-gray-800 transform rotate-45"></div>
  </div>
);

const ToggleSwitch = ({ active = false, label, color = "bg-green-500" }: any) => (
  <div className="flex flex-col items-center gap-1">
    <div className="w-8 h-12 bg-gray-900 rounded border border-gray-700 relative shadow-inner">
       <div className={`absolute left-1 right-1 h-6 rounded-sm transition-all duration-300 ${active ? 'top-1 ' + color + ' shadow-[0_0_10px_currentColor]' : 'bottom-1 bg-gray-700'}`}></div>
    </div>
    <span className="text-[8px] font-mono text-gray-500 uppercase tracking-tighter">{label}</span>
  </div>
);

const StatusLight = ({ label, color = "bg-red-500", blink = false }: any) => (
  <div className="flex items-center gap-2">
     <div className={`w-3 h-3 rounded-full ${color} border border-black shadow-[0_0_5px_currentColor] ${blink ? 'animate-pulse' : ''}`}></div>
     <span className="text-[10px] font-mono text-gray-400 uppercase">{label}</span>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewState>('dashboard');
  const [activeTab, setActiveTab] = useState<DashboardTab>('main');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock Effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  // Login/Register State
  const [isRegistering, setIsRegistering] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', charClass: CharacterClass.SCIENTIST });
  
  // Mission States
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [activeSideMission, setActiveSideMission] = useState<number | null>(null);
  const [showGravitySim, setShowGravitySim] = useState(false);
  const [showDynamicsSim, setShowDynamicsSim] = useState(false); // Placeholder for S03
  const [showQuizChat, setShowQuizChat] = useState(false);

  const handleTestLogin = () => {
    setUser({
      name: 'TesztPista (Zsűri)',
      characterType: CharacterClass.PILOT,
      level: 5,
      totalPoints: 100,
      completedMissions: [],
      scores: {
        lessons: [5, 4, 5, 3, 5, 4],
        homework: [10, 8, 9, 10, 7, 0],
        project: 18,
        exam: 0
      },
      isAdmin: false
    });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
          const newUser = await registerStudent(authForm.name, authForm.email, authForm.password, authForm.charClass);
          setUser(newUser);
      } else {
          const student = await loginStudent(authForm.name, authForm.password);
          if (student) setUser(student);
          else alert('Azonosítás sikertelen. Próbálja újra.');
      }
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

  const handleSideMissionClick = (slotId: number) => {
      let requiredPoints = 0;
      if (slotId === 2) requiredPoints = 20;
      else if (slotId === 3) requiredPoints = 41;
      else if (slotId === 4) requiredPoints = 51;
      else if (slotId === 5) requiredPoints = 71;

      if (user && user.totalPoints < requiredPoints) {
          alert(`A ${slotId}. számú szektor még nem elérhető. Szükséges pontszám: ${requiredPoints} XP`);
          return;
      }
      
      let missionContentId = 0; // Ez indítja a komponenst (1=SM1, 2=SM2, stb.)
      let missionKey = '';

      // --- REMAPPING LOGIC ---
      if (slotId === 1) {
          // SLOT 1 -> RONCSDERBI (SM1)
          missionContentId = 1;
          missionKey = 'sm1_physics_quiz';
      }
      else if (slotId === 2) {
          // SLOT 2 -> INERTIA (SM2)
          missionContentId = 2;
          missionKey = 'sm2_inertia';
      }
      else if (slotId === 3) {
          // SLOT 3 -> ROCKET (SM3)
          missionContentId = 3;
          missionKey = 'sm3_rocket';
      }
      else if (slotId === 4) {
          // SLOT 4 -> ARCADE (SM4)
          missionContentId = 4;
          missionKey = 'sm4_arcade_game';
      }
      else if (slotId === 5) {
          // SLOT 5 -> BILLIARDS (SM5)
          missionContentId = 5;
          missionKey = 'sm3_billiards';
      }
      else if (slotId === 6) {
          // SLOT 6 -> AIR RESISTANCE (SM6)
          missionContentId = 6;
          missionKey = 'sm6_air_resistance';
      }
      else {
          alert("Ez a szimuláció jelenleg karbantartás alatt áll.");
          return;
      }
      
      // Check completion
      if (missionKey && user?.completedMissions?.includes(missionKey)) {
           // Már kész, nem nyitjuk meg újra (opcionális, de itt így volt)
           // return; 
           // Hagyjuk, hogy újra játssza, ha akarja? Az eredeti kód tiltotta.
           // Maradjon tiltva, vizuálisan jelezzük.
           return;
      }

      if (missionContentId !== 0) {
          setActiveSideMission(missionContentId);
      }
  };

  // --- AUTH SCREEN ---
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black overflow-hidden relative font-mono">
        <div className="absolute inset-0 bg-carbon opacity-30"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        {/* Auth Box styled as a secure panel */}
        <div className="relative z-10 w-full max-w-lg bg-panel-metal p-1 rounded-xl shadow-2xl border border-gray-800">
           {/* Screws */}
           <div className="absolute top-2 left-2"><Screw /></div>
           <div className="absolute top-2 right-2"><Screw /></div>
           <div className="absolute bottom-2 left-2"><Screw /></div>
           <div className="absolute bottom-2 right-2"><Screw /></div>

           <div className="bg-[#050505] m-2 p-8 rounded-lg border border-gray-800 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon to-transparent"></div>
               
               <div className="text-center mb-8 pb-4 border-b border-gray-800">
                  <h1 className="text-4xl font-orbitron text-white tracking-widest mb-2">KEPLER-452B</h1>
                  <div className="inline-block px-2 py-1 bg-neon/10 border border-neon/30 text-neon text-[10px] tracking-[0.3em]">SECURE_LOGIN_TERMINAL</div>
               </div>
            
                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-500 uppercase">Azonosító</label>
                    <input 
                      type="text" 
                      required
                      value={authForm.name}
                      onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                      className="w-full bg-[#111] border border-gray-700 rounded text-neon p-3 focus:border-neon focus:shadow-[0_0_10px_rgba(0,242,255,0.1)] outline-none font-mono tracking-wider"
                    />
                  </div>

                  {isRegistering && (
                      <div className="space-y-1 animate-fadeIn">
                        <label className="text-[10px] font-mono text-gray-500 uppercase">Email</label>
                        <input 
                          type="email" 
                          required
                          value={authForm.email}
                          onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                          className="w-full bg-[#111] border border-gray-700 rounded text-neon p-3 focus:border-neon outline-none font-mono"
                        />
                      </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-500 uppercase">Jelszó</label>
                    <input 
                      type="password" 
                      required
                      value={authForm.password}
                      onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                      className="w-full bg-[#111] border border-gray-700 rounded text-neon p-3 focus:border-neon outline-none font-mono"
                    />
                  </div>

                  {isRegistering && (
                      <div className="space-y-1 animate-fadeIn">
                        <label className="text-[10px] font-mono text-gray-500 uppercase">Kaszt</label>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.values(CharacterClass).map((c) => (
                                <button
                                    type="button"
                                    key={c}
                                    onClick={() => setAuthForm({...authForm, charClass: c})}
                                    className={`text-[10px] p-2 border rounded font-orbitron uppercase transition-all ${authForm.charClass === c ? 'bg-neon text-black border-neon' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                      </div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full relative group overflow-hidden bg-gradient-to-b from-[#006090] to-[#001030] hover:from-[#0070a0] hover:to-[#002040] text-white font-orbitron font-bold py-4 rounded border-t-2 border-cyan-400 shadow-[0_0_20px_rgba(0,100,255,0.4)] transition-all duration-300 uppercase tracking-widest mt-6"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4px_4px] opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none"></div>
                    <span className="relative z-10 flex items-center justify-center gap-2 drop-shadow-md">
                      {loading ? 'FELDOLGOZÁS...' : (isRegistering ? 'REGISZTRÁCIÓ' : 'BELÉPÉS')}
                    </span>
                  </button>
                </form>

                <div className="mt-6 flex flex-col gap-4">
                    <div className="text-center">
                        <button 
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-[10px] font-mono text-gray-500 hover:text-neon underline"
                        >
                            {isRegistering ? 'VISSZA A BELÉPÉSHEZ' : 'ÚJ FIÓK LÉTREHOZÁSA'}
                        </button>
                    </div>
                    
                    <div className="border-t border-gray-800 pt-4">
                        <button 
                            type="button"
                            onClick={handleTestLogin}
                            className="w-full relative group overflow-hidden bg-gradient-to-b from-green-900 to-green-950 hover:from-green-800 hover:to-green-900 text-green-400 font-orbitron font-bold py-3 rounded border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)] transition-all duration-300 uppercase tracking-widest text-sm"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                TESZTELÉS
                            </span>
                        </button>
                    </div>
                </div>
           </div>
        </div>
      </div>
    );
  }

  // --- ADMIN VIEW ---
  if (user.isAdmin) {
    return <AdminDashboard onLogout={() => setUser(null)} />;
  }

  // --- PROFILE VIEW ---
  if (view === 'profile') {
      return <CharacterCard student={user} onBack={() => setView('dashboard')} />;
  }

  // --- PROLOGUE VIEW ---
  if (view === 'prologue') {
      return <Prologue onClose={() => setView('dashboard')} />;
  }

  // --- COCKPIT VIEW ---
  const rank = getRankTitle(user.totalPoints);
  const nextLevelXP = (user.level) * 20 + 20;
  const xpPercentage = Math.min(100, (user.totalPoints % 20) * 5);

  return (
    <div className="min-h-screen w-full bg-[#050505] text-gray-300 font-mono relative overflow-hidden flex flex-col">
      {/* Background Textures */}
      <div className="absolute inset-0 bg-carbon opacity-40 pointer-events-none"></div>
      
      {/* OVERLAYS */}
      {selectedMission && (
          <MissionBriefing 
              mission={selectedMission} 
              onClose={() => setSelectedMission(null)}
              onOpenSimulation={() => {
                  if (selectedMission.id === 'S05') setShowGravitySim(true);
                  if (selectedMission.id === 'S03') setShowDynamicsSim(true);
              }} 
              onOpenQuiz={() => setShowQuizChat(true)}
          />
      )}
      
      {/* Gravity Simulation Overlay */}
      {showGravitySim && <GravitySimulation onClose={() => setShowGravitySim(false)} />}
      
      {/* Dynamics Simulation Overlay */}
      {showDynamicsSim && (
          <NewtonJeepMission 
              onClose={() => setShowDynamicsSim(false)} 
              onMissionComplete={handleMissionComplete} 
          />
      )}

      {/* Quiz Chat Overlay */}
      {showQuizChat && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center bg-black/90 p-4 border border-neon/30 border-b-0 rounded-t-xl">
                    <h2 className="text-neon font-orbitron text-xl tracking-widest">SZEKTOR 1 // ELLENŐRZŐ KVÍZ</h2>
                    <button onClick={() => setShowQuizChat(false)} className="text-gray-500 hover:text-white px-2">✕</button>
                </div>
                <div className="flex-1 overflow-hidden">
                    <TerminalChat 
                        studentName={user.name} 
                        onPointsAwarded={updatePoints} 
                        missionId="sm1_physics_quiz"
                        systemInstruction={`Project GEM - Newton-1 Quiz Module v1.0
Role: You are the "Dinamika7" AI, a high-precision educational assistant. Your persona is based on a witty, slightly melancholic, scientifically accurate entity (style: Douglas Adams).
Objective: Execute a sequential, 5-question multiple-choice assessment (MCQ) based on the "Mechanics/Dynamics - Sector 1" curriculum.

Input Data (Source-based): 
1. Force definition: interaction causing state-of-motion or shape change.
2. Units: $F$ in Newtons ($N$).
3. Vectors: Direction, Magnitude, Point of Application.
4. Deformation: Elastic vs. Plastic.
5. Proportionality: Linear relationship in spring extension ($F=k \\cdot \\Delta x$ concept).

Operational Logic & State Management:
Initialization: Set current_question = 1 and total_points = 0.
Iterative Loop: 
* Display Question[n] with 4 options (A, B, C, D).
Await user input.
Validation: 
* If input == Correct: total_points += 1. Provide positive reinforcement in-character.
If input == Incorrect: Provide a brief, source-based corrective explanation. total_points += 0.
Increment current_question.

Post-Processing & Exit Criteria:
After Question 5, display: "Calibration Complete. Final Score: {total_points} / 5".
Condition A (Success): If total_points == 5: Output a definitive success message. Status: LOCKED. Do not allow re-runs. Terminal state reached. YOU MUST EXECUTE THE FUNCTION CALL \`grantPoints\` with arguments \`reason\`: 'Sector 1 Quiz Passed' and \`points\`: 10.
Condition B (Retry): If total_points < 5: Output a failure message highlighting the danger of the "Seven-Legged Horror". Offer a System Reboot (Retry). If user accepts, reset total_points and current_question to 1.

Quiz Data Store:
Force Impact: Which effect changes motion or shape? (A: Mass, B: Force, C: Time, D: Temperature) | Correct: B
Deformation: A sponge is squeezed then released. Type? (A: Plastic, B: Permanent, C: Elastic, D: None) | Correct: C
Notation: Symbol and Unit of Force? (A: $m$ / $kg$, B: $F$ / $N$, C: $v$ / $m/s$, D: $G$ / $Pa$) | Correct: B
Vector Attributes: What defines a force vector? (A: Magnitude only, B: Color, C: Magnitude, Direction, Point of App., D: Origin only) | Correct: C
Spring Scaling: 1N causes 2cm stretch. Stretch for 3N? (A: 3cm, B: 4cm, C: 5cm, D: 6cm) | Correct: D

Constraint: Maintain the "Newton-1 Computer" persona throughout all IO operations. Use LaTeX for scientific notation.

KNOWLEDGE BASE (USE THIS FOR EXPLANATIONS):
${PHYSICS_KNOWLEDGE_BASE}`}
                        tools={[grantPointsTool]}
                        initialMessage="Dinamika7 AI inicializálva... Készen áll a Szektor 1 kalibrációs tesztjére, kadét? (Írja be, hogy 'Igen' az indításhoz)"
                    />
                </div>
            </div>
        </div>
      )}

      {/* Side Mission Components - Triggered by Active State ID (Content ID) */}
      {activeSideMission === 1 && <SideMissionOne studentName={user.name} onPointsAwarded={updatePoints} onMissionComplete={handleMissionComplete} onClose={() => setActiveSideMission(null)} isCompleted={user.completedMissions?.includes('sm1_physics_quiz') || false} />}
      {activeSideMission === 2 && <SideMissionTwo studentName={user.name} onPointsAwarded={updatePoints} onMissionComplete={handleMissionComplete} onClose={() => setActiveSideMission(null)} />}
      {activeSideMission === 3 && <SideMissionThree studentName={user.name} onPointsAwarded={updatePoints} onMissionComplete={handleMissionComplete} onClose={() => setActiveSideMission(null)} />}
      {activeSideMission === 4 && <SideMissionFour studentName={user.name} onPointsAwarded={updatePoints} onMissionComplete={handleMissionComplete} onClose={() => setActiveSideMission(null)} />}
      {activeSideMission === 5 && <SideMissionFive studentName={user.name} onPointsAwarded={updatePoints} onMissionComplete={handleMissionComplete} onClose={() => setActiveSideMission(null)} isCompleted={user.completedMissions?.includes('sm3_rocket') || false} />}
      {activeSideMission === 6 && <SideMissionSix studentName={user.name} onPointsAwarded={updatePoints} onMissionComplete={handleMissionComplete} onClose={() => setActiveSideMission(null)} isCompleted={user.completedMissions?.includes('sm6_air_resistance') || false} />}

      {/* --- TOP OVERHEAD PANEL (Header) --- */}
      <header className="z-30 h-auto min-h-[5rem] py-3 md:py-0 md:h-20 bg-panel-metal border-b border-gray-800 flex flex-wrap items-center px-4 md:px-6 justify-between shadow-2xl shrink-0 gap-4">
          {/* Screws */}
          <div className="hidden md:block absolute top-2 left-4"><Screw /></div>
          <div className="hidden md:block absolute top-2 right-4"><Screw /></div>
          <div className="hidden md:block absolute bottom-2 left-1/2"><Screw /></div>

          {/* User ID Plate */}
          <div className="flex items-center gap-3 bg-black/40 px-3 py-2 rounded border border-gray-700 cursor-pointer hover:bg-black/60 transition-colors" onClick={() => setView('profile')} title="Profil Megnyitása">
              <div className="w-8 h-8 md:w-10 md:h-10 border border-neon/50 rounded overflow-hidden shrink-0">
                 <img src={`/img/${user.characterType}_${user.level}.png`} onError={(e) => e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.characterType}${user.level}`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                  <h2 className="text-sm md:text-lg font-orbitron text-white leading-none uppercase truncate max-w-[100px] md:max-w-[200px]">{user.name}</h2>
                  <div className="flex gap-2 text-[8px] md:text-[10px] text-neon mt-1">
                      <span className="bg-neon/10 px-1 rounded truncate max-w-[60px] md:max-w-none">{rank}</span>
                      <span className="shrink-0">LVL {user.level}</span>
                  </div>
              </div>
          </div>

          {/* Center Status Display */}
          <div className="hidden md:flex flex-col items-center w-1/3">
               <div className="flex justify-between w-full text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                   <span>Energiaszint</span>
                   <span>{user.totalPoints} / {nextLevelXP} XP</span>
               </div>
               <div className="w-full h-2 bg-gray-900 rounded-full border border-gray-700 overflow-hidden relative">
                   <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')] opacity-20"></div>
                   <div style={{ width: `${xpPercentage}%` }} className="h-full bg-gradient-to-r from-teal-500 to-neon shadow-[0_0_10px_#00f2ff]"></div>
               </div>
          </div>

          {/* Right Side: Clock & Logout */}
          <div className="flex items-center gap-4 md:gap-6 ml-auto">
              <div className="hidden sm:flex flex-col items-end border-r border-gray-700 pr-4 md:pr-6">
                  <div className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest">FEDÉLZETI IDŐ</div>
                  <div className="font-mono text-neon text-sm md:text-xl tracking-widest shadow-neon-glow leading-none mt-1">
                      {timeString}
                  </div>
              </div>

              <button onClick={() => setUser(null)} className="tech-btn px-2 md:px-4 py-2 text-red-500 text-[10px] md:text-xs font-bold font-orbitron uppercase rounded hover:text-red-400 transition-colors">
                  KIJELENTKEZÉS
              </button>
          </div>
      </header>

      {/* --- MAIN COCKPIT AREA --- */}
      <main className="flex-1 flex relative p-4 gap-4 overflow-hidden">
          
          {/* --- LEFT PANEL: CONTROLS (Decorative) --- */}
          <div className="hidden lg:flex w-24 bg-panel-metal border border-gray-800 rounded-lg flex-col items-center py-6 gap-6 shadow-panel-inset">
               <div className="w-full text-center border-b border-gray-700 pb-2 mb-2">
                   <span className="text-[8px] text-gray-500 rotate-90 inline-block">SYS_L</span>
               </div>
               <ToggleSwitch label="ENG_1" active={true} />
               <ToggleSwitch label="ENG_2" active={true} />
               <ToggleSwitch label="NAV" active={true} color="bg-blue-500" />
               <div className="h-px w-12 bg-gray-700 my-2"></div>
               <StatusLight label="PWR" color="bg-green-500" />
               <StatusLight label="COM" color="bg-green-500" blink={true} />
               <StatusLight label="ERR" color="bg-red-900" />
          </div>

          {/* --- CENTER: HOLOGRAPHIC DISPLAY --- */}
          <div className="flex-1 flex flex-col relative">
              
              {/* Top Unit: TABS & HEADER */}
              <div className="flex flex-col relative z-20">
                  {/* Decorative Header Bar */}
                  <div className="h-8 bg-black/60 border-t border-x border-neon/50 rounded-t-xl flex items-center justify-between px-4 mx-2 mt-2 backdrop-blur relative">
                       <div className="flex items-center gap-4 h-full">
                           <div className="w-2 h-2 bg-neon rounded-full animate-pulse"></div>
                           <span className="text-neon text-xs font-orbitron tracking-widest">SZEKTOR SZKENNER AKTÍV // 8 CÉLPONT</span>
                       </div>
                       <div className="flex gap-1">
                           {[1,2,3,4].map(i => <div key={i} className="w-1 h-3 bg-neon/30 transform skew-x-12"></div>)}
                       </div>
                  </div>

                  {/* Tab Buttons Container */}
                  <div className="flex justify-center -mb-[2px] z-30 relative px-2">
                      
                      {/* PROLOGUE BUTTON - Positioned to the left */}
                      <button 
                         onClick={() => setView('prologue')}
                         className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 px-2 py-1 md:px-6 md:py-2 bg-neon/20 border border-neon rounded-full text-[10px] md:text-xs font-orbitron font-bold text-neon hover:bg-neon hover:text-black transition-all shadow-[0_0_15px_rgba(0,242,255,0.3)] hover:shadow-[0_0_20px_rgba(0,242,255,0.6)] flex items-center gap-1 md:gap-2 group z-40"
                      >
                         <span className="group-hover:animate-pulse">▶</span> <span className="hidden sm:inline">PROLÓGUS</span>
                      </button>

                      <div className="bg-black/80 border border-neon/50 rounded-full p-1 flex backdrop-blur-md shadow-[0_0_20px_rgba(0,242,255,0.2)] max-w-full overflow-x-auto scrollbar-hide">
                          <button 
                            onClick={() => setActiveTab('main')}
                            className={`px-4 md:px-8 py-2 rounded-full font-orbitron text-[10px] md:text-xs tracking-widest transition-all duration-300 whitespace-nowrap ${
                                activeTab === 'main' 
                                ? 'bg-neon text-black shadow-[0_0_15px_#00f2ff] font-bold' 
                                : 'text-gray-500 hover:text-white'
                            }`}
                          >
                              FŐ KÜLDETÉSEK
                          </button>
                          <button 
                            onClick={() => setActiveTab('side')}
                            className={`px-4 md:px-8 py-2 rounded-full font-orbitron text-[10px] md:text-xs tracking-widest transition-all duration-300 whitespace-nowrap ${
                                activeTab === 'side' 
                                ? 'bg-alert text-black shadow-[0_0_15px_orange] font-bold' 
                                : 'text-gray-500 hover:text-white'
                            }`}
                          >
                              MELLÉKKÜLDETÉSEK
                          </button>
                      </div>
                  </div>
              </div>

              {/* Main Screen Content Frame */}
              <div className="flex-1 bg-black/40 border-2 border-neon/40 rounded-xl relative overflow-hidden backdrop-blur-sm shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] mx-2 mb-2 flex flex-col">
                  
                  {/* Holographic Grid Background */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] pointer-events-none"></div>

                  {/* Scrollable Content Area */}
                  <div className="flex-1 overflow-y-auto p-8 relative z-10 scrollbar-thin scrollbar-thumb-neon/30 flex items-center justify-center">
                      
                      {activeTab === 'main' && (
                          <div className="w-full flex items-center justify-center animate-fadeIn">
                               {/* Removed fixed aspect ratios and transforms to fix radar disappearing issue */}
                               <div className="w-full max-w-[600px] p-4">
                                   <RadarMap currentPoints={user.totalPoints} onSelectMission={setSelectedMission} />
                               </div>
                          </div>
                      )}

                      {activeTab === 'side' && (
                          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn pb-10 self-start">
                              {[1, 2, 3, 4, 5, 6].map(slotId => {
                                  let requiredPoints = 0;
                                  if (slotId === 2) requiredPoints = 20;
                                  else if (slotId === 3) requiredPoints = 41;
                                  else if (slotId === 4) requiredPoints = 51;
                                  else if (slotId === 5) requiredPoints = 71;
                                  else if (slotId === 6) requiredPoints = 85; 

                                  const isLocked = user.totalPoints < requiredPoints;
                                  
                                  let isCompleted = false;
                                  let title = `ZÁRT SZEKTOR #${slotId}`;
                                  let subTitle = "OFFLINE";
                                  let isClickable = false;
                                  let specialBorder = "";

                                  // --- REMAPPING UI ---
                                  if (slotId === 1) {
                                      title = "OP-01";
                                      subTitle = "RONCSDERBI";
                                      isCompleted = user.completedMissions?.includes('sm1_physics_quiz');
                                      isClickable = true;
                                  }
                                  else if (slotId === 2) {
                                      title = "OP-02";
                                      subTitle = "INERCIARENDSZEREK";
                                      isCompleted = user.completedMissions?.includes('sm2_inertia');
                                      isClickable = true;
                                  }
                                  else if (slotId === 3) {
                                      title = "OP-03";
                                      subTitle = "RUGÓS RAKÉTA";
                                      isCompleted = user.completedMissions?.includes('sm3_rocket');
                                      isClickable = true;
                                  }
                                  else if (slotId === 4) {
                                      title = "OP-04";
                                      subTitle = "ASZTEROIDA MEZŐ";
                                      isCompleted = user.completedMissions?.includes('sm4_arcade_game');
                                      isClickable = true;
                                  }
                                  else if (slotId === 5) {
                                      // WAS SM3
                                      title = "OP-05";
                                      subTitle = "NEWTON BILLIÁRD";
                                      isCompleted = user.completedMissions?.includes('sm3_billiards');
                                      isClickable = true;
                                  }
                                  else if (slotId === 6) {
                                      title = "OP-06";
                                      subTitle = "AERODINAMIKA";
                                      isCompleted = user.completedMissions?.includes('sm6_air_resistance');
                                      isClickable = true;
                                  }

                                  return (
                                      <div 
                                        key={slotId}
                                        onClick={() => !isLocked && !isCompleted && isClickable && handleSideMissionClick(slotId)}
                                        className={`
                                            h-40 p-4 border border-gray-700 bg-black/60 rounded relative group transition-all active:scale-95
                                            ${specialBorder}
                                            ${isLocked 
                                                ? 'opacity-50 grayscale cursor-not-allowed' 
                                                : isCompleted
                                                    ? 'opacity-80 cursor-default border-green-500/30'
                                                    : isClickable ? 'hover:border-alert hover:shadow-[0_0_15px_rgba(255,140,0,0.2)] cursor-pointer' : 'cursor-not-allowed opacity-50'
                                            }
                                        `}
                                      >
                                          <div className="absolute top-0 right-0 p-2 text-[10px] text-gray-500 font-mono">{isLocked ? 'LOCKED' : isCompleted ? 'DONE' : (isClickable ? 'READY' : 'VOID')}</div>
                                          <div className="text-2xl font-orbitron text-white mb-1">{title}</div>
                                          <div className="text-xs text-alert font-mono mb-4">{subTitle}</div>
                                          
                                          {isCompleted && (
                                              <div className="absolute inset-0 bg-green-900/20 flex items-center justify-center border-2 border-green-500/50 rounded backdrop-blur-[1px] z-10">
                                                  <span className="text-green-500 font-bold font-orbitron tracking-widest text-lg shadow-[0_0_10px_black]">TELJESÍTVE</span>
                                              </div>
                                          )}
                                          
                                          {/* Hover Corner accents */}
                                          {!isLocked && !isCompleted && isClickable && (
                                              <>
                                                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-alert opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-alert opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                              </>
                                          )}
                                      </div>
                                  );
                              })}
                          </div>
                      )}
                  </div>

                  {/* Screen Footer Info */}
                  <div className="h-6 border-t border-neon/20 bg-neon/5 flex items-center justify-between px-4 text-[10px] font-mono text-neon/60">
                      <span>DISPLAY_MODE: HOLOGRAPHIC</span>
                      <span>REFRESH: 60Hz</span>
                  </div>
              </div>

          </div>

          {/* --- RIGHT PANEL: DIAGNOSTICS (Decorative) --- */}
          <div className="hidden lg:flex w-24 bg-panel-metal border border-gray-800 rounded-lg flex-col items-center py-6 gap-6 shadow-panel-inset">
               <div className="w-full text-center border-b border-gray-700 pb-2 mb-2">
                   <span className="text-[8px] text-gray-500 rotate-90 inline-block">SYS_R</span>
               </div>
               
               {/* Small Graphs */}
               <div className="w-16 h-10 border border-gray-700 bg-black p-1 flex items-end gap-[1px]">
                   {[40, 60, 30, 80, 50, 90, 40].map((h, idx) => (
                       <div key={idx} style={{height: `${h}%`}} className="w-full bg-alert opacity-70"></div>
                   ))}
               </div>
               <div className="w-16 h-10 border border-gray-700 bg-black p-1 flex flex-col gap-[2px] justify-center">
                   <div className="w-full h-1 bg-neon animate-pulse"></div>
                   <div className="w-3/4 h-1 bg-neon opacity-50"></div>
                   <div className="w-1/2 h-1 bg-neon opacity-30"></div>
               </div>

               <div className="h-px w-12 bg-gray-700 my-2"></div>
               <ToggleSwitch label="LIFE" active={true} color="bg-cyan-500" />
               <ToggleSwitch label="GRAV" active={true} color="bg-cyan-500" />
          </div>

      </main>

      {/* --- BOTTOM DECK: TERMINAL --- */}
      <footer className="h-64 md:h-96 shrink-0 bg-panel-metal border-t border-gray-800 p-2 md:p-4 relative z-30 shadow-2xl">
           <div className="absolute top-2 left-1/2 -ml-2 hidden md:block"><Screw /></div>

           <div className="container mx-auto max-w-5xl h-full flex flex-col">
               <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-neon rounded-full animate-ping"></div>
                       <span className="text-xs font-mono text-neon tracking-[0.2em] font-bold">FEDÉLZETI_AI // TERMINÁL</span>
                   </div>
                   <div className="flex gap-1">
                       <div className="w-8 h-1 bg-gray-700"></div>
                       <div className="w-8 h-1 bg-gray-600"></div>
                       <div className="w-8 h-1 bg-gray-500"></div>
                   </div>
               </div>
               
               <div className="flex-1 bg-black border border-gray-700 rounded-lg overflow-hidden relative shadow-inner">
                   <div className="absolute inset-0 bg-neon/5 pointer-events-none"></div>
                   <TerminalChat studentName={user.name} onPointsAwarded={updatePoints} />
               </div>
           </div>
      </footer>

    </div>
  );
};

export default App;