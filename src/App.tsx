import React, { useState, useRef } from 'react';
import { PixiApp, PixiAppRef } from './components/PixiApp';
import { HUD } from './components/HUD';
import { Dialogue } from './components/Dialogue';
import { PreGameLobby } from './components/PreGameLobby';

import { useAuth } from './hooks/useAuth';
import { useGameAssets } from './hooks/useGameAssets';
import { useGameState } from './hooks/useGameState';
import { useAITurn } from './hooks/useAITurn';

import { InitializationScreen } from './components/screens/InitializationScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { GameOverOverlay } from './components/screens/GameOverOverlay';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  const { user, isAuthReady } = useAuth();
  const { assets, isLoading, loadingProgress, currentAssetLoading, generationError, handleReady } = useGameAssets(isAuthReady, user);
  const { gameState, selectedMech, handleHexClick, handleEndTurn } = useGameState(user, isAuthReady);

  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [isDialogueVisible, setIsDialogueVisible] = useState(true);
  
  const pixiAppRef = useRef<PixiAppRef>(null);

  useAITurn(gameState, pixiAppRef);

  const narrative = [
    { speaker: "COMMANDER VANCE", text: "Welcome to the Iron Vanguard, pilot. We've been pushed back to the outer rim, but today we take our stand." },
    { speaker: "COMMANDER VANCE", text: "The Syndicate has deployed heavy mechs in the sector. We need to neutralize them before they reach the colony." },
    { speaker: "COMMANDER VANCE", text: "Select your units and move into position. Remember: heat management is key. Don't push your reactor too hard." },
  ];

  const handleHexClickWrapper = (q: number, r: number) => {
    handleHexClick(q, r, pixiAppRef);
  };

  const handleNextDialogue = () => {
    if (dialogueIndex < narrative.length - 1) {
      setDialogueIndex(dialogueIndex + 1);
    } else {
      setIsDialogueVisible(false);
    }
  };

  if (!isAuthReady) {
    return <InitializationScreen />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (isLoading) {
    return <PreGameLobby progress={loadingProgress} currentAsset={currentAssetLoading} onReady={handleReady} error={generationError} />;
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative select-none">
      {gameState && (
        <>
          <PixiApp 
            ref={pixiAppRef}
            gameState={gameState} 
            assets={assets}
            onHexClick={handleHexClickWrapper}
            selectedMech={selectedMech}
            user={user}
          />
          
          <HUD 
            gameState={gameState} 
            selectedMech={selectedMech}
            onEndTurn={handleEndTurn}
            isMyTurn={gameState.activePlayerId === user.uid}
            assets={assets}
          />
          
          <Dialogue 
            speaker={narrative[dialogueIndex].speaker}
            text={narrative[dialogueIndex].text}
            onNext={handleNextDialogue}
            isVisible={isDialogueVisible}
            assets={assets}
          />

          <GameOverOverlay gameState={gameState} user={user} />
        </>
      )}
      
      {/* Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50 opacity-20" />
    </div>
  );
}
