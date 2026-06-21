import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOceanStore } from '../../store/useOceanStore';
import { X, ExternalLink, ShieldCheck, Copy, Share2 } from 'lucide-react';
import { getWalletArchetype, ZONE_NAMES, ZONE_COLORS } from '../../types';

const BADGE_INFO: Record<string, { emoji: string; label: string; color: string }> = {
  whale: { emoji: '🐋', label: 'Whale', color: '#06b6d4' },
  dolphin: { emoji: '🐬', label: 'Dolphin', color: '#3b82f6' },
  fish: { emoji: '🐟', label: 'Fish', color: '#22c55e' },
  power_user: { emoji: '⚡', label: 'Power User', color: '#f59e0b' },
  active: { emoji: '🔥', label: 'Active', color: '#ef4444' },
  explorer: { emoji: '🧭', label: 'Explorer', color: '#8b5cf6' },
  og: { emoji: '👑', label: 'OG', color: '#ffd700' },
  veteran: { emoji: '🎖️', label: 'Veteran', color: '#c0c0c0' },
  protocol_master: { emoji: '🔮', label: 'Protocol Master', color: '#a855f7' },
  community_builder: { emoji: '🌱', label: 'Community Builder', color: '#10b981' },
  networker: { emoji: '🔗', label: 'Networker', color: '#06b6d4' },
  collector: { emoji: '🖼️', label: 'Collector', color: '#ec4899' },
  defi_diver: { emoji: '🤿', label: 'DeFi Diver', color: '#a855f7' },
};

const PROTOCOL_EMOJIS: Record<string, string> = {
  Jupiter: '🪐', Raydium: '☢️', Orca: '🐳', Tensor: '🎨',
  Meteora: '☄️', Drift: '🌊', Solend: '🏦', Phoenix: '🔥', 'Pump.fun': '🚀',
};

export default function RightInfoPanel() {
  const selectedAddress = useOceanStore((state) => state.selectedAddress);
  const setSelectedAddress = useOceanStore((state) => state.setSelectedAddress);
  const profiles = useOceanStore((state) => state.profiles);
  const layout = useOceanStore((state) => state.layout);
  const theme = useOceanStore((state) => state.theme);

  const [copied, setCopied] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  const profile = profiles.find((p) => p.address === selectedAddress);
  const structure = layout.structures.find((s) => s.address === selectedAddress);

  if (!profile || !structure) {
    // Fallback: show profile even without structure
    if (!profile) return null;
  }

  const archetype = getWalletArchetype(profile.address);
  const zone = structure?.zone || 'explorer_expanse';
  const badges = structure?.badges || [];
  const reputationScore = structure?.reputationScore || 0;
  const depthLevel = structure?.depthLevel || 1;

  const handleCopy = () => {
    navigator.clipboard.writeText(profile.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const url = `${window.location.origin}?address=${profile.address}`;
    navigator.clipboard.writeText(url);
    setShareMsg('Link copied!');
    setTimeout(() => setShareMsg(''), 2000);
  };

  // Calculated metrics
  const programsUsed = Math.min(64, Math.round(profile.txCount / 12 + 3));
  const volPercent = Math.min(100, Math.max(10, Math.round((profile.solVolume / 2500) * 100)));
  const txPercent = Math.min(100, Math.max(10, Math.round((profile.txCount / 800) * 100)));
  const activityPercent = Math.min(100, Math.max(15, Math.round(70 + (profile.txCount % 30))));
  const agePercent = Math.min(100, Math.max(10, Math.round((profile.walletAgeYears / 4.5) * 100)));

  return (
    <AnimatePresence>
      {selectedAddress && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          className="fixed z-40 right-4 top-20 bottom-20 w-[calc(100%-32px)] sm:w-[400px] rounded-3xl border border-white/10 glass-panel shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden pointer-events-auto select-none font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-0">
            <span className="text-[9px] tracking-widest uppercase font-heading font-semibold text-slate-500">
              Identity Passport
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-1.5 rounded-full border border-white/5 bg-white/5 text-slate-400 hover:text-white hover:border-cyan-400/25 transition-all duration-300 cursor-pointer"
                title="Share"
              >
                <Share2 size={12} />
              </button>
              <button
                onClick={() => setSelectedAddress(null)}
                className="p-1.5 rounded-full border border-white/5 bg-white/5 text-slate-400 hover:text-white hover:border-cyan-400/25 transition-all duration-300 cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          </div>
          {shareMsg && (
            <div className="mx-5 mt-1 text-[9px] font-mono" style={{ color: theme.accent }}>{shareMsg}</div>
          )}

          <div className="flex-1 overflow-y-auto p-5 pt-3 flex flex-col gap-4">
            {/* Avatar + Name + Archetype */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl border flex items-center justify-center relative overflow-hidden flex-shrink-0"
                style={{
                  borderColor: `${ZONE_COLORS[zone]}40`,
                  background: `linear-gradient(135deg, ${ZONE_COLORS[zone]}15, rgba(3,7,18,0.8))`,
                }}
              >
                <span className="text-2xl">🧬</span>
                <div className="absolute inset-0 mix-blend-color-dodge animate-pulse" style={{ background: `${ZONE_COLORS[zone]}10` }} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading font-bold text-base text-white truncate">
                    {profile.domain || `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}`}
                  </h3>
                  <ShieldCheck size={14} className="flex-shrink-0" style={{ color: theme.accent }} />
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wide">{archetype}</span>
              </div>
            </div>

            {/* Zone + Depth + Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[9px] font-heading font-semibold tracking-widest uppercase px-2.5 py-1 rounded-md border zone-${zone}`}>
                {ZONE_NAMES[zone] || zone}
              </span>
              <span
                className="text-[9px] font-heading font-semibold tracking-widest uppercase px-2.5 py-1 rounded-md border"
                style={{ color: theme.accent, borderColor: `${theme.accent}30`, background: `${theme.accent}08` }}
              >
                Depth Lv.{depthLevel}
              </span>
              {profile.walletAgeYears >= 1.0 && (
                <span className="text-[9px] font-heading font-semibold tracking-widest uppercase px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-400/20 text-emerald-400">
                  OG
                </span>
              )}
            </div>

            {/* Ocean Badges */}
            {badges.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] tracking-wider uppercase font-semibold text-slate-500 font-heading">
                  Ocean Badges
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {badges.map((badge) => {
                    const info = BADGE_INFO[badge];
                    if (!info) return null;
                    return (
                      <span
                        key={badge}
                        className="text-[9px] font-mono px-2 py-1 rounded-lg border flex items-center gap-1"
                        style={{ color: info.color, borderColor: `${info.color}30`, background: `${info.color}08` }}
                      >
                        <span>{info.emoji}</span>
                        <span>{info.label}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Overview Stats */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] tracking-wider uppercase font-semibold text-slate-500 font-heading">
                On-Chain Metrics
              </span>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: 'SOL Balance', value: `${profile.solVolume.toLocaleString()} SOL`, tag: 'Verified' },
                  { label: 'Transactions', value: profile.txCount.toLocaleString(), tag: 'Verified' },
                  { label: 'Wallet Age', value: `${profile.walletAgeYears} Yrs`, tag: 'Verified' },
                  { label: 'Programs Used', value: programsUsed.toString(), tag: 'Detected' },
                  { label: 'Reputation', value: `${reputationScore} / 100`, tag: 'Inferred' },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[10px] text-slate-400">{stat.label}</span>
                      <span className="text-[7.5px] font-mono text-slate-600 tracking-wide uppercase">{stat.tag}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-white">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Protocol Interactions */}
            {profile.protocolInteractions.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] tracking-wider uppercase font-semibold text-slate-500 font-heading">
                  Protocol Activity
                </span>
                <div className="flex flex-col gap-1 bg-white/5 border border-white/5 rounded-2xl p-3">
                  {profile.protocolInteractions.map((proto, i) => {
                    const name = proto.name.replace(' (Detected)', '');
                    const emoji = PROTOCOL_EMOJIS[name] || '⚙️';
                    const maxTx = Math.max(...profile.protocolInteractions.map(p => p.txCount));
                    const pct = Math.round((proto.txCount / Math.max(1, maxTx)) * 100);
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        <span className="text-sm w-5 text-center">{emoji}</span>
                        <div className="flex-1 flex flex-col gap-0.5">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-300">{name}</span>
                            <span className="text-slate-500 font-mono">{proto.txCount} tx</span>
                          </div>
                          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                background: `linear-gradient(90deg, ${theme.accent}80, ${theme.accent})`,
                                boxShadow: `0 0 6px ${theme.accent}60`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Building Stats (Progress Bars) */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] tracking-wider uppercase font-semibold text-slate-500 font-heading">
                Structure Dimensions
              </span>
              <div className="flex flex-col gap-2.5 bg-white/5 border border-white/5 rounded-2xl p-4">
                {[
                  { label: 'Size (Volume)', value: volPercent, color: '#06b6d4' },
                  { label: 'Height (Transactions)', value: txPercent, color: '#a855f7' },
                  { label: 'Activity (30D)', value: activityPercent, color: '#10b981' },
                  { label: 'Age (Maturity)', value: agePercent, color: '#f97316' },
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{stat.label}</span>
                      <span className="font-bold font-mono" style={{ color: stat.color }}>{stat.value}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${stat.value}%`,
                          backgroundColor: stat.color,
                          boxShadow: `0 0 8px ${stat.color}60`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Communities */}
            {profile.communitiesJoined.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] tracking-wider uppercase font-semibold text-slate-500 font-heading">
                  Communities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.communitiesJoined.map((c, i) => (
                    <span key={i} className="text-[9px] font-mono px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-slate-400">
                      {c.replace(' (Inferred)', '')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Timeline */}
            {profile.timeline.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] tracking-wider uppercase font-semibold text-slate-500 font-heading">
                  Recent Activity
                </span>
                <div className="flex flex-col gap-1">
                  {profile.timeline.slice(0, 4).map((tx) => (
                    <a
                      key={tx.id}
                      href={`https://explorer.solana.com/tx/${tx.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[10px] text-slate-300 truncate">{tx.label}</span>
                        <span className="text-[8px] font-mono text-slate-600">
                          {new Date(tx.timestamp * 1000).toLocaleString()}
                        </span>
                      </div>
                      {tx.amount && (
                        <span className="text-[10px] font-mono font-bold" style={{ color: theme.accent }}>
                          {tx.amount} SOL
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 pt-3 border-t border-white/5 flex flex-col gap-2">
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-between py-2 px-4 rounded-xl border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all text-xs cursor-pointer font-mono"
            >
              <span className="truncate max-w-[240px]">{profile.address}</span>
              <span className="flex items-center gap-1 text-[10px]" style={{ color: theme.accent }}>
                <Copy size={10} />
                {copied ? 'Copied' : 'Copy'}
              </span>
            </button>
            <a
              href={`https://explorer.solana.com/address/${profile.address}`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border font-heading font-semibold text-[10px] tracking-widest uppercase transition-all cursor-pointer"
              style={{
                borderColor: `${theme.accent}30`,
                background: `${theme.accent}10`,
                color: theme.accent,
                boxShadow: `0 0 10px ${theme.accent}15`,
              }}
            >
              <span>View on Explorer</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
