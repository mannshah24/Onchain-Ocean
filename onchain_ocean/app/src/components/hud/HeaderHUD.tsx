import { useState, useEffect, useRef } from 'react';
import { useOceanStore } from '../../store/useOceanStore';
import { X, Loader2, Search } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getWalletArchetype } from '../../types';
// Palette icon removed - not currently used

export default function HeaderHUD() {
  const setRoute = useOceanStore((state) => state.setRoute);
  const updateCameraState = useOceanStore((state) => state.updateCameraState);
  const resetSearch = useOceanStore((state) => state.resetSearch);
  const profiles = useOceanStore((state) => state.profiles);
  const theme = useOceanStore((state) => state.theme);

  const searchQuery = useOceanStore((state) => state.searchQuery);
  const setSearchQuery = useOceanStore((state) => state.setSearchQuery);
  const isSearching = useOceanStore((state) => state.isSearching);
  const triggerSearch = useOceanStore((state) => state.triggerSearch);

  const connectedAddress = useOceanStore((state) => state.connectedAddress);
  const connectWallet = useOceanStore((state) => state.connectWallet);
  const disconnectWallet = useOceanStore((state) => state.disconnectWallet);
  const solanaNetwork = useOceanStore((state) => state.solanaNetwork);
  const setSolanaNetwork = useOceanStore((state) => state.setSolanaNetwork);

  const { select, wallets, disconnect, connected, publicKey, connecting } = useWallet();

  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [connectionStep, setConnectionStep] = useState<'provider' | 'loading' | 'inject'>('provider');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState('');
  const [selectedPresetAddress, setSelectedPresetAddress] = useState('DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj');

  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);



  useEffect(() => {
    if (connected && publicKey) {
      const address = publicKey.toBase58();
      connectWallet(address);
      setShowModal(false);
    } else if (!connected && connectedAddress) {
      disconnectWallet();
    }
  }, [connected, publicKey]);

  useEffect(() => {
    if (connecting) {
      setShowModal(true);
      setConnectionStep('loading');
    }
  }, [connecting]);

  const connectedProfile = profiles.find(p => p.address === connectedAddress);
  const displayDomain = connectedProfile?.domain || (connectedAddress ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : '');
  const archetype = connectedAddress ? getWalletArchetype(connectedAddress) : '';

  const handleLobbyClick = () => {
    resetSearch();
    setRoute('lobby');
    updateCameraState({ mode: 'cinematic-panning' });
  };

  const handleWalletButtonClick = () => {
    if (connectedAddress) {
      setShowDropdown(!showDropdown);
    } else {
      setShowModal(true);
      setConnectionStep('provider');
      setSelectedProvider(null);
      setCustomAddress('');
      setSelectedPresetAddress('DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj');
    }
  };

  const handleSelectProvider = async (providerName: string) => {
    setSelectedProvider(providerName);
    const targetWallet = wallets.find(
      (w) => w.adapter.name.toLowerCase() === providerName.toLowerCase()
    );
    if (!targetWallet) {
      setConnectionStep('inject');
      return;
    }

    try {
      setConnectionStep('loading');
      select(targetWallet.adapter.name);
      await targetWallet.adapter.connect();
    } catch (err) {
      console.error("Direct wallet connection failed, falling back to manual entry:", err);
      setConnectionStep('inject');
    }
  };

  const handleConnectConfirm = () => {
    const addressToConnect = customAddress.trim() || selectedPresetAddress;
    if (!addressToConnect) return;
    connectWallet(addressToConnect);
    setShowModal(false);
  };

  const handleDisconnect = async () => {
    try {
      if (connected) await disconnect();
    } catch {}
    disconnectWallet();
    setShowDropdown(false);
  };

  const handleFocusConnected = () => {
    if (connectedAddress) {
      useOceanStore.getState().setSelectedAddress(connectedAddress);
    }
    setShowDropdown(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 p-4 md:p-6 flex items-center justify-between pointer-events-none select-none">
        
        {/* Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer pointer-events-auto group"
          onClick={handleLobbyClick}
        >
          <span className="text-xl md:text-2xl group-hover:scale-110 transition-transform duration-300" style={{ filter: `drop-shadow(0 0 8px ${theme.accent}80)` }}>🌊</span>
          <div className="flex flex-col gap-0.5">
            <h1
              className="font-heading font-bold text-xs md:text-sm tracking-[0.14em] uppercase"
              style={{
                background: `linear-gradient(90deg, #fff, ${theme.accent})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Onchain Ocean
            </h1>
            <span className="text-[7.5px] text-slate-500 font-mono tracking-widest uppercase font-semibold">
              Explore The World Onchain
            </span>
          </div>
        </div>

        {/* Search Console */}
        <div
          className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-full border glass-panel shadow-lg pointer-events-auto transition-all duration-300 w-80"
          style={{ borderColor: isSearching ? `${theme.accent}40` : 'rgba(255,255,255,0.1)' }}
        >
          <Search size={13} className="text-slate-500" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Scan wallet address / domain"
            value={searchQuery}
            disabled={isSearching}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchQuery.trim() && triggerSearch(searchQuery)}
            className="bg-transparent border-none outline-none text-[11px] font-mono tracking-wide text-white placeholder-slate-500 flex-1 w-full"
          />
          {isSearching ? (
            <Loader2 size={13} className="animate-spin" style={{ color: theme.accent }} />
          ) : (
            <div className="flex items-center gap-1.5 pl-2 border-l border-white/5 text-[9px] font-mono text-slate-500 select-none">
              <span>/</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 md:gap-4 pointer-events-auto">
          {/* Connected wallet archetype badge */}
          {connectedAddress && archetype && (
            <span className="hidden md:inline text-[9px] font-mono px-2 py-1 rounded-lg border" style={{ color: theme.accent, borderColor: `${theme.accent}30`, background: `${theme.accent}08` }}>
              {archetype.split(' ').slice(0, 2).join(' ')}
            </span>
          )}

          {/* Network Switcher */}
          <div className="flex items-center rounded-full border border-white/10 glass-panel p-0.5 select-none text-[9px] font-heading font-semibold tracking-wider uppercase h-[30px] shadow-sm">
            <button
              onClick={() => setSolanaNetwork('mainnet')}
              className="px-2.5 h-full rounded-full transition-all duration-300 cursor-pointer"
              style={{
                background: solanaNetwork === 'mainnet' ? `${theme.accent}20` : 'transparent',
                color: solanaNetwork === 'mainnet' ? theme.accent : '#94a3b8',
                border: solanaNetwork === 'mainnet' ? `1px solid ${theme.accent}30` : '1px solid transparent',
              }}
            >
              Mainnet
            </button>
            <button
              onClick={() => setSolanaNetwork('devnet')}
              className="px-2.5 h-full rounded-full transition-all duration-300 cursor-pointer"
              style={{
                background: solanaNetwork === 'devnet' ? `${theme.accent}20` : 'transparent',
                color: solanaNetwork === 'devnet' ? theme.accent : '#94a3b8',
                border: solanaNetwork === 'devnet' ? `1px solid ${theme.accent}30` : '1px solid transparent',
              }}
            >
              Devnet
            </button>
          </div>

          {/* Connect Wallet */}
          <div className="relative">
            <button
              onClick={handleWalletButtonClick}
              className="font-heading font-semibold text-[10px] md:text-xs tracking-widest uppercase py-2.5 px-4 md:px-5 rounded-full border transition-all duration-300 cursor-pointer"
              style={{
                borderColor: `${theme.accent}40`,
                background: `${theme.accent}08`,
                color: connectedAddress ? theme.accent : '#e2e8f0',
                boxShadow: connectedAddress ? `0 0 15px ${theme.accent}15` : undefined,
              }}
            >
              {connectedAddress ? (
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: theme.accent }}></span>
                  {displayDomain}
                </span>
              ) : (
                'Connect Wallet'
              )}
            </button>

            {/* Dropdown */}
            {showDropdown && connectedAddress && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 glass-panel shadow-2xl p-1.5 flex flex-col gap-0.5 z-50">
                <button
                  onClick={handleFocusConnected}
                  className="w-full text-left py-2 px-3 rounded-xl text-xs font-heading font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                  onMouseEnter={(e) => (e.currentTarget.style.background = `${theme.accent}10`)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  Focus Structure
                </button>
                <button
                  onClick={handleDisconnect}
                  className="w-full text-left py-2 px-3 rounded-xl text-xs font-heading font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Wallet Selector Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto select-none">
          <div className="w-[calc(100%-32px)] max-w-sm rounded-3xl border border-white/10 glass-panel shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-6 flex flex-col gap-5">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="font-heading font-bold text-xs tracking-wider uppercase text-white">
                {connectionStep === 'provider' && 'Connect Wallet'}
                {connectionStep === 'loading' && 'Connecting Extension'}
                {connectionStep === 'inject' && 'Inject Identity'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full border border-white/5 bg-white/5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>

            {/* Step 1: Provider selection */}
            {connectionStep === 'provider' && (
              <div className="flex flex-col gap-2">
                {[
                  { name: 'Phantom', emoji: '👻' },
                  { name: 'Solflare', emoji: '☀️' }
                ].map((prov) => (
                  <button
                    key={prov.name}
                    onClick={() => handleSelectProvider(prov.name)}
                    className="w-full flex items-center gap-4 py-2.5 px-4 rounded-xl border border-white/5 bg-white/5 transition-all duration-300 text-left text-xs font-heading font-semibold text-slate-200 hover:text-white cursor-pointer"
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${theme.accent}40`; e.currentTarget.style.background = `${theme.accent}08`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  >
                    <span className="text-base">{prov.emoji}</span>
                    <span>{prov.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Loading */}
            {connectionStep === 'loading' && (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.accent }} />
                <p className="text-[10px] font-mono text-slate-400">
                  Awaiting authorization in {selectedProvider} extension...
                </p>
              </div>
            )}

            {/* Step 3: Inject */}
            {connectionStep === 'inject' && (
              <div className="flex flex-col gap-3.5">
                <p className="text-[10px] text-slate-400 font-medium">
                  Extension not detected. Select a pre-seeded profile or enter a custom address/domain to explore.
                </p>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] tracking-wider uppercase font-semibold text-slate-500 font-heading">
                    Preset Profile
                  </label>
                  <select
                    value={selectedPresetAddress}
                    onChange={(e) => setSelectedPresetAddress(e.target.value)}
                    disabled={!!customAddress.trim()}
                    className="w-full py-2 px-3 rounded-lg border border-white/10 bg-slate-950/70 text-[11px] font-mono text-white outline-none"
                    style={{ ['--focus-border' as any]: theme.accent }}
                  >
                    <option value="DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj">whale.sol (Whale)</option>
                    <option value="NiSHuPkL4vRtF9yXcBwDm7eGjZ1sHq3oAn6UxW5KdTMr">degen.sol (Degen)</option>
                    <option value="JUPag1h3kX9rY4fQz7cBwLm5eNvT8sGdOi2pUxW6KrMn">jupiter.sol (DeFi Protocol)</option>
                    <option value="HeLi5sRtF2yN7vKxJm3pQcB9wGdZ4oTi8eUaLr1XnWCj">helius.sol (Infrastructure)</option>
                    <option value="JUPDA0vRtF9yXcBwDm7eGjZ1sHq3oAn6UxW5KdTMr">jupdao.sol (DAO)</option>
                  </select>
                </div>

                <div className="text-center text-[9px] text-slate-500 font-mono">- OR -</div>

                <div className="flex flex-col gap-1">
                  <label className="text-[8px] tracking-wider uppercase font-semibold text-slate-500 font-heading">
                    Custom Address / SNS Domain
                  </label>
                  <input
                    type="text"
                    placeholder="address.sol or Solana PubKey..."
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    className="w-full py-2 px-3 rounded-lg border border-white/10 bg-slate-950/70 text-[11px] font-mono text-white outline-none placeholder-slate-600"
                  />
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => setConnectionStep('provider')}
                    className="flex-1 py-2 rounded-full border border-white/5 bg-white/5 font-heading font-semibold text-[9px] tracking-widest uppercase text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConnectConfirm}
                    className="flex-1 py-2 rounded-full border font-heading font-semibold text-[9px] tracking-widest uppercase transition-all cursor-pointer"
                    style={{
                      borderColor: `${theme.accent}30`,
                      background: `${theme.accent}10`,
                      color: theme.accent,
                    }}
                  >
                    Connect
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
