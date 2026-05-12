import React, { useState, useEffect } from 'react';
import { PreGameLobby } from './components/PreGameLobby';
import { generateAllAssets } from './services/assetGenerator';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { GameScreen } from './components/GameScreen';
import { LoginScreen } from './components/LoginScreen';
import { InitializingScreen } from './components/InitializingScreen';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [assets, setAssets] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentAssetLoading, setCurrentAssetLoading] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Ensure user document exists
        const userRef = doc(db, 'users', u.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: u.uid,
            displayName: u.displayName || 'Unknown Pilot',
            email: u.email,
            role: 'player',
            wins: 0,
            losses: 0
          });
        }
      }
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const start = async () => {
      // Generate assets in background
      try {
        setGenerationError(null);
        const generatedAssets = await generateAllAssets((progress, asset) => {
          setLoadingProgress(progress);
          setCurrentAssetLoading(asset);
        });
        
        // Check if any assets failed to generate (meaning they fell back to procedural)
        const missingAssets = Object.values(generatedAssets).filter(val => !val);
        if (missingAssets.length > 0) {
          setGenerationError("Some high-fidelity assets failed to generate (likely due to API quota limits). Using procedural fallback graphics.");
        }
        
        setAssets(generatedAssets);
      } catch (err: any) {
        console.error("Failed to generate assets", err);
        setGenerationError(err.message || "Failed to generate assets.");
      }
    };
    start();
  }, [isAuthReady, user]);

  const handleReady = () => {
    setIsLoading(false);
  };

  if (!isAuthReady) {
    return <InitializingScreen />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (isLoading) {
    return <PreGameLobby progress={loadingProgress} currentAsset={currentAssetLoading} onReady={handleReady} error={generationError} />;
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative select-none">
      <GameScreen user={user} assets={assets} />
      
      {/* Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50 opacity-20" />
    </div>
  );
}
