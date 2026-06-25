import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useOceanStore } from '../../store/useOceanStore';
import { X, Trophy, TrendingUp, Clock, Layers } from 'lucide-react';
import { getWalletArchetype, ZONE_COLORS, ZONE_NAMES } from '../../types';

const TABS = [
  { id: 'contracts', label: 'Contracts Deployed', icon: TrendingUp, key: 'deployedContractsCount' as const },
  { id: 'txs', label: 'Transactions', icon: Layers, key: 'txCount' as const },
  { id: 'age', label: 'Wallet Age', icon: Clock, key: 'walletAgeYears' as const },
] as const;

export default function Leaderboard() {
  const activeRoute = useOceanStore((state) => state.activeRoute);
  const setRoute = useOceanStore((state) => state.setRoute);
  const profiles = useOceanStore((state) => state.profiles);
  const layout = useOceanStore((state) => state.layout);
  const theme = useOceanStore((state) => state.theme);
  const setSelectedAddress = useOceanStore((state) => state.setSelectedAddress);
  const connectedAddress = useOceanStore((state) => state.connectedAddress);

  const [activeTab, setActiveTab] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  // Auto-rotate tabs
  useEffect(() => {
    if (!autoRotate) return;
    const timer = setInterval(() => {
      setActiveTab((i) => (i + 1) % TABS.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [autoRotate]);

  const tab = TABS[activeTab];
  const sorted = useMemo(() => {
    return [...profiles]
      .sort((a, b) => (b[tab.key] as number) - (a[tab.key] as number))
      .slice(0, 20);
  }, [profiles, tab.key]);

  const connectedRank = useMemo(() => {
    if (!connectedAddress) return null;
    const all = [...profiles].sort((a, b) => (b[tab.key] as number) - (a[tab.key] as number));
    const idx = all.findIndex((p) => p.address === connectedAddress);
    return idx >= 0 ? idx + 1 : null;
  }, [profiles, connectedAddress, tab.key]);

  const formatValue = (val: number) => {
    if (tab.key === 'deployedContractsCount') return `${val.toLocaleString()} Contracts`;
    if (tab.key === 'walletAgeYears') return `${val} Yrs`;
    return val.toLocaleString();
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#ffd700';
    if (rank === 2) return '#c0c0c0';
    if (rank === 3) return '#cd7f32';
    return 'rgb(148, 163, 184)';
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  if (activeRoute !== 'leaderboard') return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-[calc(100%-32px)] max-w-lg max-h-[80vh] rounded-3xl border border-white/10 glass-panel shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden pointer-events-auto select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <Trophy size={16} style={{ color: theme.accent }} />
            <h2 className="font-heading font-bold text-sm tracking-wider uppercase text-white">
              Ocean Leaderboard
            </h2>
          </div>
          <button
            onClick={() => setRoute('explore')}
            className="p-1.5 rounded-full border border-white/5 bg-white/5 text-slate-400 hover:text-white cursor-pointer transition-all"
          >
            <X size={13} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-3 pb-0">
          {TABS.map((t, i) => {
            const Icon = t.icon;
            const isActive = activeTab === i;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTab(i); setAutoRotate(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-heading font-semibold tracking-wider uppercase transition-all cursor-pointer"
                style={{
                  color: isActive ? theme.accent : 'rgb(148, 163, 184)',
                  background: isActive ? `${theme.accent}15` : 'transparent',
                  border: isActive ? `1px solid ${theme.accent}30` : '1px solid transparent',
                }}
              >
                <Icon size={11} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Your rank */}
        {connectedRank && (
          <div className="mx-5 mt-3 px-3 py-2 rounded-xl border flex items-center justify-between"
            style={{ borderColor: `${theme.accent}30`, background: `${theme.accent}08` }}
          >
            <span className="text-[10px] text-slate-400 font-mono">Your Rank</span>
            <span className="text-xs font-bold font-mono" style={{ color: theme.accent }}>
              #{connectedRank}
            </span>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex flex-col gap-1">
            {sorted.map((p, i) => {
              const rank = i + 1;
              const structure = layout.structures.find((s) => s.address === p.address);
              const zone = structure?.zone || 'explorer_expanse';
              const isConnected = p.address === connectedAddress;
              return (
                <motion.div
                  key={p.address}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => { setSelectedAddress(p.address); setRoute('passport'); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all hover:bg-white/5"
                  style={{
                    border: isConnected ? `1px solid ${theme.accent}40` : '1px solid transparent',
                    background: isConnected ? `${theme.accent}05` : undefined,
                  }}
                >
                  {/* Rank */}
                  <div className="w-7 shrink-0 text-center">
                    {rank <= 3 ? (
                      <span className="text-sm">{getRankEmoji(rank)}</span>
                    ) : (
                      <span className="text-[11px] font-mono font-bold" style={{ color: getRankColor(rank) }}>
                        #{rank}
                      </span>
                    )}
                  </div>

                  {/* Profile */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-white font-mono truncate">
                        {p.domain || `${p.address.slice(0, 6)}...${p.address.slice(-4)}`}
                      </span>
                      {isConnected && (
                        <span className="text-[8px] font-heading font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded" style={{ color: theme.accent, background: `${theme.accent}15` }}>
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {getWalletArchetype(p.address).split(' ')[0]} · <span style={{ color: ZONE_COLORS[zone] }}>{ZONE_NAMES[zone]}</span>
                    </span>
                  </div>

                  {/* Value */}
                  <span className="shrink-0 text-[11px] font-mono font-bold" style={{ color: getRankColor(rank) }}>
                    {formatValue(p[tab.key] as number)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
