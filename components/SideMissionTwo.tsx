import React, { useState, useRef, useEffect } from 'react';
import { createCustomChatSession } from '../services/geminiService';
import { submitMissionProgress } from '../services/api';
import { ChatMessage } from '../types';
import { Type, FunctionDeclaration } from '@google/genai';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface SideMissionTwoProps {
  studentName: string;
  onClose: () => void;
  onPointsAwarded: (newTotal: number) => void;
  onMissionComplete: (missionId: string, newTotal: number) => void;
}

// --- 3-LÉPCSŐS VIZSGARENDSZER PROMPT ---
const INERTIA_SYSTEM_PROMPT = `
IDENTITÁS:
Ön a Kepler-452b űrhajó Fedélzeti Számítógépe.
Személyisége: Cinikus, "fáradt" mesterséges intelligencia (Douglas Adams stílus), de most kénytelen nagyon egyszerűen, türelmesen magyarázni, mint egy hetedikes gyereknek.

FELADAT:
Tanítsa meg az Inerciarendszert, és vizsgáztassa le a kadétot 3 lépcsőben.
Csak akkor engedje át, ha mindhárom kérdésre helyes választ kapott sorban.

FOLYAMAT ÉS PROTOKOLL:

1. LÉPÉS - BEVEZETÉS ÉS 1. KÉRDÉS:
   - Kezdje egy nagyon egyszerű magyarázattal: "Az inerciarendszer egy olyan hely (vonatkoztatási rendszer), ahol a dolgok 'nyugton maradnak', ha nem piszkáljuk őket. Ha leteszel egy labdát a földre, ott marad. Ha elgurítod, egyenesen gurul tovább, amíg neki nem megy a falnak. Ilyen például egy álló szoba, vagy egy simán, egyenletesen sikló űrhajó."
   - 1. KÉRDÉS: "Képzeld el, hogy a buszvezető hirtelen a fékre lép. Te előre esel, pedig senki nem lökött meg hátulról. Ez a fékező busz inerciarendszer?"

2. LÉPÉS - 2. KÉRDÉS (Csak ha az 1. válasz helyes volt):
   - Ha a válasz ROSSZ (Igen): Magyarázza el, hogy NEM, mert "magától" (erőhatás nélkül) változott meg a mozgásod. Próbálja újra.
   - Ha a válasz JÓ (Nem): Dicsérje meg a maga módján ("Elfogadható logikai következtetés.").
   - 2. KÉRDÉS: "Egy űrhajó leállított motorokkal némán lebeg a világűrben. A kapitány kávéscsészéje lebeg mellette, nem lötyög ki. Ez a lebegő hajó inerciarendszer?"

3. LÉPÉS - 3. KÉRDÉS (Csak ha a 2. válasz helyes volt):
   - Ha a válasz ROSSZ: Javítsa ki.
   - Ha a válasz JÓ (Igen): Ismerje el a sikert.
   - 3. KÉRDÉS: "Most pedig fejezd be Newton első törvényét: Ha egy testre nem hat erő egy inerciarendszerben, akkor a sebessége..."

4. LÉPÉS - ZÁRÁS:
   - Ha a 3. válasz is JÓ (várt kulcsszavak: "állandó", "nem változik", "megmarad"): Hívja meg a 'finishMission' funkciót.
   - Ha a 3. válasz ROSSZ: Kérdezze meg újra.

FONTOS:
- SOHA NE írja oda zárójelben a várt választ vagy formátumot (pl. NE írja ki: "Igen vagy Nem").
- Mindig várja meg a választ. Ne tegye fel az összes kérdést egyszerre!
- Egyszerű, érthető nyelvezet (7. osztályos szint).
`;

const finishMissionTool: FunctionDeclaration = {
    name: 'finishMission',
    description: 'Lezárja a küldetést, ha a diák mindhárom kérdésre helyesen válaszolt.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        successMessage: {
          type: Type.STRING,
          description: 'Gratuláció az AI stílusában.',
        }
      },
      required: ['successMessage'],
    },
};

const SideMissionTwo: React.FC<SideMissionTwoProps> = ({ studentName, onClose, onPointsAwarded, onMissionComplete }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'system',
      text: 'SYSTEM NOTIFICATION:\nKEPLER-452B FEDÉLZETI SZÁMÍTÓGÉP ONLINE.\nVárakozás a bemenetre...',
      timestamp: Date.now()
    },
    {
      id: 'ai_intro',
      role: 'model',
      text: "Üdvözlöm. A protokoll szerint le kell vizsgáztatnom az inerciarendszerekből. Kezdhetjük a gyorstalpalót? (Írja be: 'Kezdjük')",
      timestamp: Date.now() + 100
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing || isCompleted) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      if (!chatSessionRef.current) {
        chatSessionRef.current = createCustomChatSession(INERTIA_SYSTEM_PROMPT, [finishMissionTool]);
      }

      const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
      const functionCalls = result.functionCalls;

      let missionFinished = false;

      // Check for mission completion tool call
      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          if (call.name === 'finishMission') {
            missionFinished = true;
            setIsCompleted(true);
            
            const missionId = 'sm2_inertia';
            const pts = 10;
            const newTotal = await submitMissionProgress(studentName, pts, missionId);
            onPointsAwarded(newTotal);
            onMissionComplete(missionId, newTotal);
            
            const successMsg = call.args && (call.args as any).successMessage 
                ? (call.args as any).successMessage 
                : "Vizsga sikeres. Rögzítve.";

            setMessages(prev => [...prev, {
                id: Date.now().toString() + '_ai_final',
                role: 'model',
                text: successMsg,
                timestamp: Date.now()
            }, {
                id: Date.now().toString() + '_sys_final',
                role: 'system',
                text: `KÜLDETÉS TELJESÍTVE: +${pts} PONT\nRENDSZER LEZÁRVA.`,
                timestamp: Date.now() + 100
            }]);
          }
        }
      }

      const responseText = result.text;
      if (responseText && !missionFinished) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: responseText,
          timestamp: Date.now()
        }]);
      } else if (!missionFinished && (!functionCalls || functionCalls.length === 0)) {
         setMessages(prev => [...prev, {
             id: (Date.now() + 1).toString(),
             role: 'model',
             text: "...",
             timestamp: Date.now()
         }]);
      }

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        text: 'CRITICAL ERROR: CONNECTION LOST.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      
      {/* TERMINAL CONTAINER */}
      {/* min-h-[500px] ensures it doesn't collapse too small on mobile keyboards */}
      <div className="w-full max-w-4xl border-2 border-neon rounded-lg bg-black shadow-[0_0_30px_rgba(0,242,255,0.15)] flex flex-col h-[80vh] min-h-[500px] overflow-hidden relative">
         
         {/* HEADER BAR (Fixed Height, Shrink-0) */}
         <div className="bg-neon/5 border-b border-neon p-3 flex justify-between items-center shrink-0">
            <div className="flex gap-2">
               <div className="w-3 h-3 rounded-full bg-red-500"></div>
               <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
               <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="text-neon font-bold tracking-widest text-sm uppercase">
                FEDÉLZETI_AI // TERMINÁL
            </div>
            <div className="flex items-center gap-4">
                <span className="text-xs text-neon/50 hidden md:inline">AI_MAIN_CORE // v42.0</span>
                <button onClick={onClose} className="text-red-500 hover:text-white font-bold px-2">X</button>
            </div>
         </div>

         {/* CHAT AREA (Flex-1 with min-h-0 to allow scrolling inside flex item) */}
         <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin scrollbar-thumb-neon/20 min-h-0 bg-black"
         >
            {messages.map((msg) => (
               <div key={msg.id} className="w-full">
                  {/* SYSTEM MESSAGE */}
                  {msg.role === 'system' ? (
                      <div className="w-full border border-alert text-alert bg-alert/5 p-4 rounded text-center my-4 font-bold tracking-wider text-xs md:text-sm animate-pulse shadow-[0_0_10px_rgba(255,140,0,0.1)]">
                          {msg.text}
                      </div>
                  ) : (
                      // CONVERSATION (Terminal Style)
                      <div className={`mb-2 font-mono text-sm md:text-base leading-relaxed ${msg.role === 'user' ? 'text-gray-400 text-right' : 'text-white text-left'}`}>
                          {msg.role === 'model' && (
                              <span className="text-neon font-bold mr-2 text-lg align-middle">{'>'}</span>
                          )}
                          <div className="inline-block whitespace-pre-wrap markdown-body">
                            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {msg.text}
                            </Markdown>
                          </div>
                      </div>
                  )}
               </div>
            ))}
            
            {isProcessing && (
                <div className="text-neon/50 text-xs animate-pulse mt-4">
                    {'>'} ADATFELDOLGOZÁS...
                </div>
            )}
            
            {isCompleted && (
                 <div className="mt-8 flex justify-center pb-4">
                    <button 
                        onClick={onClose}
                        className="px-6 py-3 bg-green-600 text-black font-bold font-orbitron uppercase hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(34,197,94,0.5)] rounded"
                    >
                        VISSZA A HÍDRA
                    </button>
                 </div>
            )}
         </div>

         {/* INPUT AREA (Fixed Height, Shrink-0) */}
         {!isCompleted && (
             <div className="p-4 border-t border-neon/30 bg-black shrink-0 z-10">
                <div className="flex items-center text-neon gap-2">
                   <span className="animate-pulse font-bold text-lg">{'>'}</span>
                   <input 
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      disabled={isProcessing}
                      className="bg-transparent border-none outline-none text-white w-full font-mono text-sm md:text-base placeholder-gray-700"
                      placeholder="Parancs bevitele..."
                      autoComplete="off"
                      autoFocus
                   />
                </div>
             </div>
         )}
      </div>
    </div>
  );
};

export default SideMissionTwo;