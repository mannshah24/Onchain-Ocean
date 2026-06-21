import { useEffect, useState, useCallback } from 'react';
import { useOceanStore } from './store/useOceanStore';
import WorldCanvas from './components/webgl/WorldCanvas';
import HeaderHUD from './components/hud/HeaderHUD';
import SidebarHUD from './components/hud/SidebarHUD';
import BottomHUD from './components/hud/BottomHUD';
import HomepageOverlay from './components/hud/HomepageOverlay';
import SonarHUD from './components/hud/SonarHUD';
import Leaderboard from './components/hud/Leaderboard';
import RightInfoPanel from './components/hud/RightInfoPanel';
import LoadingScreen from './components/hud/LoadingScreen';
import SonarMap from './components/hud/SonarMap';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const activeRoute = useOceanStore((state) => state.activeRoute);
  const cameraState = useOceanStore((state) => state.cameraState);
  const theme = useOceanStore((state) => state.theme);
  const showSonarMap = useOceanStore((state) => state.showSonarMap);
  const layout = useOceanStore((state) => state.layout);
  const selectedAddress = useOceanStore((state) => state.selectedAddress);
  const setSelectedAddress = useOceanStore((state) => state.setSelectedAddress);
  const swimMode = useOceanStore((state) => state.swimMode);

  const [loadingDone, setLoadingDone] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadStage, setLoadStage] = useState<'init' | 'fetching' | 'generating' | 'rendering' | 'ready' | 'done' | 'error'>('init');

  // Simulated loading progression
  useEffect(() => {
    const stages: { stage: typeof loadStage; progress: number; delay: number }[] = [
      { stage: 'init', progress: 10, delay: 0 },
      { stage: 'fetching', progress: 30, delay: 400 },
      { stage: 'generating', progress: 60, delay: 800 },
      { stage: 'rendering', progress: 85, delay: 1200 },
      { stage: 'ready', progress: 100, delay: 1800 },
    ];

    const timers: ReturnType<typeof setTimeout>[] = [];
    stages.forEach(({ stage, progress, delay }) => {
      timers.push(setTimeout(() => {
        setLoadStage(stage);
        setLoadProgress(progress);
      }, delay));
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  const handleLoadingFadeComplete = useCallback(() => {
    setLoadingDone(true);
  }, []);

  // Global ESC Key Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const state = useOceanStore.getState();
        if (state.swimMode) {
          state.toggleSwimMode();
        } else if (state.selectedAddress) {
          state.setSelectedAddress(null);
        } else if (state.activeRoute === 'leaderboard') {
          state.setRoute('explore');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load saved theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ocean_theme');
    if (saved) {
      useOceanStore.getState().setTheme(parseInt(saved, 10));
    }
  }, []);

  const showInstructions = !swimMode && (activeRoute === 'explore' || cameraState.mode === 'free-float') && !selectedAddress;

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none" style={{ backgroundColor: theme.bgColor }}>
      
      {/* Loading Screen */}
      {!loadingDone && (
        <LoadingScreen
          stage={loadStage}
          progress={loadProgress}
          error={null}
          accentColor={theme.accent}
          onRetry={() => {}}
          onFadeComplete={handleLoadingFadeComplete}
        />
      )}

      {/* R3F 3D Viewport */}
      <WorldCanvas />

      {/* Global HUD Header */}
      <HeaderHUD />

      {/* Left Navigation Sidebar */}
      <SidebarHUD />

      {/* Bottom Status & Control HUD */}
      <BottomHUD />

      {/* Homepage Overlay */}
      <HomepageOverlay />

      {/* Sonar Scan HUD */}
      <SonarHUD />

      {/* Leaderboard Modal */}
      <Leaderboard />

      {/* Right Profile Info Panel */}
      <RightInfoPanel />

      {/* Sonar Map */}
      <AnimatePresence>
        {showSonarMap && activeRoute !== 'lobby' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-20 left-16 z-40 pointer-events-auto"
          >
            <SonarMap
              structures={layout.structures}
              zones={layout.zones}
              cameraPos={{ x: cameraState.position[0], z: cameraState.position[2] }}
              selectedAddress={selectedAddress}
              accentColor={theme.accent}
              onStructureClick={(addr) => setSelectedAddress(addr)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Navigation Instructions */}
      <AnimatePresence>
        {showInstructions && loadingDone && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="absolute bottom-20 left-16 z-30 max-w-xs p-4 rounded-2xl border border-white/5 glass-panel shadow-2xl pointer-events-none font-mono text-[10px] text-slate-400 flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]" style={{ color: theme.accent }}>
              <span>🏊</span>
              <span>Navigation Active</span>
            </div>
            <div>• Move/Swim: <span className="text-white">W A S D</span></div>
            <div>• Vertical lift: <span className="text-white">Space / Shift</span></div>
            <div>• Look: <span className="text-white">Drag Mouse</span></div>
            <div>• Swim Mode: <span className="text-white">Press G</span></div>
            <div className="mt-1 text-[9px] text-slate-500 italic border-t border-white/5 pt-1.5">
              Double-click seabed to return to lobby · ESC to close panels
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
