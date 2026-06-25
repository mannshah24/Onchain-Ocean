import { useEffect, useState, useCallback } from 'react';
import { useOceanStore } from './store/useOceanStore';
import WorldCanvas from './components/webgl/WorldCanvas';
import HeaderHUD from './components/hud/HeaderHUD';
import BottomHUD from './components/hud/BottomHUD';
import HomepageOverlay from './components/hud/HomepageOverlay';
import SonarHUD from './components/hud/SonarHUD';
import Leaderboard from './components/hud/Leaderboard';
import RightInfoPanel from './components/hud/RightInfoPanel';
import LoadingScreen from './components/hud/LoadingScreen';
import MiniMap from './components/hud/MiniMap';
import ActivityTicker from './components/hud/ActivityTicker';
export default function App() {
  const activeRoute = useOceanStore((state) => state.activeRoute);
  const setRoute = useOceanStore((state) => state.setRoute);
  const cameraState = useOceanStore((state) => state.cameraState);
  const theme = useOceanStore((state) => state.theme);
  const themeIndex = useOceanStore((state) => state.themeIndex);
  const setTheme = useOceanStore((state) => state.setTheme);
  const layout = useOceanStore((state) => state.layout);
  const resetSearch = useOceanStore((state) => state.resetSearch);
  const swimMode = useOceanStore((state) => state.swimMode);

  const [loadingDone, setLoadingDone] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadStage, setLoadStage] = useState<'init' | 'fetching' | 'generating' | 'rendering' | 'ready' | 'done' | 'error'>('init');

  // Real on-chain preset loading sequence
  useEffect(() => {
    let active = true;

    async function loadPresets() {
      if (!active) return;
      setLoadStage('init');
      setLoadProgress(10);

      // Brief delay before starting on-chain fetches
      await new Promise(resolve => setTimeout(resolve, 400));
      if (!active) return;

      setLoadStage('fetching');
      setLoadProgress(30);

      try {
        const store = useOceanStore.getState();
        
        // Listen to progress updates from the store
        const unsubscribe = useOceanStore.subscribe((state) => {
          if (active) {
            setLoadStage(state.loadStage);
            setLoadProgress(state.loadProgress);
          }
        });

        // Fetch on-chain presets
        await store.initializePresets();
        
        // Unsubscribe from store updates
        unsubscribe();

        if (!active) return;

        // Briefly wait to let the user see the transition
        await new Promise(resolve => setTimeout(resolve, 400));
        if (!active) return;

        setLoadStage('rendering');
        setLoadProgress(90);

        await new Promise(resolve => setTimeout(resolve, 500));
        if (!active) return;

        setLoadStage('ready');
        setLoadProgress(100);
      } catch (err) {
        console.error("Failed to load on-chain presets:", err);
        // Fallback to ready state if it fails so the app can still be used
        setLoadStage('ready');
        setLoadProgress(100);
      }
    }

    loadPresets();

    return () => {
      active = false;
    };
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
        } else if (state.activeRoute !== 'lobby') {
          state.resetSearch();
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

  const handleEscBack = () => {
    resetSearch();
  };

  const handleFeedClick = () => {
    if (activeRoute === 'leaderboard') {
      setRoute('explore');
    } else {
      setRoute('leaderboard');
    }
  };

  const handleThemeToggle = () => {
    setTheme((themeIndex + 1) % 4);
  };

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

      {/* Lobby Menu Header */}
      {activeRoute === 'lobby' && <HeaderHUD />}

      {/* Swim Mode Overlay Metrics */}
      {swimMode && <BottomHUD />}

      {/* Homepage overlay search input */}
      <HomepageOverlay />

      {/* Sonar Scan Radar */}
      <SonarHUD />

      {/* Leaderboard Modal */}
      <Leaderboard />

      {/* Right Profile Info Panel */}
      <RightInfoPanel />

      {/* ── Retro HUD: Top Left ESC BACK ── */}
      {activeRoute !== 'lobby' && loadingDone && (
        <button
          onClick={handleEscBack}
          className="fixed top-6 left-6 z-50 px-3.5 py-2 border font-mono text-[9px] font-bold tracking-widest bg-black/90 hover:bg-white hover:text-black transition-all duration-200 cursor-pointer rounded-sm"
          style={{ borderColor: `${theme.accent}60`, color: theme.accent, boxShadow: `0 2px 8px rgba(0,0,0,0.5)` }}
        >
          ESC BACK
        </button>
      )}

      {/* ── Retro HUD: Top Right FEED Toggle ── */}
      {activeRoute !== 'lobby' && loadingDone && (
        <button
          onClick={handleFeedClick}
          className="fixed top-6 right-6 z-50 px-3.5 py-2 border font-mono text-[9px] font-bold tracking-widest bg-black/90 hover:bg-white hover:text-black transition-all duration-200 cursor-pointer rounded-sm"
          style={{ borderColor: `${theme.accent}60`, color: theme.accent, boxShadow: `0 2px 8px rgba(0,0,0,0.5)` }}
        >
          • FEED
        </button>
      )}

      {/* ── Retro HUD: Bottom Left Navigation Controls & Theme Switches ── */}
      {activeRoute !== 'lobby' && loadingDone && (
        <div className="fixed bottom-10 left-6 z-40 flex flex-col gap-3 font-mono text-[8px] tracking-wider text-slate-400 select-none">
          <div className="flex flex-col gap-1 uppercase">
            <div><span className="text-white font-bold">DRAG</span> ORBIT</div>
            <div><span className="text-white font-bold">SCROLL</span> ZOOM</div>
            <div><span className="text-white font-bold">RIGHT-DRAG</span> PAN</div>
            <div><span className="text-white font-bold">CLICK</span> BUILDING</div>
            <div><span className="text-white font-bold">ESC</span> BACK</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleThemeToggle}
              className="px-3 py-1.5 border text-[8px] font-bold tracking-widest uppercase bg-black/95 hover:bg-white hover:text-black transition-all duration-200 cursor-pointer rounded-sm"
              style={{ borderColor: `${theme.accent}50`, color: theme.accent }}
            >
              ▶ {theme.name.toUpperCase()} {themeIndex + 1}/4
            </button>
            <button
              className="px-3 py-1.5 border text-[8px] font-bold tracking-widest uppercase bg-black/95 hover:bg-white hover:text-black transition-all duration-200 cursor-pointer rounded-sm"
              style={{ borderColor: `${theme.accent}50`, color: theme.accent }}
            >
              ▶ LO-FI ...
            </button>
          </div>
        </div>
      )}

      {/* ── Retro HUD: Canvas-Based Minimap ── */}
      {activeRoute !== 'lobby' && loadingDone && (
        <MiniMap
          buildings={layout.structures}
          playerX={cameraState.position[0]}
          playerZ={cameraState.position[2]}
          visible={true}
        />
      )}

      {/* ── Retro HUD: Scrolling Activity Ticker ── */}
      {activeRoute !== 'lobby' && loadingDone && (
        <ActivityTicker />
      )}

    </div>
  );
}
