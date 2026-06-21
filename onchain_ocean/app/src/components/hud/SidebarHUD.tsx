import { useOceanStore } from '../../store/useOceanStore';
import { Map, Code2, Rocket, Users2, Layers, Trophy, BarChart3, Info } from 'lucide-react';

export default function SidebarHUD() {
  const activeRoute = useOceanStore((state) => state.activeRoute);
  const setRoute = useOceanStore((state) => state.setRoute);
  const resetSearch = useOceanStore((state) => state.resetSearch);

  const menuItems = [
    { id: 'explore', label: 'Ocean Map', icon: Map, route: 'explore' },
    { id: 'developers', label: 'Developers', icon: Code2, route: 'explore' },
    { id: 'startups', label: 'Startups', icon: Rocket, route: 'explore' },
    { id: 'communities', label: 'Communities', icon: Users2, route: 'explore' },
    { id: 'blockchains', label: 'Blockchains', icon: Layers, route: 'explore' },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, route: 'leaderboard' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, route: 'explore' },
    { id: 'about', label: 'About', icon: Info, route: 'explore' },
  ];

  const handleItemClick = (item: typeof menuItems[0]) => {
    if (item.id === 'explore') {
      resetSearch();
      setRoute('explore');
    } else if (item.id === 'leaderboard') {
      setRoute('leaderboard');
    } else {
      // For developers, startups, communities, blockchains - we stay in explore mode
      setRoute('explore');
      // We can also trigger specific category filters in the future if desired
    }
  };

  return (
    <div className="fixed left-4 top-24 bottom-24 w-20 md:w-24 rounded-3xl border border-white/10 glass-panel shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col items-center py-6 gap-2 z-40 select-none pointer-events-auto">
      {menuItems.map((item) => {
        const Icon = item.icon;

        // Let's refine simple active rules: 
        // Just highlight "Ocean Map" if route is explore/passport, or highlight leaderboard if route is leaderboard
        const isCurrentActive = 
          (item.id === 'explore' && (activeRoute === 'explore' || activeRoute === 'passport')) ||
          (item.id === 'leaderboard' && activeRoute === 'leaderboard');

        return (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex flex-col items-center justify-center gap-1 group transition-all duration-300 relative outline-none cursor-pointer ${
              isCurrentActive
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            {/* Glowing active bar on the left edge */}
            {isCurrentActive && (
              <div className="absolute left-0 w-1 h-6 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            )}

            <Icon size={18} className="transition-transform duration-300 group-hover:scale-110" />
            <span className="text-[8px] font-medium tracking-wide uppercase font-heading scale-90 md:scale-100 text-center leading-tight">
              {item.label.split(' ')[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
