import { GameState, MechInstance, MechType } from './types';
import { createMech } from './Mech';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, collection, writeBatch } from 'firebase/firestore';

export async function initializeGame(id: string, playerIds: string[]): Promise<GameState> {
  const mechs: MechInstance[] = [];
  
  // Starting positions for 2 players, spaced further apart on opposite sides of the grid
  const startPositions = [
    { q: -6, r: 0 }, { q: -5, r: -1 }, { q: -5, r: 1 }, // Player 1 (Left)
    { q: 6, r: 0 }, { q: 5, r: 1 }, { q: 5, r: -1 }     // Player 2 (Right)
  ];
  
  playerIds.forEach((playerId, playerIdx) => {
    const types: MechType[] = ['light', 'medium', 'heavy'];
    types.forEach((type, typeIdx) => {
      const posIdx = playerIdx * 3 + typeIdx;
      const pos = startPositions[posIdx];
      mechs.push(createMech(`${playerId}_${type}`, type, playerId, pos.q, pos.r));
    });
  });
  
  const state: GameState = {
    id,
    players: playerIds,
    mechs,
    turn: 1,
    activePlayerId: playerIds[0],
    status: 'playing'
  };

  // Write to Firestore
  try {
    const gameRef = doc(db, 'games', id);
    const batch = writeBatch(db);
    
    batch.set(gameRef, {
      id: state.id,
      players: state.players,
      turn: state.turn,
      activePlayerId: state.activePlayerId,
      status: state.status,
      updatedAt: new Date().toISOString()
    });

    mechs.forEach(mech => {
      const mechRef = doc(collection(gameRef, 'mechs'), mech.id);
      batch.set(mechRef, mech);
    });
    
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `games/${id}`);
  }
  
  return state;
}

export async function endTurn(state: GameState): Promise<GameState> {
  const nextPlayerIdx = (state.players.indexOf(state.activePlayerId) + 1) % state.players.length;
  const nextPlayerId = state.players[nextPlayerIdx];
  
  const newMechs = state.mechs.map(m => {
    if (m.ownerId === state.activePlayerId) {
      return { ...m, hasMoved: false, hasAttacked: false };
    }
    return m;
  });

  const nextState = {
    ...state,
    mechs: newMechs,
    turn: state.turn + 1,
    activePlayerId: nextPlayerId
  };

  // Update Firestore
  try {
    const gameRef = doc(db, 'games', state.id);
    const batch = writeBatch(db);
    
    batch.set(gameRef, {
      activePlayerId: nextPlayerId,
      turn: state.turn + 1,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    state.mechs.forEach(mech => {
      if (mech.ownerId === state.activePlayerId) {
        const mechRef = doc(collection(gameRef, 'mechs'), mech.id);
        batch.update(mechRef, { hasMoved: false, hasAttacked: false });
      }
    });
    
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `games/${state.id}`);
  }
  
  return nextState;
}
