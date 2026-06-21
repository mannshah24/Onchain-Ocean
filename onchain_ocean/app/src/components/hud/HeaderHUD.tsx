import { useState, useEffect, useRef } from 'react';
import { useOceanStore } from '../../store/useOceanStore';
import { X, Loader2, Search, Sun } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function HeaderHUD() {
  const setRoute = useOceanStore((state) => state.setRoute);
  const updateCameraState = useOceanStore((state) => state.updateCameraState);
  const resetSearch = useOceanStore((state) => state.resetSearch);
  const profiles = useOceanStore((state) => state.profiles);

  // Search states from store
  const searchQuery = useOceanStore((state) => state.searchQuery);
  const setSearchQuery = useOceanStore((state) => state.setSearchQuery);
  const isSearching = useOceanStore((state) => state.isSearching);
  const triggerSearch = useOceanStore((state) => state.triggerSearch);

  // Read/write store connection states
  const connectedAddress = useOceanStore((state) => state.connectedAddress);
  const connectWallet = useOceanStore((state) => state.connectWallet);
  const disconnectWallet = useOceanStore((state) => state.disconnectWallet);

  // Official Solana Wallet Adapter states
  const { select, wallets, disconnect, connected, publicKey, connecting } = useWallet();

  // Local UI states
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [connectionStep, setConnectionStep] = useState<'provider' | 'loading' | 'inject'>('provider');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState('');
  const [selectedPresetAddress, setSelectedPresetAddress] = useState('DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj');

  // Search input keyboard focus listener for '/' key
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

  // Synchronize official wallet adapter connection with Zustand state
  useEffect(() => {
    if (connected && publicKey) {
      const address = publicKey.toBase58();
      connectWallet(address);
      setShowModal(false);
    } else if (!connected && connectedAddress) {
      disconnectWallet();
    }
  }, [connected, publicKey]);

  // Synchronize official connection loading states with UI modal
  useEffect(() => {
    if (connecting) {
      setShowModal(true);
      setConnectionStep('loading');
    }
  }, [connecting]);

  // Find connected profile
  const connectedProfile = profiles.find(p => p.address === connectedAddress);
  const displayDomain = connectedProfile?.domain || (connectedAddress ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : '');

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
    
    // Find matching adapter in the registered wallets array
    const targetWallet = wallets.find(
      (w) => w.adapter.name.toLowerCase() === providerName.toLowerCase()
    );

    if (targetWallet && (targetWallet.readyState === 'Installed' || targetWallet.readyState === 'Loadable')) {
      try {
        setConnectionStep('loading');
        // Trigger browser extension connection popup
        select(targetWallet.adapter.name);
      } catch (err) {
        console.error("Wallet selection error:", err);
        setConnectionStep('inject');
      }
    } else {
      // Fallback: if extension is not installed, route to simulated injection mode
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
      if (connected) {
        await disconnect();
      }
    } catch (e) {
      console.warn("Wallet adapter disconnect failed:", e);
    }
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
        
        {/* --- Minimal Logo Symbol & Title --- */}
        <div 
          className="flex items-center gap-3 cursor-pointer pointer-events-auto group"
          onClick={handleLobbyClick}
        >
          <span className="text-xl md:text-2xl filter drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] group-hover:scale-110 transition-transform duration-300">🌊</span>
          <div className="flex flex-col gap-0.5">
            <h1 className="font-heading font-bold text-xs md:text-sm tracking-[0.14em] uppercase bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
              Onchain Ocean
            </h1>
            <span className="text-[7.5px] text-slate-500 font-mono tracking-widest uppercase font-semibold">
              Explore The World Onchain
            </span>
          </div>
        </div>

        {/* --- Central Search Console Capsule --- */}
        <div className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/10 bg-slate-950/40 backdrop-blur-md shadow-lg pointer-events-auto focus-within:border-cyan-400/40 transition-all duration-300 w-80">
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
          <div className="flex items-center gap-1.5 pl-2 border-l border-white/5 text-[9px] font-mono text-slate-500 select-none">
            <span>/</span>
          </div>
        </div>

        {/* --- Action Controls & Connections --- */}
        <div className="flex items-center gap-3 md:gap-4 pointer-events-auto">
          {/* Settings Theme Toggle Button */}
          <button className="p-2 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-cyan-400/25 transition-all duration-300 cursor-pointer">
            <Sun size={13} className="text-slate-400 hover:text-cyan-400" />
          </button>

          {/* Connect Wallet Container */}
          <div className="relative">
            <button
              onClick={handleWalletButtonClick}
              className="font-heading font-semibold text-[10px] md:text-xs tracking-widest uppercase py-2.5 px-4 md:px-5 rounded-full border border-cyan-400/30 bg-cyan-950/20 hover:border-cyan-400 hover:text-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.15)] cursor-pointer"
            >
              {connectedAddress ? (
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  {displayDomain}
                </span>
              ) : (
                'Connect Wallet'
              )}
            </button>

            {/* Connected options Dropdown menu */}
            {showDropdown && connectedAddress && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 glass-panel shadow-2xl p-1.5 flex flex-col gap-0.5 z-50">
                <button
                  onClick={handleFocusConnected}
                  className="w-full text-left py-2 px-3 rounded-xl text-xs font-heading font-semibold text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors cursor-pointer"
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

      {/* --- Simulated/Real Wallet Selector Modal --- */}
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
                    className="w-full flex items-center gap-4 py-2.5 px-4 rounded-xl border border-white/5 bg-white/5 hover:border-cyan-400/25 hover:bg-cyan-500/5 transition-all duration-300 text-left text-xs font-heading font-semibold text-slate-200 hover:text-white cursor-pointer"
                  >
                    <span className="text-base">{prov.emoji}</span>
                    <span>{prov.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Connecting loading screen */}
            {connectionStep === 'loading' && (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                <p className="text-[10px] font-mono text-slate-400">
                  Awaiting authorization in {selectedProvider} extension...
                </p>
              </div>
            )}

            {/* Step 3: Inject wallet details */}
            {connectionStep === 'inject' && (
              <div className="flex flex-col gap-3.5">
                <p className="text-[10px] text-slate-400 font-medium">
                  Extension not detected. Select a pre-seeded profile or enter a custom address/domain to inject into the ocean.
                </p>
                
                {/* Preset Dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] tracking-wider uppercase font-semibold text-slate-500 font-heading">
                    Preset Profile
                  </label>
                  <select
                    value={selectedPresetAddress}
                    onChange={(e) => setSelectedPresetAddress(e.target.value)}
                    disabled={!!customAddress.trim()}
                    className="w-full py-2 px-3 rounded-lg border border-white/10 bg-slate-950/70 text-[11px] font-mono text-white outline-none focus:border-cyan-400/40"
                  >
                    <option value="DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj">dhruv.sol (Coral Tower)</option>
                    <option value="NiSHuPkL4vRtF9yXcBwDm7eGjZ1sHq3oAn6UxW5KdTMr">nish.sol (Coral Tower)</option>
                    <option value="JUPag1h3kX9rY4fQz7cBwLm5eNvT8sGdOi2pUxW6KrMn">jup.sol (Glass Biodome)</option>
                    <option value="HeLi5sRtF2yN7vKxJm3pQcB9wGdZ4oTi8eUaLr1XnWCj">helius.sol (Research Station)</option>
                    <option value="JUPDA0vRtF9yXcBwDm7eGjZ1sHq3oAn6UxW5KdTMr">jupdao.sol (Reef Citadel)</option>
                  </select>
                </div>

                <div className="text-center text-[9px] text-slate-500 font-mono">- OR -</div>

                {/* Custom Address Input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] tracking-wider uppercase font-semibold text-slate-500 font-heading">
                    Custom Address / SNS Domain
                  </label>
                  <input
                    type="text"
                    placeholder="address.sol or Solana PubKey..."
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    className="w-full py-2 px-3 rounded-lg border border-white/10 bg-slate-950/70 text-[11px] font-mono text-white outline-none focus:border-cyan-400/40 placeholder-slate-600"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => setConnectionStep('provider')}
                    className="flex-1 py-2 rounded-full border border-white/5 bg-white/5 font-heading font-semibold text-[9px] tracking-widest uppercase text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConnectConfirm}
                    className="flex-1 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20 font-heading font-semibold text-[9px] tracking-widest uppercase text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400/40 transition-all cursor-pointer"
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
