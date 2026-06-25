import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOceanStore } from '../../store/useOceanStore';

const LEADERBOARD_CATEGORIES = [
  { label: 'Contracts Deployed', key: 'deployedContractsCount' as const },
  { label: 'Transactions', key: 'txCount' as const },
  { label: 'Wallet Age', key: 'walletAgeYears' as const },
] as const;

function MiniLeaderboard() {
  const profiles = useOceanStore((state) => state.profiles);
  const theme = useOceanStore((state) => state.theme);
  const [catIndex, setCatIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCatIndex((i) => (i + 1) % LEADERBOARD_CATEGORIES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const cat = LEADERBOARD_CATEGORIES[catIndex];
  const sorted = [...profiles]
    .sort((a, b) => (b[cat.key] as number) - (a[cat.key] as number))
    .slice(0, 5);

  const formatValue = (val: number) => {
    if (cat.key === 'deployedContractsCount') return `${val.toLocaleString()} Contracts`;
    if (cat.key === 'walletAgeYears') return `${val}y`;
    return val.toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="hidden lg:block w-52"
    >
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setCatIndex((i) => (i + 1) % LEADERBOARD_CATEGORIES.length)}
          className="text-[10px] font-heading font-semibold tracking-wider uppercase transition-colors hover:text-white cursor-pointer"
          style={{ color: theme.accent }}
        >
          {cat.label}
        </button>
        <span className="text-[8px] text-slate-500 font-mono">TOP 5</span>
      </div>
      <div className="rounded-2xl border border-white/8 glass-panel overflow-hidden">
        {sorted.map((p, i) => (
          <div
            key={p.address}
            className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer"
            onClick={() => useOceanStore.getState().triggerSearch(p.address)}
          >
            <span className="flex items-center gap-2 overflow-hidden">
              <span
                className="text-[10px] font-bold font-mono"
                style={{
                  color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : theme.accent,
                }}
              >
                #{i + 1}
              </span>
              <span className="truncate text-[10px] text-slate-300 font-mono">
                {p.domain || `${p.address.slice(0, 6)}...`}
              </span>
            </span>
            <span className="ml-2 shrink-0 text-[10px] text-slate-500 font-mono">
              {formatValue(p[cat.key] as number)}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function HomepageOverlay() {
  const activeRoute = useOceanStore((state) => state.activeRoute);
  const setRoute = useOceanStore((state) => state.setRoute);
  const updateCameraState = useOceanStore((state) => state.updateCameraState);
  const searchQuery = useOceanStore((state) => state.searchQuery);
  const setSearchQuery = useOceanStore((state) => state.setSearchQuery);
  const isSearching = useOceanStore((state) => state.isSearching);
  const triggerSearch = useOceanStore((state) => state.triggerSearch);
  const profiles = useOceanStore((state) => state.profiles);
  const oceanStats = useOceanStore((state) => state.oceanStats);
  const theme = useOceanStore((state) => state.theme);
  const solanaNetwork = useOceanStore((state) => state.solanaNetwork);
  const setSolanaNetwork = useOceanStore((state) => state.setSolanaNetwork);
  const searchFeedback = useOceanStore((state) => state.searchFeedback);
  const connectedAddress = useOceanStore((state) => state.connectedAddress);

  const connectedProfile = useMemo(() => {
    return profiles.find(p => p.address === connectedAddress);
  }, [profiles, connectedAddress]);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    if (!searchQuery.trim()) { setSuggestions([]); return; }
    const query = searchQuery.toLowerCase();
    const matches = profiles
      .filter((p) => p.domain?.toLowerCase().includes(query) || p.address.toLowerCase().includes(query))
      .map((p) => p.domain || p.address)
      .slice(0, 3);
    setSuggestions(matches);
  }, [searchQuery, profiles]);

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
    useOceanStore.getState().toggleSwimMode();
  };

  if (activeRoute !== 'lobby') return null;

  const currentTickerTx = allTxs[tickerIndex];

  return (
    <div className="absolute inset-0 z-40 w-full h-full pointer-events-none flex flex-col justify-between p-6 md:p-12 select-none">
      <div></div>

      {/* --- Main Center Content --- */}
      <div className="w-full flex items-start justify-center gap-8">
        
        {/* Left spacer for leaderboard alignment */}
        <div className="hidden lg:block w-52" />

        {/* Center search console */}
        <div className="w-full max-w-lg flex flex-col items-center gap-5 pointer-events-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex flex-col items-center gap-2"
          >
            <div className="text-5xl mb-2 animate-float filter drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              🌊
            </div>
            <h2
              className="font-heading text-4xl md:text-5xl font-extrabold tracking-[0.12em] uppercase"
              style={{
                background: `linear-gradient(180deg, #fff 0%, ${theme.accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: `drop-shadow(0 0 25px ${theme.accent}30)`,
              }}
            >
              Onchain Ocean
            </h2>
            {connectedAddress ? (
              <div 
                onClick={() => useOceanStore.getState().setSelectedAddress(connectedAddress)}
                className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-mono text-xs cursor-pointer hover:bg-cyan-500/20 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] pointer-events-auto select-text"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>Passport Connected: {connectedProfile?.domain || `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`}</span>
              </div>
            ) : (
              <p className="font-sans text-xs md:text-sm text-slate-400 font-medium tracking-wide max-w-sm">
                Enter any Solana wallet address to explore your place in the ocean depths.
              </p>
            )}
          </motion.div>

          {/* Network Switcher */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
            className="flex items-center rounded-full border border-white/10 glass-panel p-0.5 select-none text-[9px] md:text-[10px] font-heading font-semibold tracking-wider uppercase h-[34px] shadow-lg"
          >
            <button
              onClick={() => setSolanaNetwork('mainnet')}
              className="px-4 h-full rounded-full transition-all duration-300 cursor-pointer"
              style={{
                background: solanaNetwork === 'mainnet' ? `${theme.accent}20` : 'transparent',
                color: solanaNetwork === 'mainnet' ? theme.accent : '#94a3b8',
                border: solanaNetwork === 'mainnet' ? `1px solid ${theme.accent}30` : '1px solid transparent',
              }}
            >
              Mainnet-Beta
            </button>
            <button
              onClick={() => setSolanaNetwork('devnet')}
              className="px-4 h-full rounded-full transition-all duration-300 cursor-pointer"
              style={{
                background: solanaNetwork === 'devnet' ? `${theme.accent}20` : 'transparent',
                color: solanaNetwork === 'devnet' ? theme.accent : '#94a3b8',
                border: solanaNetwork === 'devnet' ? `1px solid ${theme.accent}30` : '1px solid transparent',
              }}
            >
              Devnet
            </button>
          </motion.div>

          {/* Search input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
            className="relative w-full z-50"
          >
            <div
              className="w-full flex items-center rounded-full border glass-panel shadow-[0_15px_35px_rgba(0,0,0,0.6)] transition-all duration-300"
              style={{ borderColor: isSearching ? `${theme.accent}60` : 'rgba(255,255,255,0.1)' }}
            >
              <span className="pl-5 text-slate-500 font-mono text-xs select-none">{'>'}</span>
              <input
                type="text"
                placeholder={isSearching ? "Pinging sonar grid..." : "wallet.sol or address..."}
                value={searchQuery}
                disabled={isSearching}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                className="flex-1 bg-transparent border-none outline-none py-3.5 px-3 text-sm font-mono tracking-wide text-white placeholder-slate-500"
              />
              {isSearching ? (
                <span className="pr-5 font-mono text-xs animate-pulse" style={{ color: theme.accent }}>
                  Scanning...
                </span>
              ) : (
                <button
                  onClick={handleSearchSubmit}
                  className="mr-1.5 py-2 px-5 rounded-full border font-heading font-semibold text-[10px] tracking-widest uppercase transition-all duration-300 cursor-pointer"
                  style={{
                    borderColor: `${theme.accent}40`,
                    color: theme.accent,
                    background: `${theme.accent}10`,
                  }}
                >
                  SCAN
                </button>
              )}
            </div>

            {/* Suggestions */}
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
                      onClick={() => { setSearchQuery(sug); triggerSearch(sug); }}
                      className="w-full text-left py-2.5 px-6 font-mono text-xs text-slate-300 hover:text-white cursor-pointer border-b border-white/5 last:border-0 transition-colors"
                      style={{ ['--tw-hover-bg' as any]: `${theme.accent}10` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = `${theme.accent}10`)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {sug}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search error feedback */}
            <AnimatePresence>
              {searchFeedback && searchFeedback.type === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-[110%] left-0 w-full rounded-2xl border border-rose-500/25 bg-rose-950/80 backdrop-blur-md p-3.5 text-xs font-mono text-rose-400 text-left z-50 shadow-xl"
                >
                  <div className="flex items-start gap-2.5 pointer-events-auto">
                    <span className="text-sm select-none">⚠️</span>
                    <div className="flex-1 flex flex-col gap-0.5">
                      <span className="font-heading font-semibold uppercase tracking-wider text-[10px]">Search Error</span>
                      <p className="text-[10.5px] leading-relaxed text-rose-300/90 font-mono">{searchFeedback.code || "Failed to retrieve real-time data from Solana RPC."}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex items-center gap-4"
          >
            <button
              onClick={handleExploreClick}
              className="btn-ocean font-heading font-semibold text-[10px] md:text-xs tracking-widest uppercase py-3 px-6 rounded-full border border-white/10 glass-panel hover:text-white transition-all duration-300 cursor-pointer"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${theme.accent}60`;
                e.currentTarget.style.color = theme.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = '';
              }}
            >
              Explore Ocean
            </button>
            <button
              onClick={handleSwimClick}
              className="btn-ocean font-heading font-semibold text-[10px] md:text-xs tracking-widest uppercase py-3 px-6 rounded-full border transition-all duration-300 cursor-pointer"
              style={{
                borderColor: `${theme.accent}40`,
                background: `${theme.accent}10`,
                color: theme.accent,
              }}
            >
              🏊 Swim
            </button>
          </motion.div>
        </div>

        {/* Right Mini Leaderboard */}
        <MiniLeaderboard />
      </div>

      {/* --- Footer --- */}
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
                  <span style={{ color: theme.accent }}>
                    {(currentTickerTx as any).domain || (currentTickerTx as any).fromAddress?.slice(0, 6)}
                  </span>
                  {' '}{currentTickerTx.label || 'executed a transaction'}
                  {currentTickerTx.amount && ` (${currentTickerTx.amount} SOL)`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Statistics */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-4 text-[10px] text-slate-400 select-none pointer-events-auto"
        >
          <span>{oceanStats.totalStructures} Structures</span>
          <span className="opacity-30">|</span>
          <span>{oceanStats.totalContracts.toLocaleString()} Deployed Contracts</span>
          <span className="opacity-30">|</span>
          <span style={{ color: theme.accent }}>Solana {solanaNetwork === 'mainnet' ? 'Mainnet' : 'Devnet'}</span>
        </motion.div>
      </footer>
    </div>
  );
}
