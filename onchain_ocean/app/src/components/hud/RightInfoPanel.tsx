import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOceanStore } from '../../store/useOceanStore';
import { X, ExternalLink, ShieldCheck } from 'lucide-react';

export default function RightInfoPanel() {
  const selectedAddress = useOceanStore((state) => state.selectedAddress);
  const setSelectedAddress = useOceanStore((state) => state.setSelectedAddress);
  const profiles = useOceanStore((state) => state.profiles);

  const [copied, setCopied] = useState(false);

  // Find active profile
  const profile = profiles.find((p) => p.address === selectedAddress);

  if (!profile) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(profile.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine role title based on structure type
  const getRoleTitle = (type: string) => {
    switch (type) {
      case 'wallet': return 'Developer Wallet';
      case 'startup': return 'Protocol Node';
      case 'community': return 'Civic Council';
      case 'blockchain': return 'Genesis Hub';
      default: return 'Builder Node';
    }
  };

  // Determine category badge text
  const getCategoryBadge = (type: string) => {
    switch (type) {
      case 'wallet': return 'Developer';
      case 'startup': return 'Protocol';
      case 'community': return 'Community';
      case 'blockchain': return 'L1 Core';
      default: return 'Builder';
    }
  };

  // Calculate dynamic stats
  const reputationScore = Math.min(99.9, Math.round(75 + profile.walletAgeYears * 4.5 + Math.min(20, profile.txCount * 0.04)) * 10) / 10;
  const programsUsed = Math.min(64, Math.round(profile.txCount / 12 + 3));
  const contractsInteracted = Math.min(320, Math.round(profile.txCount / 4 + 5));

  // Progress percentages for building stats
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
          className="fixed z-40 right-4 top-24 bottom-24 w-[calc(100%-32px)] sm:w-[380px] rounded-3xl border border-white/10 glass-panel shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col p-6 overflow-hidden pointer-events-auto select-none font-sans"
        >
          {/* --- Top Panel Header --- */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] tracking-widest uppercase font-heading font-semibold text-slate-500">
              Identity Passport
            </span>
            <button
              id="close-panel-button"
              aria-label="Close Info Panel"
              onClick={() => setSelectedAddress(null)}
              className="p-1.5 rounded-full border border-white/5 bg-white/5 text-slate-400 hover:text-white hover:border-cyan-400/25 transition-all duration-300 cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>

          {/* --- Avatar, Name & Verified Badge --- */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-gradient-to-tr from-slate-900 to-slate-800 shadow-md relative overflow-hidden flex-shrink-0">
              <span className="text-xl">🧬</span>
              <div className="absolute inset-0 bg-cyan-400/10 mix-blend-color-dodge animate-pulse"></div>
            </div>
            
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-heading font-bold text-base text-white truncate">
                  {profile.domain || `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}`}
                </h3>
                <ShieldCheck size={14} className="text-cyan-400 fill-cyan-400/10 flex-shrink-0" />
              </div>
              
              <span className="text-[10px] text-slate-400 font-mono tracking-wide">
                {getRoleTitle(profile.type)}
              </span>
            </div>
          </div>

          {/* --- Pill Badges --- */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[9px] font-heading font-semibold tracking-widest uppercase px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-400/20 text-purple-400">
              {getCategoryBadge(profile.type)}
            </span>
            <span className="text-[9px] font-heading font-semibold tracking-widest uppercase px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-400/20 text-emerald-400">
              Active
            </span>
            <span className="text-[9px] font-heading font-semibold tracking-widest uppercase px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-400/20 text-cyan-400">
              {profile.walletAgeYears >= 1.0 ? 'OG' : 'Newcomer'}
            </span>
          </div>

          {/* --- Structure Blueprint Preview Card --- */}
          <div className="w-full h-24 rounded-2xl border border-white/5 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 relative overflow-hidden flex flex-col justify-end p-3 mb-4 shadow-inner">
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-slate-950/70 border border-white/5 font-mono text-[7px] text-cyan-400/80 tracking-wider uppercase select-none">
              Blueprint Card
            </div>
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
            <div className="z-10 flex flex-col gap-0.5">
              <span className="text-[8px] font-mono uppercase text-slate-500">Selected Landmark</span>
              <span className="text-[11px] font-bold text-white tracking-wide truncate">
                {profile.projectName || 'Civilization Structure'}
              </span>
            </div>
          </div>

          {/* --- Detail Telemetry List (Scrollable) --- */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
            
            {/* Overview Stats */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] tracking-wider uppercase font-semibold text-slate-500 font-heading">
                Overview Metrics
              </span>

              <div className="flex flex-col gap-1.5">
                {[
                  { label: 'Total Volume', value: `${profile.solVolume.toLocaleString()} SOL`, source: 'Verified On-Chain' },
                  { label: 'Transactions', value: profile.txCount.toLocaleString(), source: 'Verified On-Chain' },
                  { label: 'Wallet Age', value: `${profile.walletAgeYears} Yrs`, source: 'Verified On-Chain' },
                  { label: 'Contracts Interacted', value: contractsInteracted.toString(), source: 'Detected Interaction' },
                  { label: 'Programs Used', value: programsUsed.toString(), source: 'Detected Interaction' },
                  { label: 'Reputation Score', value: `${reputationScore} / 100`, source: 'Inferred Metadata' },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[10px] text-slate-400">{stat.label}</span>
                      <span className="text-[7.5px] font-mono text-slate-500 tracking-wide uppercase select-none">{stat.source}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-white">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Building Stats (Progress Bars) */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[9px] tracking-wider uppercase font-semibold text-slate-500 font-heading">
                Building Metrics [Inferred]
              </span>

              <div className="flex flex-col gap-2.5 bg-white/5 border border-white/5 rounded-2xl p-4">
                {/* Size (Volume) */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Size (Volume)</span>
                    <span className="text-cyan-400 font-bold font-mono">{volPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" style={{ width: `${volPercent}%` }}></div>
                  </div>
                </div>

                {/* Height (Transactions) */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Height (Transactions)</span>
                    <span className="text-purple-400 font-bold font-mono">{txPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-400 rounded-full shadow-[0_0_8px_rgba(192,132,252,0.6)]" style={{ width: `${txPercent}%` }}></div>
                  </div>
                </div>

                {/* Activity */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Activity (30D)</span>
                    <span className="text-emerald-400 font-bold font-mono">{activityPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)]" style={{ width: `${activityPercent}%` }}></div>
                  </div>
                </div>

                {/* Age (Maturity) */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Age (Maturity)</span>
                    <span className="text-orange-400 font-bold font-mono">{agePercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full shadow-[0_0_8px_rgba(251,146,60,0.6)]" style={{ width: `${agePercent}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* --- View on Explorer Footer Button --- */}
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-between py-2 px-4 rounded-xl border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-white transition-all text-xs cursor-pointer font-mono"
            >
              <span className="truncate max-w-[200px]">{profile.address}</span>
              <span className="text-[10px] text-cyan-400">{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <a
              href={`https://explorer.solana.com/address/${profile.address}`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-cyan-500/10 border border-cyan-400/20 font-heading font-semibold text-[10px] tracking-widest uppercase text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400/40 transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)]"
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
