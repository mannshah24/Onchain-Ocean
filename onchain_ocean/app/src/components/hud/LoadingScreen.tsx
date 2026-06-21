import { useState, useEffect, useCallback } from 'react';
import type { LoadingStage } from '../../types';

interface LoadingScreenProps {
  stage: LoadingStage;
  progress: number;
  error: string | null;
  accentColor: string;
  onRetry: () => void;
  onFadeComplete: () => void;
}

const STAGE_MESSAGES: Record<string, string> = {
  init: 'Calibrating sonar array...',
  fetching: 'Scanning the Solana ledger...',
  generating: 'Mapping coral structures...',
  rendering: 'Charting the deep ocean...',
  ready: 'Welcome to the Ocean',
};

const TIPS = [
  'Click any structure to see its wallet profile',
  'Use Swim Mode to navigate the ocean depths',
  'Taller structures = more transactions',
  'Try searching for any Solana wallet address',
  'Brighter structures = more recent activity',
  'Each zone represents a different protocol category',
  'Connect your wallet to find your own structure',
  'Whale\'s Abyss holds the top wallets by volume',
  'The DeFi Trench glows with swap activity',
];

// Underwater silhouette configs: [width, height, left%]
const SILHOUETTE_STRUCTURES: [number, number, number][] = [
  [28, 40, 2],
  [20, 65, 8],
  [32, 85, 14],
  [18, 50, 22],
  [24, 70, 28],
  [36, 110, 35],
  [22, 55, 44],
  [26, 75, 50],
  [30, 95, 58],
  [20, 45, 66],
  [34, 80, 72],
  [24, 60, 80],
  [28, 90, 87],
];

export default function LoadingScreen({
  stage,
  progress,
  error,
  accentColor,
  onRetry,
  onFadeComplete,
}: LoadingScreenProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [bubbles] = useState(() =>
    Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 4,
      size: 2 + Math.random() * 6,
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (stage === 'ready') {
      setFading(true);
    }
  }, [stage]);

  const handleTransitionEnd = useCallback(() => {
    if (fading) {
      onFadeComplete();
    }
  }, [fading, onFadeComplete]);

  const isError = stage === 'error';
  const message = isError ? error : STAGE_MESSAGES[stage] ?? '';

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-700 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ background: 'linear-gradient(180deg, #030712 0%, #041029 50%, #0c1f38 100%)' }}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* Animated bubbles */}
      {bubbles.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            left: `${b.left}%`,
            bottom: '-10px',
            width: b.size,
            height: b.size,
            backgroundColor: accentColor,
            animation: `bubble-rise ${b.duration}s ease-in ${b.delay}s infinite`,
          }}
        />
      ))}

      {/* Underwater structure silhouettes */}
      <div className="absolute bottom-0 left-0 right-0 h-36 overflow-hidden opacity-15">
        {SILHOUETTE_STRUCTURES.map(([w, h, left], i) => (
          <div
            key={i}
            className="absolute bottom-0"
            style={{
              width: w,
              height: h,
              left: `${left}%`,
              backgroundColor: accentColor,
              borderRadius: i % 3 === 0 ? '4px 4px 0 0' : i % 3 === 1 ? '8px 8px 0 0' : '2px',
              clipPath:
                i % 3 === 0
                  ? 'polygon(0 8px, 30% 8px, 30% 0, 70% 0, 70% 8px, 100% 8px, 100% 100%, 0 100%)'
                  : i % 3 === 1
                    ? 'polygon(10% 0, 90% 0, 100% 10%, 100% 100%, 0 100%, 0 10%)'
                    : undefined,
            }}
          />
        ))}
      </div>

      {/* God ray effect */}
      <div
        className="absolute top-0 left-1/3 w-32 h-full opacity-[0.03] pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${accentColor} 0%, transparent 70%)`,
          transform: 'skewX(-5deg)',
        }}
      />
      <div
        className="absolute top-0 right-1/4 w-24 h-full opacity-[0.02] pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${accentColor} 0%, transparent 60%)`,
          transform: 'skewX(8deg)',
        }}
      />

      {/* Title */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="text-4xl mb-3 animate-float">🌊</div>
        <h1
          className="font-heading text-3xl sm:text-4xl font-extrabold tracking-[0.2em] uppercase"
          style={{
            background: `linear-gradient(180deg, ${accentColor} 0%, #e0f2fe 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 0 20px ${accentColor}40)`,
          }}
        >
          ONCHAIN OCEAN
        </h1>
        <p className="mt-1 text-[10px] tracking-[0.3em] uppercase text-slate-500 font-mono font-semibold">
          Explore The World Onchain
        </p>
      </div>

      {/* Stage message */}
      <p className="mt-6 text-xs sm:text-sm tracking-wider text-slate-400 font-mono z-10">
        {message}
      </p>

      {/* Progress bar */}
      {!isError && (
        <div
          className="mt-6 h-3 w-56 sm:w-72 rounded-full overflow-hidden z-10"
          style={{ border: `2px solid ${accentColor}40`, background: '#030712' }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${Math.min(100, progress)}%`,
              background: `linear-gradient(90deg, ${accentColor}80, ${accentColor})`,
              boxShadow: `0 0 12px ${accentColor}80`,
            }}
          />
        </div>
      )}

      {/* Error retry */}
      {isError && (
        <button
          onClick={onRetry}
          className="mt-6 px-6 py-2.5 rounded-full font-heading font-semibold text-xs tracking-widest uppercase transition-all hover:scale-105 z-10"
          style={{
            backgroundColor: `${accentColor}20`,
            border: `2px solid ${accentColor}60`,
            color: accentColor,
          }}
        >
          Retry
        </button>
      )}

      {/* Tips rotator */}
      {!isError && (
        <p className="mt-8 max-w-xs text-center text-[10px] sm:text-xs leading-relaxed tracking-wide text-slate-600 font-mono z-10">
          💡 {TIPS[tipIndex]}
        </p>
      )}

      {/* Bubble rise animation */}
      <style>{`
        @keyframes bubble-rise {
          0% { transform: translateY(0) scale(1); opacity: 0.2; }
          50% { opacity: 0.4; }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
