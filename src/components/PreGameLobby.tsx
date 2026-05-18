import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface PreGameLobbyProps {
  progress: number;
  currentAsset: string;
  onReady: () => void;
  error?: string | null;
}

export const PreGameLobby: React.FC<PreGameLobbyProps> = ({ progress, currentAsset, onReady, error }) => {
  const isLoaded = progress >= 1;

  useEffect(() => {
    if (isLoaded && !error) {
      const timer = setTimeout(() => {
        onReady();
      }, 1000); // 1 second delay to show 100% before deploying
      return () => clearTimeout(timer);
    }
  }, [isLoaded, onReady, error]);

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center font-mono text-emerald-500 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/mechbay/1920/1080')] bg-cover bg-center" />
      
      <div className="relative z-10 bg-black/80 border border-emerald-500/30 p-12 rounded-sm backdrop-blur-xl w-full max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tighter uppercase mb-2">Command Center</h1>
        <p className="text-emerald-500/70 text-sm mb-8 uppercase tracking-widest">Pre-Flight Checklist</p>
        
        <div className="space-y-6">
          <div className="flex justify-between text-xs uppercase tracking-widest text-emerald-500/70">
            <span>System Initialization</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          
          <div
            className="w-full h-2 bg-emerald-900/50 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="System Initialization Progress"
          >
            <motion.div 
              className="h-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ ease: "linear", duration: 0.2 }}
            />
          </div>

          <div
            className="text-xs uppercase tracking-widest text-emerald-500/50 h-4"
            aria-live="polite"
            aria-atomic="true"
          >
            {isLoaded ? '> All systems go.' : (currentAsset ? `> Loading asset: ${currentAsset}...` : '> Establishing orbital link...')}
          </div>
          
          {error && (
            <div
              className="text-xs text-amber-500 bg-amber-900/20 border border-amber-500/30 p-3 rounded-sm mt-4"
              role="alert"
            >
              WARNING: {error}
            </div>
          )}

          {isLoaded && error && (
            <button 
              onClick={onReady}
              aria-label="Deploy with Fallback Systems"
              title="Deploy with Fallback Systems"
              className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold py-3 rounded-sm transition-all uppercase tracking-widest mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Deploy with Fallback Systems
            </button>
          )}
        </div>

        <div className="mt-12">
          <div className="border border-emerald-500/20 p-4 bg-emerald-900/10">
            <div className="text-xs text-emerald-500/50 uppercase mb-2">Mission Briefing</div>
            <div className="text-sm">Sector 7 is under heavy Syndicate attack. Your objective is to deploy and neutralize all hostile forces.</div>
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50 opacity-20" />
    </div>
  );
};
