import { useState, useEffect } from 'react';
import { useOceanStore } from '../../store/useOceanStore';

export default function SonarHUD() {
  const sonarActive = useOceanStore((state) => state.sonarActive);
  const theme = useOceanStore((state) => state.theme);

  const [mockCoords, setMockCoords] = useState({ x: 0.0, z: 0.0 });
  const [loadMsg, setLoadMsg] = useState('Pinging...');

  useEffect(() => {
    if (!sonarActive) return;

    const coordInterval = setInterval(() => {
      setMockCoords({
        x: parseFloat(((Math.random() - 0.5) * 300).toFixed(1)),
        z: parseFloat(((Math.random() - 0.5) * 300).toFixed(1)),
      });
    }, 80);

    const textIntervals = [
      setTimeout(() => setLoadMsg('RESOLVING PUBLIC ADDRESS...'), 300),
      setTimeout(() => setLoadMsg('INDEXING HISTORICAL BLOCKS...'), 700),
      setTimeout(() => setLoadMsg('COMPUTING GEOTHERMAL SHADER...'), 1100),
      setTimeout(() => setLoadMsg('LOCKING SPECTATOR VECTOR...'), 1400),
    ];

    return () => {
      clearInterval(coordInterval);
      textIntervals.forEach((t) => clearTimeout(t));
      setLoadMsg('Pinging...');
    };
  }, [sonarActive]);

  if (!sonarActive) return null;

  return (
    <div className="absolute inset-0 z-50 w-full h-full pointer-events-none flex items-center justify-center bg-black/20 backdrop-blur-[1px] select-none font-mono">
      
      {/* Sonar Pulsing Rings */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border animate-[sonar-sweep_2.5s_cubic-bezier(0.1,0.8,0.3,1)_infinite]"
        style={{ borderColor: `${theme.accent}30` }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border animate-[sonar-sweep_2.5s_cubic-bezier(0.1,0.8,0.3,1)_infinite] animation-delay-1000"
        style={{ borderColor: `${theme.accent}15` }}
      />

      {/* Center Target Reticle */}
      <div className="flex flex-col items-center gap-3 border border-white/5 py-4 px-6 rounded-2xl glass-panel shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: theme.accent }} />
          <span className="font-bold text-xs tracking-widest uppercase" style={{ color: theme.accent }}>sonar lock</span>
        </div>
        
        <div className="text-[10px] text-slate-300 font-medium">
          GRID COORDINATES:{' '}
          <span className="text-white">
            [{mockCoords.x >= 0 ? '+' : ''}{mockCoords.x}, {mockCoords.z >= 0 ? '+' : ''}{mockCoords.z}]
          </span>
        </div>

        <div className="text-[9px] text-slate-500 text-center w-48 tracking-wider">
          {loadMsg}
        </div>
      </div>
    </div>
  );
}
