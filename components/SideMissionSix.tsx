import React, { useState, useEffect, useRef, useCallback } from 'react';
import { submitMissionProgress } from '../services/api';
import { GoogleGenAI, Type, Schema } from '@google/genai';

interface SideMissionSixProps {
  onClose: () => void;
  onPointsAwarded: (newTotal: number) => void;
  onMissionComplete: (missionId: string, newTotal: number) => void;
  studentName: string;
  isCompleted?: boolean;
}

const GRID_SIZE = 7;
const TOTAL_BLOCKS = 6;
const MAX_DESIGNS = 3;

const QUESTIONS = [
  "1. Melyik alakzat esett a leglassabban és miért? (Gondolj a felületre és a közegellenállásra!)",
  "2. Milyen erők hatnak egy szabadon eső testre a levegőben, és mi történik, ha ezek az erők kiegyenlítik egymást?",
  "3. Sorolj fel legalább három különböző típusú erőt, amivel eddigi küldetéseid során találkoztál, és röviden írd le, mit csinálnak!"
];

const SideMissionSix: React.FC<SideMissionSixProps> = ({ onClose, onPointsAwarded, onMissionComplete, studentName, isCompleted }) => {
  const [stage, setStage] = useState<'build' | 'simulate' | 'quiz' | 'grading' | 'result'>('build');
  
  const [designs, setDesigns] = useState<boolean[][][]>([]);
  const [grid, setGrid] = useState<boolean[][]>(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)));
  const [blocksUsed, setBlocksUsed] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Sim state for 3 objects
  const simStateRef = useRef<{y: number, v: number, w: number, finished: boolean}[]>([]);
  const historyRef = useRef<{time: number, v: number}[][]>([[], [], []]);

  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [scores, setScores] = useState<number[]>([0, 0, 0]);
  const [feedback, setFeedback] = useState<string>('');
  const [totalScore, setTotalScore] = useState(0);

  const timeoutSetRef = useRef(false);

  const isAdjacent = (r: number, c: number, g: boolean[][]) => {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && g[nr][nc]) {
          return true;
        }
      }
    }
    return false;
  };

  const handleCellClick = (row: number, col: number) => {
    if (stage !== 'build') return;
    const newGrid = grid.map(r => [...r]);
    if (newGrid[row][col]) {
      setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)));
      setBlocksUsed(0);
      return;
    }
    if (blocksUsed < TOTAL_BLOCKS) {
      if (blocksUsed === 0 || isAdjacent(row, col, newGrid)) {
        newGrid[row][col] = true;
        setBlocksUsed(prev => prev + 1);
        setGrid(newGrid);
      } else {
        alert("A blokkoknak érintkezniük kell egymással!");
      }
    }
  };

  const saveDesign = () => {
    if (blocksUsed === TOTAL_BLOCKS) {
      const newDesigns = [...designs, grid];
      setDesigns(newDesigns);
      setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)));
      setBlocksUsed(0);
      if (newDesigns.length === MAX_DESIGNS) {
        startSimulation(newDesigns);
      }
    }
  };

  const startSimulation = (finalDesigns: boolean[][][]) => {
    setStage('simulate');
    
    simStateRef.current = finalDesigns.map(d => {
      let activeCols = 0;
      for (let c = 0; c < GRID_SIZE; c++) {
        let hasBlock = false;
        for (let r = 0; r < GRID_SIZE; r++) {
          if (d[r][c]) hasBlock = true;
        }
        if (hasBlock) activeCols++;
      }
      return { y: 0, v: 0, w: Math.max(1, activeCols), finished: false };
    });
    historyRef.current = [[], [], []];
  };

  const drawSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, w, h);

    // Draw static stars background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 150; i++) {
      const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * w;
      const y = (Math.cos(i * 678.9) * 0.5 + 0.5) * h;
      const size = 1 + (i % 3);
      ctx.fillRect(x, y, size, size);
    }

    const sectionW = w / 3;
    const groundY = h - 50;

    // Draw ground
    ctx.fillStyle = '#331111';
    ctx.fillRect(0, groundY, w, 50);
    ctx.strokeStyle = '#ff3333';
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();

    const cellSize = 15;

    designs.forEach((design, idx) => {
      const state = simStateRef.current[idx];
      const startX = idx * sectionW + (sectionW - GRID_SIZE * cellSize) / 2;
      const currentY = 50 + state.y;

      // Draw shape
      ctx.fillStyle = '#00f2ff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (design[r][c]) {
            ctx.fillRect(startX + c * cellSize, currentY + r * cellSize, cellSize, cellSize);
            ctx.strokeRect(startX + c * cellSize, currentY + r * cellSize, cellSize, cellSize);
          }
        }
      }

      // HUD
      ctx.fillStyle = '#00f2ff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`V: ${state.v.toFixed(1)} m/s`, idx * sectionW + 20, 30);
      ctx.fillText(`W: ${state.w}`, idx * sectionW + 20, 55);
    });

    // Draw Graph
    const graphW = 300;
    const graphH = 150;
    const graphX = w - graphW - 20;
    const graphY = 20;
    
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(graphX, graphY, graphW, graphH);
    ctx.strokeStyle = '#555';
    ctx.strokeRect(graphX, graphY, graphW, graphH);

    const colors = ['#ff3366', '#33ff66', '#3366ff'];
    historyRef.current.forEach((hist, idx) => {
      if (hist.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = colors[idx];
        ctx.lineWidth = 3;
        const maxV = 40;
        const maxT = 600;
        hist.forEach((pt, i) => {
          const x = graphX + (i / maxT) * graphW;
          const y = graphY + graphH - (pt.v / maxV) * graphH;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
    });

  }, [designs]);

  const loop = useCallback(() => {
    if (stage === 'simulate') {
      const dt = 0.05; // Slower simulation
      const g = 9.81;
      const k = 0.08; 
      const m = TOTAL_BLOCKS; 
      const maxFallDist = canvasRef.current ? canvasRef.current.height - 100 : 400;

      let allFinished = true;

      simStateRef.current.forEach((state, idx) => {
        if (!state.finished) {
          allFinished = false;
          const Fd = k * state.w * state.v * state.v;
          const a = g - (Fd / m);
          state.v += a * dt;
          state.y += state.v * dt * 3; // Scale speed for visual

          historyRef.current[idx].push({ time: historyRef.current[idx].length, v: state.v });

          if (state.y >= maxFallDist) {
            state.y = maxFallDist;
            state.v = 0;
            state.finished = true;
          }
        }
      });

      if (allFinished && stage === 'simulate' && !timeoutSetRef.current) {
        timeoutSetRef.current = true;
        setTimeout(() => setStage('quiz'), 2000);
      }
    }

    drawSimulation();
    if (stage === 'simulate') {
      requestRef.current = requestAnimationFrame(loop);
    }
  }, [stage, drawSimulation]);

  useEffect(() => {
    if (stage === 'simulate') {
      requestRef.current = requestAnimationFrame(loop);
    } else if (stage === 'quiz' || stage === 'grading' || stage === 'result') {
      drawSimulation();
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [stage, loop, drawSimulation]);

  const submitQuiz = async () => {
    setStage('grading');
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY hiányzik.");
      const client = new GoogleGenAI({ apiKey });
      const prompt = `Értékeld a 7. osztályos fizika diák válaszait a közegellenállásról.
      Minden kérdésre 0, 1, 2 vagy 3 pontot adj.
      1. Kérdés: ${QUESTIONS[0]}
      Válasz: ${answers[0]}
      2. Kérdés: ${QUESTIONS[1]}
      Válasz: ${answers[1]}
      3. Kérdés: ${QUESTIONS[2]}
      Válasz: ${answers[2]}
      Válaszolj JSON formátumban: {"scores": [p1, p2, p3], "feedback": "Rövid, cinikus de oktató értékelés a fedélzeti számítógéptől."}`;

      const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          scores: { type: Type.ARRAY, items: { type: Type.INTEGER } },
          feedback: { type: Type.STRING }
        },
        required: ["scores", "feedback"]
      };

      const response = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema }
      });

      const result = JSON.parse(response.text || "{}");
      const newScores = result.scores || [1,1,1];
      const total = newScores.reduce((a: number, b: number) => a + b, 0);
      
      setScores(newScores);
      setFeedback(result.feedback || "Értékelés befejezve.");
      setTotalScore(total);
      setStage('result');

      const missionId = 'sm6_air_resistance';
      const newTotalPoints = await submitMissionProgress(studentName, total, missionId);
      onPointsAwarded(newTotalPoints);
      if (total === 9) onMissionComplete(missionId, newTotalPoints);

    } catch (error) {
      setScores([1, 1, 1]);
      setTotalScore(3);
      setFeedback("Rendszerhiba. Kaptál 3 vigaszdíjpontot.");
      setStage('result');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-[#0a0b10] border border-neon/30 rounded-xl shadow-[0_0_50px_rgba(0,242,255,0.1)] w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="shrink-0 bg-black/90 backdrop-blur border-b border-neon/30 p-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-orbitron text-neon tracking-widest">OP-06 // EJTŐERNYŐ TERVEZÉS</h2>
            <div className="text-xs font-mono text-gray-400">AERODINAMIKAI TERVEZŐ MODUL</div>
          </div>
          <button onClick={onClose} className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-mono rounded font-bold">
              BEZÁRÁS [X]
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 relative space-y-8">
          {isCompleted && stage === 'build' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                <div className="bg-green-900/80 border-2 border-green-500 p-8 rounded-xl text-center shadow-[0_0_50px_rgba(34,197,94,0.5)]">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-3xl font-orbitron text-green-400 font-bold tracking-widest mb-2">KÜLDETÉS TELJESÍTVE</h2>
                </div>
            </div>
        )}

        {stage === 'build' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="text-xl font-orbitron text-neon mb-4">TERVEZŐASZTAL ({designs.length + 1} / {MAX_DESIGNS})</h3>
              <p className="text-gray-400 font-mono text-sm mb-6">
                Építs egy testet pontosan {TOTAL_BLOCKS} egybefüggő blokkból! 
                Cél: Készíts minél nagyobb légellenállású (leglassabban eső) alakzatot!
                Kattints egy már lerakott blokkra a törléshez.
              </p>

              <div className="flex justify-center mb-6">
                <div className="grid grid-cols-7 gap-1 bg-gray-900 p-2 rounded border border-gray-700">
                  {grid.map((row, rIdx) => (
                    row.map((isActive, cIdx) => (
                      <div 
                        key={`${rIdx}-${cIdx}`}
                        onClick={() => handleCellClick(rIdx, cIdx)}
                        className={`w-12 h-12 border cursor-pointer transition-colors ${isActive ? 'bg-neon border-white shadow-[0_0_10px_rgba(0,242,255,0.8)]' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
                      />
                    ))
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center font-mono">
                <div className="text-gray-300">
                  Blokkok: <span className={blocksUsed === TOTAL_BLOCKS ? 'text-green-400 font-bold' : 'text-yellow-400'}>{blocksUsed} / {TOTAL_BLOCKS}</span>
                </div>
                <button 
                  onClick={saveDesign}
                  disabled={blocksUsed !== TOTAL_BLOCKS}
                  className={`px-6 py-2 font-orbitron font-bold rounded transition-all ${blocksUsed === TOTAL_BLOCKS ? 'bg-neon text-black hover:scale-105 shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                >
                  {designs.length === MAX_DESIGNS - 1 ? 'SZIMULÁCIÓ INDÍTÁSA' : 'ALAKZAT MENTÉSE'}
                </button>
              </div>
            </div>
            
            <div className="bg-white/5 p-6 rounded-xl border border-white/10 flex flex-col justify-center">
              <div className="text-center space-y-4">
                <div className="text-4xl">☄️</div>
                <h4 className="text-lg font-orbitron text-white">AERODINAMIKA</h4>
                <p className="text-gray-400 font-mono text-sm">
                  Tervezz három különböző ejtőernyőt! A Földre való visszatérésnél ez az ejtőernyő fog minket lassítani. Fontos, hogy minél lassabban érjünk földet!
                </p>
                <div className="flex justify-center gap-4 mt-4">
                   {designs.map((_, i) => (
                       <div key={i} className="w-10 h-10 bg-neon/20 border border-neon rounded flex items-center justify-center text-neon font-bold">
                           {i + 1}
                       </div>
                   ))}
                   {Array(MAX_DESIGNS - designs.length).fill(0).map((_, i) => (
                       <div key={i} className="w-10 h-10 bg-gray-800 border border-gray-700 rounded flex items-center justify-center text-gray-600">
                           ?
                       </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {(stage === 'simulate' || stage === 'quiz' || stage === 'grading' || stage === 'result') && (
          <div className="flex flex-col items-center space-y-4 mb-8">
            <h3 className="text-xl font-orbitron text-neon">
              {stage === 'simulate' ? 'SZIMULÁCIÓ FOLYAMATBAN...' : 'SZIMULÁCIÓ EREDMÉNYE'}
            </h3>
            <div className="w-full max-w-6xl bg-black border-2 border-gray-800 rounded relative shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden shrink-0 flex justify-center items-center">
              <canvas ref={canvasRef} width={1200} height={700} className="w-full h-auto object-contain" />
            </div>
          </div>
        )}

        {stage === 'quiz' && (
          <div className="bg-[#0f1115] border border-gray-800 p-8 rounded-xl max-w-4xl mx-auto animate-fadeIn">
            <div className="flex items-center gap-4 mb-6 border-b border-gray-800 pb-4">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center border-2 border-neon">
                <span className="text-3xl">🤖</span>
              </div>
              <div>
                <h3 className="text-xl font-orbitron text-neon">FEDÉLZETI SZÁMÍTÓGÉP</h3>
                <p className="text-gray-400 font-mono text-sm">Értékelési protokoll aktiválva.</p>
              </div>
            </div>
            <div className="space-y-6">
              {QUESTIONS.map((q, idx) => (
                <div key={idx} className="space-y-2">
                  <label className="block text-neon font-mono font-bold">{q}</label>
                  <textarea 
                    value={answers[idx]}
                    onChange={(e) => {
                        const newAnswers = [...answers];
                        newAnswers[idx] = e.target.value;
                        setAnswers(newAnswers);
                    }}
                    className="w-full h-20 bg-gray-900 border border-gray-700 rounded p-3 text-white font-mono focus:border-neon focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button 
                onClick={submitQuiz}
                disabled={answers.some(a => a.trim().length < 5)}
                className={`px-8 py-3 font-orbitron font-bold rounded ${answers.some(a => a.trim().length < 5) ? 'bg-gray-800 text-gray-600' : 'bg-neon text-black hover:scale-105'}`}
              >
                VÁLASZOK BEKÜLDÉSE
              </button>
            </div>
          </div>
        )}

        {stage === 'grading' && (
          <div className="flex flex-col items-center justify-center h-64 space-y-6">
            <div className="w-16 h-16 border-4 border-neon border-t-transparent rounded-full animate-spin"></div>
            <h3 className="text-xl font-orbitron text-neon animate-pulse">ÉRTÉKELÉS FOLYAMATBAN...</h3>
          </div>
        )}

        {stage === 'result' && (
          <div className="bg-[#0f1115] border border-gray-800 p-8 rounded-xl max-w-4xl mx-auto animate-fadeIn">
            <div className="flex items-center gap-4 mb-6 border-b border-gray-800 pb-4">
              <div>
                <h3 className="text-xl font-orbitron text-neon">ÉRTÉKELÉS EREDMÉNYE</h3>
                <div className="text-2xl font-bold text-white mt-1">ÖSSZESEN: <span className={totalScore === 9 ? 'text-green-400' : 'text-yellow-400'}>{totalScore} / 9 PONT</span></div>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-700 p-4 rounded mb-8">
              <p className="text-gray-300 font-mono italic">"{feedback}"</p>
            </div>
            <div className="flex justify-between items-center border-t border-gray-800 pt-6">
              {totalScore < 9 && (
                <button 
                  onClick={() => {
                    setStage('build');
                    setDesigns([]);
                    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)));
                    setBlocksUsed(0);
                    setAnswers(['', '', '']);
                    timeoutSetRef.current = false;
                  }}
                  className="px-6 py-3 bg-gray-800 text-white font-orbitron font-bold rounded hover:bg-gray-700"
                >
                  ÚJRA TERVEZÉS
                </button>
              )}
              <button onClick={onClose} className="px-8 py-3 bg-neon text-black font-orbitron font-bold rounded hover:scale-105">
                VISSZA A RADARHOZ
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default SideMissionSix;
