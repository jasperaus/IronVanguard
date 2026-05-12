import React from 'react';

export const InitializingScreen: React.FC = () => {
  return (
    <div className="w-full h-screen bg-black flex items-center justify-center font-mono text-emerald-500">
      <div className="space-y-4 text-center">
        <div className="text-2xl animate-pulse tracking-widest uppercase">Initializing Tactical Link...</div>
        <div className="text-xs opacity-50">Syncing with orbital command...</div>
      </div>
    </div>
  );
};
