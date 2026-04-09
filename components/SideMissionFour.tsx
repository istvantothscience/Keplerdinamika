import React, { useState, useEffect, useRef, useCallback } from 'react';
import { submitMissionProgress } from '../services/api';

// --- ICONS (Inline SVGs) ---
const Heart: React.FC<{ className?: string; size?: number }> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const Play: React.FC<{ className?: string; size?: number }> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const RefreshCw: React.FC<{ className?: string; size?: number }> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

const Trophy: React.FC<{ className?: string; size?: number }> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M8 22v-1" />
    <path d="M16 22v-1" />
    <path d="M12 15a7 7 0 0 0 7-7V4H5v4a7 7 0 0 0 7 7Z" />
    <path d="M12 15v7" />
  </svg>
);

const AlertTriangle: React.FC<{ className?: string; size?: number }> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const ShieldAlert: React.FC<{ className?: string; size?: number }> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);

// --- TÍPUS DEFINÍCIÓK ---

type GameState = 'start' | 'playing' | 'paused_for_quiz' | 'gameover' | 'victory';

interface Obstacle {
  id: number;
  x: number;
  y: number;
  type: 'asteroid' | 'debris' | 'satellite';
  width: number;
  height: number;
  speed: number;
  rotation: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

interface Question {
  id: number;
  topic: string;
  question: string;
  answers: string[];
  correctIdx: number;
}

interface SideMissionFourProps {
  onClose: () => void;
  onPointsAwarded: (newTotal: number) => void;
  onMissionComplete: (missionId: string, newTotal: number) => void;
  studentName: string;
}

// --- FIZIKAI ADATBÁZIS ---
const QUESTIONS: Question[] = [
  {
    id: 1,
    topic: "1. óra: Az Erő fogalma",
    question: "Az 'Erő-detektívek' feladatban mit állapítottunk meg: milyen hatása lehet egy erőnek?",
    answers: [
      "Csak mozgásállapotot változtat meg.",
      "Csak alakot változtat meg.",
      "Mozgásállapotot és/vagy alakot változtat meg.",
      "Csak vákuumban van hatása."
    ],
    correctIdx: 2
  },
  {
    id: 2,
    topic: "2. óra: Tehetetlenség",
    question: "A 'Tehetetlenségi trükkök' során miért esik az érme a pohárba, ha a lapot hirtelen kiütjük?",
    answers: [
      "Mert a lap magával rántja a súrlódás miatt.",
      "Mert a tehetetlensége miatt megőrzi nyugalmi helyzetét, míg a gravitáció le nem húzza.",
      "Mert a légnyomás benyomja a pohárba.",
      "Mert az érme mágneses."
    ],
    correctIdx: 1
  },
  {
    id: 3,
    topic: "2. óra: Mérés",
    question: "A rugós erőmérő használatakor milyen összefüggést használunk ki?",
    answers: [
      "A rugó megnyúlása egyenesen arányos a nyújtóerővel.",
      "A rugó megnyúlása fordítottan arányos a tömeggel.",
      "A rugó színe változik az erő hatására.",
      "A rugó csak hő hatására nyúlik meg."
    ],
    correctIdx: 0
  },
  {
    id: 4,
    topic: "3. óra: Dinamika alaptörvénye",
    question: "A 'Lufi-rakéta versenyen': Ha növeljük a lufi tömegét (teher), de a hajtóerő ugyanaz marad...",
    answers: [
      "A gyorsulás növekedni fog.",
      "A gyorsulás csökkeni fog (nehezebben gyorsul).",
      "A gyorsulás nem változik.",
      "A lufi el sem indul."
    ],
    correctIdx: 1
  },
  {
    id: 5,
    topic: "3. óra: Newton II.",
    question: "Mi a képlete Newton II. törvényének (Dinamika alaptörvénye)?",
    answers: [
      "F = m / a",
      "a = F * m",
      "F = m * a",
      "m = F * a"
    ],
    correctIdx: 2
  }
];

// --- RÉSZLETES RAKÉTA KOMPONENS (SVG) ---
const DetailedRocket: React.FC<{ style: React.CSSProperties, isInvulnerable: boolean }> = ({ style, isInvulnerable }) => (
  <svg style={style} viewBox="0 0 200 100" overflow="visible" className={isInvulnerable ? 'animate-pulse' : ''}>
    {/* Lángcsóva animáció */}
    <path d="M-40 40 Q-80 50 -40 60 L-10 50 Z" fill="#ff8c00">
      <animate attributeName="d" dur="0.1s" repeatCount="indefinite"
        values="M-40 40 Q-80 50 -40 60 L-10 50 Z; M-35 42 Q-70 50 -35 58 L-10 50 Z; M-40 40 Q-80 50 -40 60 L-10 50 Z" />
    </path>
    <path d="M-20 45 Q-50 50 -20 55 L-5 50 Z" fill="#ffff00">
        <animate attributeName="opacity" values="0.8;1;0.8" dur="0.2s" repeatCount="indefinite" />
    </path>

    {/* Hátsó szárnyak */}
    <path d="M20 50 L0 10 L60 40 Z" fill="#D32F2F" stroke="#8c1b1b" strokeWidth="2" /> {/* Felső */}
    <path d="M20 50 L0 90 L60 60 Z" fill="#D32F2F" stroke="#8c1b1b" strokeWidth="2" /> {/* Alsó */}

    {/* Test (Törzs) */}
    <path d="M10 50 C10 20 50 20 160 50 C50 80 10 80 10 50 Z" fill="url(#metalGradient)" stroke="#555" strokeWidth="2" />
    
    {/* Gradiens definíció */}
    <defs>
      <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#999" />
        <stop offset="50%" stopColor="#eee" />
        <stop offset="100%" stopColor="#999" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    {/* Pilótafülke (Neon cián üveg) */}
    <ellipse cx="110" cy="45" rx="30" ry="12" fill="#00f2ff" stroke="#fff" strokeWidth="2" opacity="0.8" filter="url(#glow)" />
    
    {/* Oldalcsíkok */}
    <rect x="50" y="48" width="60" height="4" fill="#333" />
    
    {/* Orr rész */}
    <path d="M160 50 Q180 50 190 50 L160 50" fill="#D32F2F" />
  </svg>
);

const SideMissionFour: React.FC<SideMissionFourProps> = ({ onClose, onPointsAwarded, onMissionComplete, studentName }) => {
  // --- STATE MANAGEMENT ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rocketRef = useRef<HTMLDivElement>(null);

  const [gameState, setGameState] = useState<GameState>('start');
  const [lives, setLives] = useState(5);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [maxScoreReached, setMaxScoreReached] = useState(false);

  // Game Loop References
  const rocketPos = useRef(300); // Virtual Height: 600px
  const velocity = useRef(0);
  const obstacles = useRef<Obstacle[]>([]);
  const stars = useRef<Star[]>([]);
  const keys = useRef<{ [key: string]: boolean }>({});
  const lastTime = useRef(0);
  const gameSpeed = useRef(1.0);
  const timeSinceLastQuiz = useRef(0);
  const requestRef = useRef<number>(0);
  const isInvulnerable = useRef(false);

  // --- CSILLAG INICIALIZÁLÁS ---
  const initStars = useCallback(() => {
    const starCount = 100;
    const newStars: Star[] = [];
    for(let i=0; i<starCount; i++) {
        newStars.push({
            x: Math.random() * 1024,
            y: Math.random() * 600,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.8 + 0.2
        });
    }
    stars.current = newStars;
  }, []);

  // --- SUPABASE MENTÉS ---
  const saveScore = async (finalLives: number) => {
    try {
        const missionId = "sm4_arcade_game"; // CHANGED ID TO SM4
        const newTotal = await submitMissionProgress(studentName, finalLives, missionId);
        onPointsAwarded(newTotal);
        if (finalLives >= 8) {
            onMissionComplete(missionId, newTotal);
            setMaxScoreReached(true);
        }
    } catch (e) {
        console.error("Score save failed", e);
    }
  };

  // --- IRÁNYÍTÁS ---
  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => keys.current[e.code] = true;
    const handleUp = (e: KeyboardEvent) => keys.current[e.code] = false;
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    
    initStars();
    if (requestRef.current === 0) {
        const timer = setTimeout(() => draw(), 100);
        return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, [initStars]);

  // --- GAME LOOP ---
  const update = useCallback((time: number) => {
    if (gameState !== 'playing') return;

    const deltaTime = time - lastTime.current;
    lastTime.current = time;

    // 1. Rakéta fizika
    if (keys.current['ArrowUp']) velocity.current = -7;
    else if (keys.current['ArrowDown']) velocity.current = 7;
    else velocity.current *= 0.92;

    rocketPos.current += velocity.current;
    
    // Falak
    if (rocketPos.current < 40) rocketPos.current = 40;
    if (rocketPos.current > 560) rocketPos.current = 560;

    // KÖZVETLEN DOM FRISSÍTÉS
    if (rocketRef.current) {
        const pct = (rocketPos.current / 600) * 100;
        rocketRef.current.style.top = `${pct}%`;
        rocketRef.current.style.transform = `translateY(-50%)`;
    }

    // 2. Csillagok mozgatása
    stars.current.forEach(star => {
        star.x -= star.speed * (gameSpeed.current || 1); 
        if (star.x < 0) {
            star.x = 1024;
            star.y = Math.random() * 600;
        }
    });

    // 3. Akadályok menedzselése
    if (Math.random() < 0.015 * gameSpeed.current) {
      const typeRnd = Math.random();
      obstacles.current.push({
        id: Date.now() + Math.random(),
        x: 950,
        y: Math.random() * 500 + 50,
        type: typeRnd > 0.8 ? 'satellite' : (typeRnd > 0.4 ? 'asteroid' : 'debris'),
        width: typeRnd > 0.4 ? 50 : 30,
        height: typeRnd > 0.4 ? 50 : 30,
        speed: (4 + Math.random() * 3) * gameSpeed.current,
        rotation: 0
      });
    }

    obstacles.current.forEach(obs => {
      obs.x -= obs.speed;
      obs.rotation += 0.02 * obs.speed;
    });

    obstacles.current = obstacles.current.filter(obs => obs.x > -100);

    // 4. Ütközésvizsgálat
    if (!isInvulnerable.current) {
      const rocketRect = { x: 50, y: rocketPos.current - 15, w: 100, h: 40 };
      obstacles.current.forEach(obs => {
        if (
          rocketRect.x < obs.x + obs.width &&
          rocketRect.x + rocketRect.w > obs.x &&
          rocketRect.y < obs.y + obs.height &&
          rocketRect.y + rocketRect.h > obs.y
        ) {
          handleCollision();
        }
      });
    }

    // 5. Játékmenet logika
    timeSinceLastQuiz.current += deltaTime;
    gameSpeed.current += 0.0002;

    // KVÍZ TRIGGER (30mp)
    if (timeSinceLastQuiz.current > 30000 && questionIdx < QUESTIONS.length) {
      setGameState('paused_for_quiz');
    }

    draw();
    requestRef.current = requestAnimationFrame(update);
  }, [gameState, questionIdx]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Háttér csillagok
    stars.current.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Akadályok
    obstacles.current.forEach(obs => {
      ctx.save();
      ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);
      ctx.rotate(obs.rotation);

      if (obs.type === 'asteroid') {
        ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.arc(0, 0, obs.width / 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(-5, -5, 6, 0, Math.PI * 2); ctx.fill();
      } else if (obs.type === 'debris') {
        ctx.fillStyle = '#a52a2a';
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
      } else {
        ctx.fillStyle = '#ccc';
        ctx.fillRect(-15, -10, 30, 20);
        ctx.fillStyle = '#00f2ff';
        ctx.fillRect(-25, -5, 10, 10); ctx.fillRect(15, -5, 10, 10);
      }
      ctx.restore();
    });
    
    if (isInvulnerable.current) {
        ctx.globalAlpha = 0.5;
    } else {
        ctx.globalAlpha = 1.0;
    }
  };

  // --- EVENT HANDLERS ---

  const startGame = () => {
    if (maxScoreReached) return;

    setLives(5);
    setQuestionIdx(0);
    setGameState('playing');
    
    rocketPos.current = 300;
    obstacles.current = [];
    initStars();
    gameSpeed.current = 1.0;
    timeSinceLastQuiz.current = 0;
    lastTime.current = performance.now();
    isInvulnerable.current = false;
    
    if (rocketRef.current) {
        rocketRef.current.style.top = '50%';
        rocketRef.current.style.transform = 'translateY(-50%)';
    }

    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(update);
  };

  const handleCollision = () => {
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        endGame(false, 0);
        return 0;
      }
      return newLives;
    });

    isInvulnerable.current = true;
    setTimeout(() => { isInvulnerable.current = false; }, 2000);
  };

  const handleQuizAnswer = (idx: number) => {
    const currentQ = QUESTIONS[questionIdx];
    let newLives = lives;

    if (idx === currentQ.correctIdx) {
      newLives = lives + 1;
    } else {
      newLives = lives - 1;
    }

    setLives(newLives);
    setQuestionIdx(prev => prev + 1);
    timeSinceLastQuiz.current = 0;

    if (newLives <= 0) {
      endGame(false, newLives);
      return;
    }

    if (questionIdx + 1 >= QUESTIONS.length) {
      endGame(true, newLives);
    } else {
      setGameState('playing');
      lastTime.current = performance.now();
      requestRef.current = requestAnimationFrame(update);
    }
  };

  const endGame = (victory: boolean, finalLives: number) => {
    setGameState(victory ? 'victory' : 'gameover');
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    const saveVal = Math.max(0, finalLives);
    saveScore(saveVal);
  };

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, update]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0b10] overflow-hidden font-mono text-gray-200">
        
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-neon/30 p-4 flex justify-between items-center shadow-[0_0_20px_rgba(0,242,255,0.1)] shrink-0">
        <div>
          <h2 className="text-2xl font-orbitron text-neon tracking-widest">OP-04 // ASZTEROIDA MEZŐ</h2>
          <div className="text-xs font-mono text-gray-400">ARCADE SZIMULÁCIÓ V1.0</div>
        </div>
        <button 
            onClick={onClose}
            className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-mono rounded uppercase font-bold"
        >
            Bezárás [X]
        </button>
      </div>

      {/* Main Game Container */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden p-4">
        
        {/* Animated Space Background */}
        <div className="absolute inset-0 z-0">
             <div className="absolute inset-0 bg-[radial-gradient(white_1px,transparent_1px)] bg-[size:50px_50px] opacity-20 animate-[scan_20s_linear_infinite] direction-reverse"></div>
             <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        </div>
        
        <div className="relative w-full max-w-6xl aspect-[1024/600] max-h-[75vh] border border-gray-700 bg-[#0a0e14] rounded-xl overflow-hidden shadow-2xl">

            {/* RAKÉTA */}
            <div 
                ref={rocketRef}
                style={{
                    position: 'absolute',
                    left: '5%', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    width: '12%', 
                    height: '10%',
                    zIndex: 10,
                }}
            >
                <DetailedRocket style={{ width: '100%', height: '100%' }} isInvulnerable={isInvulnerable.current} />
            </div>

            {/* CANVAS */}
            <canvas ref={canvasRef} width={1024} height={600} className="absolute top-0 left-0 w-full h-full z-5" />

            {/* HUD */}
            <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between z-20 pointer-events-none">
                <div className="bg-black/60 backdrop-blur border border-neon/30 px-3 py-1 md:px-4 md:py-2 rounded flex items-center gap-2 md:gap-4 text-neon text-sm md:text-base">
                    <span className="font-orbitron font-bold">SEBESSÉG</span>
                    <span className="font-mono opacity-80">{gameSpeed.current.toFixed(2)}x</span>
                </div>
                
                <div className="bg-black/60 backdrop-blur border border-red-500/30 px-3 py-1 md:px-4 md:py-2 rounded flex gap-1 md:gap-2 items-center">
                    {Array.from({ length: Math.min(Math.max(0, lives), 8) }).map((_, i) => (
                        <Heart key={i} className="text-red-500 fill-red-500 w-4 h-4 md:w-6 md:h-6" />
                    ))}
                    {lives > 8 && <span className="text-red-500 font-bold ml-2">+{lives-8}</span>}
                </div>
            </div>

            {/* START SCREEN */}
            {gameState === 'start' && (
                <div className="absolute inset-0 bg-black/90 z-30 flex flex-col items-center justify-center text-center p-8">
                    <h1 className="text-3xl md:text-5xl font-orbitron text-neon mb-4 drop-shadow-[0_0_20px_#00f2ff]">ASZTEROIDA MEZŐ</h1>
                    <p className="max-w-xl text-gray-400 mb-8 font-mono leading-relaxed text-sm md:text-base">
                        A navigációs rendszerek leálltak. Vezesd át a Newton-1-et a törmeléken manuálisan!
                        <br/>Válaszolj a felugró <strong className="text-white">fizikai kérdésekre</strong>, hogy javítsd a pajzs integritását.
                    </p>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-lg text-left space-y-2 mb-8 font-mono text-xs md:text-sm">
                        <div>⬆️ FEL / ⬇️ LE nyilak: Mozgás</div>
                        <div>⏱️ 30 másodpercenként: Fizikai Kvíz</div>
                        <div>❤️ Helyes válasz: <span className="text-green-400">+1 Élet</span></div>
                        <div>💀 Helytelen válasz: <span className="text-red-400">-1 Élet</span></div>
                    </div>
                    {maxScoreReached ? (
                        <div className="border border-alert text-alert p-4 bg-alert/10 font-bold uppercase tracking-widest">
                            Maximális pontszám (8) elérve. Játék lezárva.
                        </div>
                    ) : (
                        <button onClick={startGame} className="flex items-center gap-2 px-8 py-4 bg-neon/10 border border-neon text-neon hover:bg-neon hover:text-black hover:shadow-[0_0_20px_#00f2ff] transition-all font-orbitron font-bold text-lg md:text-xl rounded uppercase tracking-widest">
                            <Play size={24} /> Indítás
                        </button>
                    )}
                </div>
            )}

            {/* QUIZ MODAL */}
            {gameState === 'paused_for_quiz' && (
                <div className="absolute inset-0 bg-black/95 z-40 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl bg-panel-dark border-2 border-alert rounded-xl p-6 md:p-8 shadow-[0_0_50px_rgba(255,140,0,0.2)]">
                        <div className="flex items-center gap-3 text-alert mb-4 md:mb-6 border-b border-gray-800 pb-4">
                            <AlertTriangle size={28} />
                            <h2 className="text-xl md:text-2xl font-orbitron">FIZIKAI ANOMÁLIA ({questionIdx + 1}/{QUESTIONS.length})</h2>
                        </div>
                        
                        <div className="mb-6 md:mb-8">
                            <div className="text-neon text-xs font-mono uppercase tracking-widest mb-2">{QUESTIONS[questionIdx].topic}</div>
                            <p className="text-lg md:text-xl text-white font-bold leading-relaxed">{QUESTIONS[questionIdx].question}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {QUESTIONS[questionIdx].answers.map((ans, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleQuizAnswer(idx)}
                                    className="text-left p-4 bg-white/5 border border-gray-700 hover:border-alert hover:bg-alert/10 hover:text-white text-gray-300 transition-all rounded font-mono text-xs md:text-sm"
                                >
                                    {ans}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* GAME OVER / VICTORY SCREEN */}
            {(gameState === 'gameover' || gameState === 'victory') && (
                <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-8 text-center">
                    {gameState === 'victory' ? (
                        <>
                            <Trophy size={80} className="text-neon mb-4 animate-bounce" />
                            <h1 className="text-4xl md:text-5xl font-orbitron text-neon mb-2">KÜLDETÉS TELJESÍTVE</h1>
                            <p className="text-white mb-8">Sikeresen átjutottál a mezőn.</p>
                        </>
                    ) : (
                        <>
                            <ShieldAlert size={80} className="text-red-500 mb-4 animate-pulse" />
                            <h1 className="text-4xl md:text-5xl font-orbitron text-red-500 mb-2">KÜLDETÉS SIKERTELEN</h1>
                            <p className="text-white mb-8">A pajzsrendszerek leálltak.</p>
                        </>
                    )}
                    
                    <div className="bg-white/5 px-8 py-4 rounded border border-white/10 mb-8">
                        <h2 className="text-gray-400 text-sm font-mono uppercase mb-1">Végső Pontszám (Életek)</h2>
                        <span className="text-4xl font-orbitron text-white">{lives}</span>
                    </div>
                    
                    {maxScoreReached && gameState === 'victory' ? (
                         <div className="border border-green-500 text-green-500 p-4 bg-green-900/20 font-bold uppercase tracking-widest">
                            Jutalompontok rögzítve.
                        </div>
                    ) : (
                        <button onClick={startGame} className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-gray-500 text-white hover:bg-white hover:text-black transition-all font-orbitron font-bold text-lg rounded uppercase">
                            <RefreshCw size={20} /> Újraindítás
                        </button>
                    )}
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default SideMissionFour;