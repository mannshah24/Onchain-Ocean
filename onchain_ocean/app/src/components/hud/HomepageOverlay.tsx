import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOceanStore } from '../../store/useOceanStore';

export default function HomepageOverlay() {
  const activeRoute = useOceanStore((state) => state.activeRoute);
  const setRoute = useOceanStore((state) => state.setRoute);
  const updateCameraState = useOceanStore((state) => state.updateCameraState);
  
  const searchQuery = useOceanStore((state) => state.searchQuery);
  const setSearchQuery = useOceanStore((state) => state.setSearchQuery);
  const isSearching = useOceanStore((state) => state.isSearching);
  const triggerSearch = useOceanStore((state) => state.triggerSearch);
  const profiles = useOceanStore((state) => state.profiles);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [tickerIndex, setTickerIndex] = useState(0);

  // Auto-suggestions logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const matches = profiles
      .filter((p) => p.domain?.toLowerCase().includes(query) || p.address.toLowerCase().includes(query))
      .map((p) => p.domain || p.address)
      .slice(0, 3);
    setSuggestions(matches);
  }, [searchQuery, profiles]);

  // Transaction ticker logic
  const allTxs = useMemo(() => {
    return profiles.flatMap((p) => p.timeline.map((t) => ({ ...t, domain: p.domain })));
  }, [profiles]);

  useEffect(() => {
    if (allTxs.length === 0) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % allTxs.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [allTxs]);

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    triggerSearch(searchQuery);
  };

  const handleExploreClick = () => {
    setRoute('explore');
    updateCameraState({ mode: 'free-float' });
  };

  const handleSwimClick = () => {
    setRoute('explore');
    updateCameraState({ mode: 'free-float' });
  };

  if (activeRoute !== 'lobby') return null;

  const currentTickerTx = allTxs[tickerIndex];

  return (
    <div className="absolute inset-0 z-40 w-full h-full pointer-events-none flex flex-col justify-between p-6 md:p-12 select-none">
      
      {/* Spacer for Top Header */}
      <div></div>

      {/* --- Main Center Search console --- */}
      <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6 pointer-events-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex flex-col gap-2"
        >
          <h2 className="font-heading text-4xl md:text-5xl font-extrabold tracking-wider bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,255,255,0.06)] uppercase">
            Onchain Ocean
          </h2>
          <p className="font-sans text-xs md:text-sm text-slate-400 font-medium tracking-wide">
            Show me your wallet and explore your place in the ocean.
          </p>
        </motion.div>

        {/* Frosted Capsule search input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
          className="relative w-full z-50"
        >
          <div className="w-full flex items-center rounded-full border border-white/10 glass-panel shadow-[0_15px_35px_rgba(0,0,0,0.6)] focus-within:border-cyan-400/40 transition-all duration-300">
            <span className="pl-5 text-slate-500 font-mono text-xs select-none">{'>'}</span>
            <input
              type="text"
              placeholder={isSearching ? "Pinging sonar grid..." : "wallet.sol or address..."}
              value={searchQuery}
              disabled={isSearching}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              className="flex-1 bg-transparent border-none outline-none py-3 px-3 text-sm font-mono tracking-wide text-white placeholder-slate-500"
            />
            {isSearching ? (
              <span className="pr-5 text-cyan-400 font-mono text-xs animate-pulse">Scanning</span>
            ) : (
              <button
                onClick={handleSearchSubmit}
                className="mr-1.5 py-2 px-5 rounded-full bg-white/5 border border-white/5 font-heading font-semibold text-[10px] tracking-widest text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400/25 transition-all duration-300"
              >
                GO
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-[105%] left-0 w-full rounded-2xl border border-white/10 glass-panel overflow-hidden shadow-2xl z-50"
              >
                {suggestions.map((sug) => (
                  <div
                    key={sug}
                    onClick={() => {
                      setSearchQuery(sug);
                      triggerSearch(sug);
                    }}
                    className="w-full text-left py-2.5 px-6 font-mono text-xs text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-400 cursor-pointer border-b border-white/5 last:border-0"
                  >
                    {sug}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Core Entry CTAs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={handleExploreClick}
            className="font-heading font-semibold text-[10px] md:text-xs tracking-widest uppercase py-3 px-6 rounded-full border border-white/10 glass-panel hover:bg-cyan-500/10 hover:border-cyan-400/40 hover:text-cyan-400 transition-all duration-300"
          >
            Explore Ocean
          </button>
          <button
            onClick={handleSwimClick}
            className="font-heading font-semibold text-[10px] md:text-xs tracking-widest uppercase py-3 px-6 rounded-full border border-white/10 glass-panel hover:bg-cyan-500/10 hover:border-cyan-400/40 hover:text-cyan-400 transition-all duration-300"
          >
            Swim
          </button>
        </motion.div>
      </div>

      {/* --- Footer Status / Live feeds --- */}
      <footer className="w-full flex flex-col md:flex-row items-center justify-between gap-4 mt-6 text-xs text-slate-500 font-mono">
        {/* Live Transaction Feed */}
        <div className="flex items-center gap-2 pointer-events-auto h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            {currentTickerTx && (
              <motion.div
                key={currentTickerTx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-[10px] text-slate-400">
                  <span className="text-cyan-400">{currentTickerTx.domain || currentTickerTx.fromAddress.slice(0, 6)}</span>
                  {' '}{currentTickerTx.label || 'executed a transaction'}
                  {currentTickerTx.amount && ` (${currentTickerTx.amount} SOL)`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Statistics */}
        <div className="flex items-center gap-4 text-[10px] text-slate-400 select-none">
          <span>{profiles.filter(p => p.type === 'wallet').length} Builders</span>
          <span className="opacity-30">|</span>
          <span>{profiles.filter(p => p.type === 'startup').length} Rigs</span>
          <span className="opacity-30">|</span>
          <span className="text-cyan-400">Solana Mainnet</span>
        </div>
      </footer>
    </div>
  );
}
