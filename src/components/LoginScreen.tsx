import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

export const LoginScreen: React.FC = () => {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center font-mono text-emerald-500 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/mech/1920/1080')] bg-cover bg-center" />
      <div className="relative z-10 bg-black/80 border border-emerald-500/30 p-12 rounded-sm backdrop-blur-xl text-center max-w-md">
        <h1 className="text-4xl font-bold tracking-tighter uppercase mb-2">Iron Vanguard</h1>
        <p className="text-emerald-500/70 text-sm mb-8 uppercase tracking-widest">Tactical Mech Command</p>
        <button
          onClick={handleLogin}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-4 rounded-sm transition-all uppercase tracking-widest flex items-center justify-center gap-3"
        >
          <span>Initialize Neural Link</span>
          <span className="text-xs opacity-50">(Google Login)</span>
        </button>
        <div className="mt-6 text-[10px] opacity-30 uppercase tracking-tighter">
          Authorized Personnel Only // Sector 7 Command
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50 opacity-20" />
    </div>
  );
};
