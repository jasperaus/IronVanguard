import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PixiApp, PixiAppRef } from './components/PixiApp';
import { HUD } from './components/HUD';
import { Dialogue } from './components/Dialogue';
import { PreGameLobby } from './components/PreGameLobby';
import { initializeGame, endTurn } from './game/GameEngine';
import { GameState, MechInstance } from './game/types';
import {
  LOCAL_AI_ID,
  LOCAL_PLAYER_ID,
  attackLocalMech,
  createLocalSkirmishGame,
  endLocalTurn,
  moveLocalMech,
  runLocalAiTurn,
} from './game/localSkirmish';
import { generateAllAssets } from './services/assetGenerator';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { onSnapshot, doc, collection, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { hexDistance } from './game/hexUtils';
import { getTerrainProfile, TerrainProfile } from './game/terrain';

const LOCAL_USER = {
  uid: LOCAL_PLAYER_ID,
  displayName: 'Local Pilot',
} as User;

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
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedMech, setSelectedMech] = useState<MechInstance | undefined>(undefined);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [isDialogueVisible, setIsDialogueVisible] = useState(true);
  const [assets, setAssets] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentAssetLoading, setCurrentAssetLoading] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [inspectedTerrain, setInspectedTerrain] = useState<TerrainProfile | undefined>(undefined);
  const activeUser = isLocalMode ? LOCAL_USER : user;
  
  const pixiAppRef = useRef<PixiAppRef>(null);

  const narrative = [
    { speaker: "COMMANDER VANCE", text: "Welcome to the Iron Vanguard, pilot. We've been pushed back to the outer rim, but today we take our stand." },
    { speaker: "COMMANDER VANCE", text: "The Syndicate has deployed heavy mechs in the sector. We need to neutralize them before they reach the colony." },
    { speaker: "COMMANDER VANCE", text: "Select your units and move into position. Remember: heat management is key. Don't push your reactor too hard." },
  ];

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
    if (isLocalMode) {
      setAssets({});
      setGenerationError(null);
      setLoadingProgress(1);
      setCurrentAssetLoading('procedural battlefield');
      setIsLoading(false);
      return;
    }

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
  }, [isAuthReady, user, isLocalMode]);

  useEffect(() => {
    if (!isLocalMode) return;
    setGameState(createLocalSkirmishGame());
    setSelectedMech(undefined);
    setInspectedTerrain(undefined);
    setDialogueIndex(0);
    setIsDialogueVisible(true);
  }, [isLocalMode]);

  const handleReady = () => {
    setIsLoading(false);
  };

  // AI Turn Logic
  useEffect(() => {
    if (!gameState || gameState.status === 'finished') return;

    if (isLocalMode && gameState.activePlayerId === LOCAL_AI_ID) {
      const timeout = window.setTimeout(() => {
        setGameState((current) => current ? runLocalAiTurn(current) : current);
        setSelectedMech(undefined);
      }, 900);

      return () => window.clearTimeout(timeout);
    }
    
    if (!isLocalMode && gameState.activePlayerId === 'ai_1') {
      const runAITurn = async () => {
        // Simple delay for realism
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Work with a shallow copy to track state changes during the loop
        const currentMechs = [...gameState.mechs];
        const aiMechs = currentMechs.filter(m => m.ownerId === 'ai_1' && !m.isDestroyed);
        const playerMechs = currentMechs.filter(m => m.ownerId !== 'ai_1');
        
        // Pre-compute occupied hexes for O(1) lookup
        const occupiedHexes = new Set();
        currentMechs.filter(m => !m.isDestroyed).forEach(m => occupiedHexes.add(`${m.position.q},${m.position.r}`));

        for (const mech of aiMechs) {
          let target = playerMechs[0];
          let minDistToTarget = Infinity;
          for (const pm of playerMechs) {
            if (pm.isDestroyed) continue;
            const d = hexDistance(mech.position, pm.position);
            if (d < minDistToTarget) {
              minDistToTarget = d;
              target = pm;
            }
          }
          if (minDistToTarget === Infinity) break;
          
          if (minDistToTarget > mech.stats.range && !mech.hasMoved) {
            // Move closer (up to movement stat)
            let currentPos = mech.position;
            let movesLeft = mech.stats.movement;
            let hasMoved = false;

            // Temporarily remove this mech's starting position from occupied set
            occupiedHexes.delete(`${currentPos.q},${currentPos.r}`);

            while (movesLeft > 0) {
              const neighbors = [
                { q: currentPos.q + 1, r: currentPos.r },
                { q: currentPos.q + 1, r: currentPos.r - 1 },
                { q: currentPos.q, r: currentPos.r - 1 },
                { q: currentPos.q - 1, r: currentPos.r },
                { q: currentPos.q - 1, r: currentPos.r + 1 },
                { q: currentPos.q, r: currentPos.r + 1 },
              ];
              
              let bestHex = currentPos;
              let minDist = hexDistance(currentPos, target.position);
              
              for (const n of neighbors) {
                const occupied = occupiedHexes.has(`${n.q},${n.r}`);
                if (!occupied) {
                  const d = hexDistance(n, target.position);
                  if (d < minDist) {
                    minDist = d;
                    bestHex = n;
                  }
                }
              }
              
              if (bestHex !== currentPos) {
                currentPos = bestHex;
                movesLeft--;
                hasMoved = true;
              } else {
                break; // Stuck
              }
            }
            
            // Add the mech's final position back to occupied set
            occupiedHexes.add(`${currentPos.q},${currentPos.r}`);

            if (hasMoved) {
              if (pixiAppRef.current) {
                pixiAppRef.current.playDustAnimation(mech.position);
                setTimeout(() => {
                  if (pixiAppRef.current) pixiAppRef.current.playDustAnimation(currentPos);
                }, 600);
              }

              const mechRef = doc(db, 'games', gameState.id, 'mechs', mech.id);
              try {
                await updateDoc(mechRef, { position: currentPos, hasMoved: true });
                mech.position = currentPos;
                mech.hasMoved = true;
              } catch (err) {
                console.error("AI move failed", err);
              }
            }
          }
          
          // Re-evaluate distance after potential movement
          const distAfterMove = hexDistance(mech.position, target.position);
          if (distAfterMove <= mech.stats.range && !mech.hasAttacked) {
            // Attack!
            if (pixiAppRef.current) {
              pixiAppRef.current.playAttackAnimation(mech.position, target.position);
            }
            
            const damage = Math.max(0, mech.stats.damage - target.stats.armor);
            const newHp = Math.max(0, target.stats.hp - damage);
            const isDestroyed = newHp === 0;

            if (isDestroyed && pixiAppRef.current) {
              pixiAppRef.current.playExplosionAnimation(target.position);
            }

            const targetMechRef = doc(db, 'games', gameState.id, 'mechs', target.id);
            const attackerMechRef = doc(db, 'games', gameState.id, 'mechs', mech.id);
            
            try {
              await updateDoc(targetMechRef, { 'stats.hp': newHp, isDestroyed });
              await updateDoc(attackerMechRef, { hasAttacked: true });
              
              target.stats.hp = newHp;
              target.isDestroyed = isDestroyed;
              mech.hasAttacked = true;
              
              if (isDestroyed) {
                const hasPlayerMechs = currentMechs.some(m => m.ownerId !== 'ai_1' && !m.isDestroyed);
                if (!hasPlayerMechs) {
                  const gameRef = doc(db, 'games', gameState.id);
                  await updateDoc(gameRef, {
                    status: 'finished',
                    winnerId: 'ai_1'
                  });
                  return; // End turn early, game over
                }
              }
            } catch (err) {
              console.error("AI attack failed", err);
            }
          }
        }
        
        // End AI turn
        await endTurn(gameState);
      };
      
      runAITurn();
    }
  }, [gameState?.activePlayerId, gameState?.turn]);
  // Real-time game syncing
  useEffect(() => {
    if (isLocalMode) return;
    if (!user || !isAuthReady) return;
    const gameId = `game_${user.uid}`;
    
    const gameRef = doc(db, 'games', gameId);
    const mechsRef = collection(gameRef, 'mechs');

    let currentGameData: any = null;
    let currentMechsData: MechInstance[] | null = null;

    const updateState = () => {
      if (currentGameData && currentMechsData) {
        setGameState({ ...currentGameData, mechs: currentMechsData } as GameState);
      }
    };

    const unsubGame = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        currentGameData = snapshot.data();
        updateState();
      } else {
        // Initialize game if it doesn't exist
        initializeGame(gameId, [user.uid, 'ai_1']).then(state => {
          // state will be synced via snapshot soon
        });
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `games/${gameId}`));

    const unsubMechs = onSnapshot(mechsRef, (snapshot) => {
      currentMechsData = snapshot.docs.map(d => d.data() as MechInstance);
      updateState();
    }, (err) => handleFirestoreError(err, OperationType.GET, `games/${gameId}/mechs`));

    const handleReset = () => {
      initializeGame(gameId, [user.uid, 'ai_1']);
      setSelectedMech(undefined);
    };
    window.addEventListener('reset-game', handleReset);

    return () => {
      unsubGame();
      unsubMechs();
      window.removeEventListener('reset-game', handleReset);
    };
  }, [user, isAuthReady]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const handleLocalSkirmish = () => {
    setIsLocalMode(true);
  };

  const handleHexClick = async (q: number, r: number) => {
    if (!gameState || !activeUser || gameState.status === 'finished') return;
    if (gameState.activePlayerId !== activeUser.uid) return; // Not your turn
    setInspectedTerrain(getTerrainProfile(q, r));
    
    const mechAtPos = gameState.mechs.find(m => m.position.q === q && m.position.r === r && !m.isDestroyed);

    if (isLocalMode) {
      if (mechAtPos) {
        if (selectedMech && selectedMech.id === mechAtPos.id) {
          setSelectedMech(undefined);
        } else if (selectedMech && selectedMech.ownerId === activeUser.uid && mechAtPos.ownerId !== activeUser.uid && !selectedMech.hasAttacked) {
          const dist = hexDistance(selectedMech.position, mechAtPos.position);
          if (dist <= selectedMech.stats.range) {
            pixiAppRef.current?.playAttackAnimation(selectedMech.position, mechAtPos.position);
            const nextState = attackLocalMech(gameState, selectedMech.id, mechAtPos.id);
            const updatedTarget = nextState.mechs.find(m => m.id === mechAtPos.id);
            if (updatedTarget?.isDestroyed) {
              pixiAppRef.current?.playExplosionAnimation(mechAtPos.position);
            }
            setGameState(nextState);
            setSelectedMech(nextState.mechs.find(m => m.id === selectedMech.id));
          }
        } else {
          setSelectedMech(mechAtPos);
        }
      } else if (selectedMech && !selectedMech.hasMoved && selectedMech.ownerId === activeUser.uid) {
        const dist = hexDistance(selectedMech.position, { q, r });
        if (dist <= selectedMech.stats.movement) {
          const nextState = moveLocalMech(gameState, selectedMech.id, q, r);
          const updatedMech = nextState.mechs.find(m => m.id === selectedMech.id);
          if (updatedMech && (updatedMech.position.q !== selectedMech.position.q || updatedMech.position.r !== selectedMech.position.r)) {
            pixiAppRef.current?.playDustAnimation(selectedMech.position);
            setTimeout(() => pixiAppRef.current?.playDustAnimation({ q, r }), 600);
            setGameState(nextState);
            setSelectedMech(updatedMech);
          }
        }
      }
      return;
    }
    
    if (mechAtPos) {
      if (selectedMech && selectedMech.id === mechAtPos.id) {
        setSelectedMech(undefined);
      } else if (selectedMech && selectedMech.ownerId === activeUser.uid && mechAtPos.ownerId !== activeUser.uid && !selectedMech.hasAttacked) {
        // Attack logic
        const dist = hexDistance(selectedMech.position, mechAtPos.position);
        if (dist <= selectedMech.stats.range) {
          if (pixiAppRef.current) {
            pixiAppRef.current.playAttackAnimation(selectedMech.position, mechAtPos.position);
          }
          
          const damage = Math.max(0, selectedMech.stats.damage - mechAtPos.stats.armor);
          const newHp = Math.max(0, mechAtPos.stats.hp - damage);
          const isDestroyed = newHp === 0;

          if (isDestroyed && pixiAppRef.current) {
            pixiAppRef.current.playExplosionAnimation(mechAtPos.position);
          }

          const targetMechRef = doc(db, 'games', gameState.id, 'mechs', mechAtPos.id);
          const attackerMechRef = doc(db, 'games', gameState.id, 'mechs', selectedMech.id);
          
          try {
            await updateDoc(targetMechRef, {
              'stats.hp': newHp,
              isDestroyed
            });
            await updateDoc(attackerMechRef, {
              hasAttacked: true
            });
            
            // Optimistic update
            const newMechs = gameState.mechs.map(m => {
              if (m.id === mechAtPos.id) {
                return { ...m, stats: { ...m.stats, hp: newHp }, isDestroyed };
              }
              if (m.id === selectedMech.id) {
                return { ...m, hasAttacked: true };
              }
              return m;
            });
            
            let newGameState = { ...gameState, mechs: newMechs };

            // Check win condition
            if (isDestroyed) {
              const hasOpponentMechs = newMechs.some(m => m.ownerId !== activeUser.uid && !m.isDestroyed);
              if (!hasOpponentMechs) {
                const gameRef = doc(db, 'games', gameState.id);
                await updateDoc(gameRef, {
                  status: 'finished',
                  winnerId: activeUser.uid
                });
                newGameState.status = 'finished';
                newGameState.winnerId = activeUser.uid;
              }
            }

            setGameState(newGameState);
            setSelectedMech({ ...selectedMech, hasAttacked: true });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `games/${gameState.id}/mechs`);
          }
        }
      } else {
        setSelectedMech(mechAtPos);
      }
    } else if (selectedMech && !selectedMech.hasMoved && selectedMech.ownerId === activeUser.uid) {
      // Move logic
      const dist = hexDistance(selectedMech.position, { q, r });
      if (dist <= selectedMech.stats.movement) {
        if (pixiAppRef.current) {
          pixiAppRef.current.playDustAnimation(selectedMech.position); // Dust at start
          setTimeout(() => {
            if (pixiAppRef.current) pixiAppRef.current.playDustAnimation({ q, r }); // Dust at end
          }, 600);
        }

        const mechRef = doc(db, 'games', gameState.id, 'mechs', selectedMech.id);
        try {
          await updateDoc(mechRef, {
            position: { q, r },
            hasMoved: true
          });
          // Optimistic update
          const newMechs = gameState.mechs.map(m => {
            if (m.id === selectedMech.id) {
              return { ...m, position: { q, r }, hasMoved: true };
            }
            return m;
          });
          setGameState({ ...gameState, mechs: newMechs });
          setSelectedMech({ ...selectedMech, position: { q, r }, hasMoved: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `games/${gameState.id}/mechs/${selectedMech.id}`);
        }
      }
    }
  };

  const handleEndTurn = async () => {
    if (!gameState || !activeUser) return;
    if (gameState.activePlayerId !== activeUser.uid) return;
    if (isLocalMode) {
      setGameState(endLocalTurn(gameState));
      setSelectedMech(undefined);
      setInspectedTerrain(undefined);
      return;
    }
    await endTurn(gameState);
    setSelectedMech(undefined);
    setInspectedTerrain(undefined);
  };

  const handleNextDialogue = () => {
    if (dialogueIndex < narrative.length - 1) {
      setDialogueIndex(dialogueIndex + 1);
    } else {
      setIsDialogueVisible(false);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center font-mono text-emerald-500">
        <div className="space-y-4 text-center">
          <div className="text-2xl animate-pulse tracking-widest uppercase">Initializing Tactical Link...</div>
          <div className="text-xs opacity-50">Syncing with orbital command...</div>
        </div>
      </div>
    );
  }

  if (!activeUser) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center font-mono text-emerald-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/mech/1920/1080')] bg-cover bg-center" />
        <div className="relative z-10 bg-black/80 border border-emerald-500/30 p-12 rounded-sm backdrop-blur-xl text-center max-w-md">
          <h1 className="text-4xl font-bold tracking-tighter uppercase mb-2">Iron Vanguard</h1>
          <p className="text-emerald-500/70 text-sm mb-8 uppercase tracking-widest">Tactical Mech Command</p>
          <button 
            onClick={handleLogin}
            aria-label="Initialize Neural Link with Google Login"
            title="Login with Google"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-4 rounded-sm transition-all uppercase tracking-widest flex items-center justify-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <span>Initialize Neural Link</span>
            <span className="text-xs opacity-50">(Google Login)</span>
          </button>
          <button
            onClick={handleLocalSkirmish}
            aria-label="Play Local Skirmish"
            title="Play Local Skirmish"
            className="w-full mt-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 rounded-sm transition-all uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Play Local Skirmish
          </button>
          <p className="mt-4 text-[10px] text-emerald-500/50 uppercase tracking-tight">
            No account, API key, or setup required. Good for quick family testing.
          </p>
          <div className="mt-6 text-[10px] opacity-30 uppercase tracking-tighter">
            Authorized Personnel Only // Sector 7 Command
          </div>
        </div>
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50 opacity-20" />
      </div>
    );
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
            onHexClick={handleHexClick}
            selectedMech={selectedMech}
            user={activeUser}
          />
          
          <HUD 
            gameState={gameState} 
            selectedMech={selectedMech}
            onEndTurn={handleEndTurn}
            isMyTurn={gameState.activePlayerId === activeUser.uid}
            assets={assets}
            inspectedTerrain={inspectedTerrain}
          />
          
          <Dialogue 
            speaker={narrative[dialogueIndex].speaker}
            text={narrative[dialogueIndex].text}
            onNext={handleNextDialogue}
            isVisible={isDialogueVisible}
            assets={assets}
          />

          {/* Game Over Overlay */}
          <AnimatePresence>
            {gameState.status === 'finished' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-[100] backdrop-blur-2xl"
              >
                <h2 className="text-6xl font-bold text-emerald-500 tracking-tighter uppercase mb-4">
                  {gameState.winnerId === activeUser.uid ? 'Victory' : 'Defeat'}
                </h2>
                <p className="text-emerald-500/50 font-mono uppercase tracking-widest mb-12">
                  Mission Parameters {gameState.winnerId === activeUser.uid ? 'Achieved' : 'Failed'}
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  aria-label="Return to Command"
                  title="Return to Command"
                  className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold px-12 py-4 rounded-sm transition-all uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Return to Command
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      
      {/* Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50 opacity-20" />
    </div>
  );
}
