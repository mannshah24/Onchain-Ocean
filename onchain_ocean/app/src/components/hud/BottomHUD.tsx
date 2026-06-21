import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOceanStore } from '../../store/useOceanStore';
import { Zap, Navigation, Gauge } from 'lucide-react';


export default function BottomHUD() {
  const activeRoute = useOceanStore((state) => state.activeRoute);
  const swimMode = useOceanStore((state) => state.swimMode);
  const swimScore = useOceanStore((state) => state.swimScore);
  const swimHUD = useOceanStore((state) => state.swimHUD);
  const theme = useOceanStore((state) => state.theme);
  const zoneAnnouncement = useOceanStore((state) => state.zoneAnnouncement);
  const cameraState = useOceanStore((state) => state.cameraState);
  const swimPersonalBest = useOceanStore((state) => state.swimPersonalBest);

  const [showZone, setShowZone] = useState(false);

  // Zone announcement auto-dismiss
  useEffect(() => {
    if (zoneAnnouncement) {
      setShowZone(true);
      const timer = setTimeout(() => setShowZone(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [zoneAnnouncement]);

  if (activeRoute === 'lobby') return null;

  return (
    <>
      {/* Zone Announcement */}
      <AnimatePresence>
        {showZone && zoneAnnouncement && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-2.5 rounded-2xl border glass-panel pointer-events-none select-none"
            style={{ borderColor: `${zoneAnnouncement.color}40` }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: zoneAnnouncement.color, boxShadow: `0 0 8px ${zoneAnnouncement.color}80` }}
            />
            <div className="flex flex-col gap-0.5">
              <span className="font-heading font-bold text-xs tracking-wider text-white">
                {zoneAnnouncement.name}
              </span>
              <span className="text-[9px] font-mono text-slate-500">
                {zoneAnnouncement.population} structures
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom HUD Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto select-none">
        {swimMode ? (
          // ─── Swim Mode HUD ───
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 px-6 py-3 rounded-2xl border glass-panel shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            style={{ borderColor: `${theme.accent}30` }}
          >
            {/* Score */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[8px] font-heading font-semibold tracking-wider uppercase text-slate-500">SCORE</span>
              <span className="text-lg font-mono font-bold swim-hud-value" style={{ color: theme.accent }}>
                {swimScore.score.toLocaleString()}
              </span>
            </div>

            <div className="w-px h-8 bg-white/10" />

            {/* Combo */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[8px] font-heading font-semibold tracking-wider uppercase text-slate-500">COMBO</span>
              <span className="flex items-center gap-1">
                <Zap size={12} style={{ color: swimScore.combo > 0 ? theme.accent : 'rgb(100,116,139)' }} />
                <span className="text-sm font-mono font-bold text-white swim-hud-value">
                  x{swimScore.combo}
                </span>
              </span>
            </div>

            <div className="w-px h-8 bg-white/10" />

            {/* Speed */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[8px] font-heading font-semibold tracking-wider uppercase text-slate-500">SPEED</span>
              <span className="flex items-center gap-1">
                <Gauge size={12} className="text-slate-400" />
                <span className="text-sm font-mono font-bold text-white swim-hud-value">
                  {swimHUD.speed.toFixed(1)}
                </span>
              </span>
            </div>

            <div className="w-px h-8 bg-white/10" />

            {/* Depth */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[8px] font-heading font-semibold tracking-wider uppercase text-slate-500">DEPTH</span>
              <span className="text-sm font-mono font-bold text-white swim-hud-value">
                {Math.abs(swimHUD.depth).toFixed(0)}m
              </span>
            </div>

            <div className="w-px h-8 bg-white/10" />

            {/* Collected */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[8px] font-heading font-semibold tracking-wider uppercase text-slate-500">FOUND</span>
              <span className="text-sm font-mono font-bold" style={{ color: theme.accent }}>
                {swimScore.collected}
              </span>
            </div>

            {/* Personal best */}
            {swimPersonalBest > 0 && (
              <>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[8px] font-heading font-semibold tracking-wider uppercase text-slate-500">BEST</span>
                  <span className="text-sm font-mono font-bold text-amber-400 swim-hud-value">
                    {swimPersonalBest.toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </motion.div>
        ) : (
          // ─── Normal Mode Status Bar ───
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 px-5 py-2 rounded-full border border-white/8 glass-panel shadow-lg"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
              <Navigation size={10} style={{ color: theme.accent }} />
              <span>
                {cameraState.position[0].toFixed(0)}, {cameraState.position[2].toFixed(0)}
              </span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
              <span style={{ color: theme.accent }}>◉</span>
              <span>{cameraState.mode.replace('-', ' ')}</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="text-[10px] font-mono" style={{ color: theme.accent }}>
              WASD + Mouse to Navigate
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
