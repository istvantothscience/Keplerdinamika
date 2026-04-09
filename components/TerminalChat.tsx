import React, { useState, useRef, useEffect } from 'react';
import { createChatSession, createCustomChatSession } from '../services/geminiService';
import { submitMissionProgress } from '../services/api';
import { ChatMessage } from '../types';
import { FunctionDeclaration } from '@google/genai';

interface TerminalChatProps {
  studentName: string;
  onPointsAwarded: (newTotal: number) => void;
  systemInstruction?: string;
  tools?: FunctionDeclaration[];
  initialMessage?: string;
  missionId?: string;
}

const TerminalChat: React.FC<TerminalChatProps> = ({ studentName, onPointsAwarded, systemInstruction, tools, initialMessage, missionId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'system',
      text: initialMessage || 'KEPLER-452B FEDÉLZETI SZÁMÍTÓGÉP ONLINE.\nVárakozás a bemenetre...',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Keep chat session in ref to maintain history context
  const chatSessionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

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
        if (systemInstruction) {
          chatSessionRef.current = createCustomChatSession(systemInstruction, tools);
        } else {
          chatSessionRef.current = createChatSession();
        }
      }

      // Send message to Gemini - Correct format for @google/genai SDK
      const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
      
      // Handle Function Calls (Tools)
      const functionCalls = result.functionCalls;
      
      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          if (call.name === 'grantPoints') {
            const args = call.args as { reason: string, points: number };
            const pts = args.points || 5;
            
            // Execute the tool
            const newTotal = await submitMissionProgress(studentName, pts, missionId || 'chat_riddle');
            
            // Update app state
            onPointsAwarded(newTotal);
            
            // Add a system message about the points
            setMessages(prev => [...prev, {
              id: Date.now().toString() + '_sys',
              role: 'system',
              text: `[JUTALOM RÖGZÍTVE] +${pts} PONT\nINDOKLÁS: ${args.reason}`,
              timestamp: Date.now()
            }]);
          }
        }
      }

      // Display the text response if available
      const responseText = result.text;
      
      if (responseText) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: responseText,
          timestamp: Date.now()
        }]);
      } else if (!functionCalls || functionCalls.length === 0) {
        // Fallback if empty response and no function calls
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
        text: 'HIBA: Kommunikációs hiba a főmodullal. (Ellenőrizze az API kulcsot vagy a kapcsolatot)',
        timestamp: Date.now()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/60 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Terminal Header */}
      <div className="bg-white/5 p-3 flex items-center justify-between border-b border-white/10">
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        </div>
        <div className="text-[10px] text-neon/80 font-mono tracking-[0.2em] uppercase">
          AI_MAIN_CORE // v42.0
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-sm scrollbar-thin scrollbar-thumb-neon/20 scrollbar-track-transparent"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-lg text-xs leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-neon/10 text-neon border border-neon/30 rounded-tr-none' 
                : msg.role === 'system'
                  ? 'bg-alert/10 text-alert border border-alert/30 w-full text-center'
                  : 'bg-white/5 text-gray-300 border border-white/10 rounded-tl-none'
            }`}>
              {msg.role === 'system' && <span className="font-bold block mb-1">SYSTEM NOTIFICATION:</span>}
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="text-neon/50 text-[10px] animate-pulse ml-2">
            {'>'} SZÁMÍTÁS FOLYAMATBAN...
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-black/40 border-t border-white/10">
        <div className="flex gap-2 items-center bg-black/50 border border-white/10 rounded px-3 py-2 focus-within:border-neon/50 transition-colors">
          <span className="text-neon font-mono text-xs">{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Írjon a fedélzeti számítógépnek..."
            className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none placeholder-gray-600"
            autoComplete="off"
          />
          <button 
            onClick={handleSend}
            disabled={isProcessing}
            className="text-neon hover:text-white disabled:opacity-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TerminalChat;