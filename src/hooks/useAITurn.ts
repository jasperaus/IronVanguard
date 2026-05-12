import React, { useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { GameState } from '../game/types';
import { endTurn } from '../game/GameEngine';
import { hexDistance } from '../game/hexUtils';
import { PixiAppRef } from '../components/PixiApp';

export function useAITurn(gameState: GameState | null, pixiAppRef: React.RefObject<PixiAppRef | null>) {
  useEffect(() => {
    if (!gameState || gameState.status === 'finished') return;

    if (gameState.activePlayerId === 'ai_1') {
      const runAITurn = async () => {
        // Simple delay for realism
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Work with a shallow copy to track state changes during the loop
        const currentMechs = [...gameState.mechs];
        const aiMechs = currentMechs.filter(m => m.ownerId === 'ai_1' && !m.isDestroyed);

        for (const mech of aiMechs) {
          const playerMechs = currentMechs.filter(m => m.ownerId !== 'ai_1' && !m.isDestroyed);
          if (playerMechs.length === 0) break;

          // Find closest player mech
          let target = playerMechs[0];
          let minDistToTarget = hexDistance(mech.position, target.position);
          for (const pm of playerMechs) {
            const d = hexDistance(mech.position, pm.position);
            if (d < minDistToTarget) {
              minDistToTarget = d;
              target = pm;
            }
          }

          if (minDistToTarget > mech.stats.range && !mech.hasMoved) {
            // Move closer (up to movement stat)
            let currentPos = mech.position;
            let movesLeft = mech.stats.movement;
            let hasMoved = false;

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
                const occupied = currentMechs.some(m => m.position.q === n.q && m.position.r === n.r && !m.isDestroyed);
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
                const remainingPlayerMechs = currentMechs.filter(m => m.ownerId !== 'ai_1' && !m.isDestroyed);
                if (remainingPlayerMechs.length === 0) {
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
}
