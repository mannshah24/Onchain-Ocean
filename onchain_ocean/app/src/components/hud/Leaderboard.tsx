import { useOceanStore } from '../../store/useOceanStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Zap, Coins } from 'lucide-react';

export default function Leaderboard() {
  const activeRoute = useOceanStore((state) => state.activeRoute);
  const setRoute = useOceanStore((state) => state.setRoute);
  const profiles = useOceanStore((state) => state.profiles);
  const setSelectedAddress = useOceanStore((state) => state.setSelectedAddress);

  const isLeaderboardOpen = activeRoute === 'leaderboard';

  // Sort profiles by transaction count (excluding the blockchain layer)
  const sortedProfiles = useMemo(() => {
    return [...profiles]
      .filter((p) => p.type !== 'blockchain')
      .sort((a, b) => b.txCount - a.txCount);
  }, [profiles]);

  if (!isLeaderboardOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md pointer-events-auto select-none font-sans"
      >
        <div className="w-full max-w-lg rounded-3xl border border-white/10 glass-panel shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col p-6 max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Award className="text-cyan-400" size={18} />
              <h2 className="font-heading font-bold text-base md:text-lg text-white uppercase tracking-wider">
                Ocean Civilization Leaderboard
              </h2>
            </div>
            <button
              onClick={() => setRoute('lobby')}
              className="p-1.5 rounded-full border border-white/5 bg-white/5 text-slate-400 hover:text-white hover:border-cyan-400/25 transition-all duration-300"
            >
              <X size={14} />
            </button>
          </div>

          {/* List Scroll */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
            {sortedProfiles.map((p, index) => (
              <div
                key={p.address}
                onClick={() => {
                  setRoute('passport');
                  setSelectedAddress(p.address);
                }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-400/25 hover:bg-cyan-500/5 cursor-pointer transition-all duration-300"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank badge */}
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                    index === 0 ? 'bg-amber-400/20 text-amber-400' :
                    index === 1 ? 'bg-slate-300/20 text-slate-300' :
                    index === 2 ? 'bg-amber-600/20 text-amber-600' :
                    'bg-white/5 text-slate-400'
                  }`}>
                    {index + 1}
                  </span>
                  
                  <div className="flex flex-col min-w-0">
                    <span className="font-heading font-semibold text-xs text-white truncate">
                      {p.domain || 'Unnamed Spire'}
                    </span>
                    <span className="font-mono text-[9px] text-slate-500 uppercase">
                      {p.type}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1 text-slate-300">
                    <Zap size={11} className="text-cyan-400" />
                    <span>{p.txCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300 border-l border-white/5 pl-4">
                    <Coins size={11} className="text-purple-400" />
                    <span>{p.solVolume >= 1000 ? `${(p.solVolume / 1000).toFixed(1)}k` : p.solVolume}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import { useMemo } from 'react';
