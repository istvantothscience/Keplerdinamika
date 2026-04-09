import React from 'react';

interface PrologueProps {
  onClose: () => void;
}

const Prologue: React.FC<PrologueProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black font-mono">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-carbon opacity-80 pointer-events-none"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

      <div className="relative w-full max-w-6xl h-[90vh] bg-[#050505] border border-neon/30 rounded-lg shadow-[0_0_50px_rgba(0,242,255,0.1)] flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT COLUMN: VISUALS */}
        <div className="md:w-5/12 relative bg-gray-900 border-r border-gray-800 overflow-hidden group">
            {/* The Image */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="https://raw.githubusercontent.com/istvantothscience/images/4839f62d04d9ee1a63eb0b41a8675f07c3e3a438/7.prolog.jpeg"
                    onError={(e) => {
                        const target = e.currentTarget;
                        // Prevent infinite loop
                        if (target.src.includes('unsplash')) return;
                        target.src = "https://images.unsplash.com/photo-1614728853911-53e3d2f9b252?q=80&w=1080";
                    }}
                    alt="Crash Site" 
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Grain/Noise Overlay */}
            <div className="absolute inset-0 z-10 opacity-10 noise-bg animate-noise pointer-events-none"></div>
            
            {/* Scanlines on image */}
            <div className="absolute inset-0 z-10 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.4)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none"></div>

            {/* Overlay Text on Image */}
            <div className="absolute bottom-6 left-6 z-20">
                <h1 className="text-4xl font-orbitron text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">PROLÓGUS</h1>
                <div className="text-alert font-mono text-xs mt-1 bg-black/60 inline-block px-2 py-1 border border-alert/50">
                    ADATBÁZIS REKONSTRUKCIÓ // 99%
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: TEXT CONTENT */}
        <div className="md:w-7/12 flex flex-col relative bg-gradient-to-br from-[#0a0b10] to-[#000]">
            
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-neon rounded-full animate-pulse"></div>
                    <span className="text-xs font-mono text-neon tracking-[0.2em]">FEDÉLZETI NAPLÓ // 001. BEJEGYZÉS</span>
                </div>
                <button 
                    onClick={onClose}
                    className="text-gray-500 hover:text-white transition-colors border border-transparent hover:border-white/20 px-2 rounded"
                >
                    ESC // BEZÁRÁS
                </button>
            </div>

            {/* Scrollable Story Text */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-thin scrollbar-thumb-neon/20">
                <div className="prose prose-invert max-w-none">
                    <div className="flex gap-4 mb-8">
                        <div className="text-4xl">🤖</div>
                        <div className="font-mono text-gray-500 text-sm mt-2">
                             HANGFÁJL LEJÁTSZÁSA...<br/>
                             FORRÁS: <span className="text-neon">FŐ-KÖZPONTI EGYSÉG</span>
                        </div>
                    </div>

                    <div className="space-y-6 text-gray-300 font-mono leading-relaxed text-sm md:text-base border-l-2 border-gray-800 pl-6">
                        <p>
                            A <span className="text-white font-bold">Newton-1</span> legénysége éppen a szintetikus kávé ihatatlanságáról vitatkozott, 
                            amikor a <span className="text-neon">Kepler-452b</span> gravitációs anomáliája úgy döntött, véget vet a kényelemnek. 
                            Miközben a hajócomputer udvariasan közölte, hogy a Gravitációs erő ($F_g$) éppen palacsintává készül lapítani mindenkit, 
                            a tehetetlenség – a dolgok makacs ragaszkodása az eredeti irányukhoz – könyörtelenül a felszínbe vezette a hajót.
                        </p>
                        
                        <p>
                            A por leülepedett (vagy inkább dühösen a földhöz csapódott), a hajó pedig most leginkább egy megrágott fém-articsókára hasonlít. 
                            A füstölgő roncsból elsőként a <span className="text-yellow-400">Pilóta</span> mászott ki, aki szerint a tehetetlenség törvénye csupán barátságos javaslat. 
                            Őt követte a Műszerész, aki már a roncsok alakváltozását elemezte, és azon mérgelődött, hogy a rugó megnyúlása alapján számolt 
                            nyitóerőt immár a mélybe veszett villáskulcsa nélkül kell megoldania.
                        </p>
                        
                        <p>
                            Végül a Technológus és a <span className="text-blue-400">Tudós</span> kászálódtak elő. Előbbi a narancssárga por okozta tapadási súrlódáson morgolódott, 
                            utóbbi pedig a becsapódáskori gyorsulás frizurájára gyakorolt hatása miatt aggódott.
                        </p>

                        <div className="p-4 bg-red-900/20 border border-red-900/50 rounded mt-8">
                            <p className="text-red-400 font-bold mb-2 uppercase text-xs tracking-widest">Helyzetjelentés:</p>
                            <p className="italic text-gray-400">
                                "A helyzet drámai: a hajtóművet és a chipeket a mozgásállapot-változást okozó erők szétszórták a bolygón. 
                                Ha nem akarják, hogy a közegellenállás legyen az utolsó fizikai élményük, sürgősen építeniük kell egy új rakétát."
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="p-6 border-t border-white/10 bg-[#080808] flex justify-end">
                <button 
                    onClick={onClose}
                    className="px-8 py-3 bg-neon text-black font-orbitron font-bold uppercase tracking-widest hover:bg-white hover:shadow-[0_0_20px_#00f2ff] transition-all rounded"
                >
                    KÜLDETÉS MEGKEZDÉSE
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Prologue;