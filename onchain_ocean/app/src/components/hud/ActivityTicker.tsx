import { useMemo } from 'react';
import { useOceanStore } from '../../store/useOceanStore';

export interface TickerEvent {
  id: string;
  text: string;
}

export default function ActivityTicker() {
  const theme = useOceanStore((state) => state.theme);
  const profiles = useOceanStore((state) => state.profiles);

  const events = useMemo(() => {
    const list: TickerEvent[] = [];

    // Build some high-quality events from the profiles
    profiles.forEach((p, idx) => {
      const displayName = p.domain ? `@${p.domain}` : `@${p.address.slice(0, 6)}...${p.address.slice(-4)}`;
      
      if (idx % 12 === 0) {
        list.push({
          id: `ticker-join-${idx}`,
          text: `🌊 ${displayName.toUpperCase()} JOINED THE OCEAN`,
        });
      } else if (idx % 15 === 0) {
        const streak = Math.floor(1 + (idx % 15) * 0.8);
        list.push({
          id: `ticker-streak-${idx}`,
          text: `🔥 ${displayName.toUpperCase()} CHECKED IN (${streak}-DAY STREAK)`,
        });
      } else if (idx % 8 === 0 && p.protocolInteractions.length > 0) {
        const proto = p.protocolInteractions[0].name.replace(' (Detected)', '');
        list.push({
          id: `ticker-proto-${idx}`,
          text: `⚡ ${displayName.toUpperCase()} SWAPPED VIA ${proto.toUpperCase()}`,
        });
      } else if (idx % 20 === 0 && p.solVolume > 1000) {
        list.push({
          id: `ticker-whale-${idx}`,
          text: `🐋 WHALE WATCH: ${displayName.toUpperCase()} TRANSFERRED ${Math.floor(p.solVolume / 10)} SOL`,
        });
      }
    });

    // Fallback if profiles is empty (unlikely)
    if (list.length === 0) {
      list.push({ id: 'fallback-1', text: '🌊 SCANNING SOLANA LEDGER...' });
      list.push({ id: 'fallback-2', text: '🐙 MAPPING CORAL STRUCTURES...' });
    }

    return list.slice(0, 60); // Cap events
  }, [profiles]);

  // Duplicate for seamless infinite scroll
  const duplicatedEvents = useMemo(() => [...events, ...events], [events]);

  const duration = Math.max(30, events.length * 2.5);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex h-7 items-center border-t select-none bg-black/90 backdrop-blur-sm pointer-events-auto font-mono text-[9px] uppercase tracking-wider"
      style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
    >
      <div className="min-w-0 flex-1 overflow-hidden">
        <div
          className="flex whitespace-nowrap animate-ticker-scroll"
          style={{
            animationDuration: `${duration}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          }}
        >
          {duplicatedEvents.map((item, i) => (
            <span
              key={`${item.id}-${i}`}
              className="mx-8 hover:text-white transition-colors duration-200 cursor-pointer"
              style={{ color: `${theme.accent}d0` }}
            >
              {item.text}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Links */}
      <div className="hidden sm:flex items-center gap-2 shrink-0 pr-4 pl-3 border-l border-white/5 font-mono text-[8px] tracking-widest text-slate-500">
        <a href="#terms" className="hover:text-slate-300 transition-colors uppercase">Terms</a>
        <span>·</span>
        <a href="#privacy" className="hover:text-slate-300 transition-colors uppercase">Privacy</a>
        <span>·</span>
        <a href="#support" className="hover:text-slate-300 transition-colors uppercase">Support</a>
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker-scroll {
          animation: ticker-scroll var(--ticker-duration, 60s) linear infinite;
        }
        .animate-ticker-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
