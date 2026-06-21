import { motion } from 'framer-motion';
import { useOceanStore } from '../../store/useOceanStore';
import { Map, Palette, Trophy, Compass, Gamepad2 } from 'lucide-react';
import { OCEAN_THEMES } from '../../types';

export default function SidebarHUD() {
  const activeRoute = useOceanStore((state) => state.activeRoute);
  const setRoute = useOceanStore((state) => state.setRoute);
  const updateCameraState = useOceanStore((state) => state.updateCameraState);
  const toggleSonarMap = useOceanStore((state) => state.toggleSonarMap);
  const showSonarMap = useOceanStore((state) => state.showSonarMap);
  const theme = useOceanStore((state) => state.theme);
  const themeIndex = useOceanStore((state) => state.themeIndex);
  const setTheme = useOceanStore((state) => state.setTheme);
  const swimMode = useOceanStore((state) => state.swimMode);
  const toggleSwimMode = useOceanStore((state) => state.toggleSwimMode);

  if (activeRoute === 'lobby') return null;

  const buttons = [
    {
      icon: Compass,
      label: 'Explore',
      active: activeRoute === 'explore',
      onClick: () => {
        setRoute('explore');
        updateCameraState({ mode: 'free-float' });
      },
    },
    {
      icon: Trophy,
      label: 'Leaders',
      active: activeRoute === 'leaderboard',
      onClick: () => setRoute('leaderboard'),
    },
    {
      icon: Map,
      label: 'Sonar',
      active: showSonarMap,
      onClick: toggleSonarMap,
    },
    {
      icon: Gamepad2,
      label: 'Swim',
      active: swimMode,
      onClick: () => {
        if (!swimMode) setRoute('explore');
        toggleSwimMode();
      },
    },
    {
      icon: Palette,
      label: 'Theme',
      active: false,
      onClick: () => {
        const next = (themeIndex + 1) % OCEAN_THEMES.length;
        setTheme(next);
      },
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 pointer-events-auto select-none"
    >
      {buttons.map((btn, i) => {
        const Icon = btn.icon;
        return (
          <motion.button
            key={btn.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={btn.onClick}
            title={btn.label}
            className="group relative w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-300 cursor-pointer"
            style={{
              borderColor: btn.active ? `${theme.accent}60` : 'rgba(255,255,255,0.08)',
              background: btn.active ? `${theme.accent}15` : 'rgba(10,15,30,0.55)',
              backdropFilter: 'blur(20px)',
              boxShadow: btn.active ? `0 0 12px ${theme.accent}20` : undefined,
            }}
          >
            <Icon
              size={16}
              style={{
                color: btn.active ? theme.accent : 'rgb(148, 163, 184)',
                transition: 'color 0.2s',
              }}
            />
            {/* Tooltip */}
            <div className="absolute left-12 px-2.5 py-1 rounded-lg text-[9px] font-heading font-semibold tracking-wider uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 glass-panel border border-white/10 text-white">
              {btn.label}
              {btn.label === 'Theme' && (
                <span className="ml-1 text-[8px]" style={{ color: theme.accent }}>
                  ({OCEAN_THEMES[themeIndex].name})
                </span>
              )}
            </div>
          </motion.button>
        );
      })}

      {/* Theme indicator dot */}
      <div
        className="mx-auto w-2 h-2 rounded-full mt-1"
        style={{
          backgroundColor: theme.accent,
          boxShadow: `0 0 6px ${theme.accent}80`,
        }}
      />
    </motion.div>
  );
}
