import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, collection, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { GameState, MechInstance, HexCell } from '../game/types';
import { initializeGame, endTurn as gameEngineEndTurn } from '../game/GameEngine';
import { hexDistance } from '../game/hexUtils';
import { PixiAppRef } from '../components/PixiApp';

export function useGameState(user: User | null, isAuthReady: boolean) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedMech, setSelectedMech] = useState<MechInstance | undefined>(undefined);

  useEffect(() => {
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

  const handleHexClick = async (
    q: number,
    r: number,
    pixiAppRef: React.RefObject<PixiAppRef | null>
  ) => {
    if (!gameState || !user || gameState.status === 'finished') return;
    if (gameState.activePlayerId !== user.uid) return; // Not your turn

    const mechAtPos = gameState.mechs.find(m => m.position.q === q && m.position.r === r && !m.isDestroyed);

    if (mechAtPos) {
      if (selectedMech && selectedMech.id === mechAtPos.id) {
        setSelectedMech(undefined);
      } else if (selectedMech && selectedMech.ownerId === user.uid && mechAtPos.ownerId !== user.uid && !selectedMech.hasAttacked) {
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
            const opponentMechs = newMechs.filter(m => m.ownerId !== user.uid && !m.isDestroyed);
            if (opponentMechs.length === 0) {
              const gameRef = doc(db, 'games', gameState.id);
              await updateDoc(gameRef, {
                status: 'finished',
                winnerId: user.uid
              });
              newGameState.status = 'finished';
              newGameState.winnerId = user.uid;
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
    } else if (selectedMech && !selectedMech.hasMoved && selectedMech.ownerId === user.uid) {
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
    if (!gameState || !user) return;
    if (gameState.activePlayerId !== user.uid) return;
    await gameEngineEndTurn(gameState);
    setSelectedMech(undefined);
  };

  return {
    gameState,
    selectedMech,
    handleHexClick,
    handleEndTurn
  };
}
