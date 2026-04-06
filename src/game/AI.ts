import { GameState, MechInstance } from './types';
import { hexDistance, getHexNeighbors } from './hexUtils';
import { calculateDamage, applyDamage } from './Combat';

export function runAITurn(state: GameState): GameState {
  let newState = { ...state, mechs: [...state.mechs] };
  const aiMechs = newState.mechs.filter(m => m.ownerId === 'ai_1' && !m.isDestroyed);
  const playerMechs = newState.mechs.filter(m => m.ownerId === 'player_1' && !m.isDestroyed);

  aiMechs.forEach(mech => {
    // 1. Find closest player mech
    let closestPlayer: MechInstance | null = null;
    let minDist = Infinity;

    playerMechs.forEach(p => {
      const dist = hexDistance(mech.position, p.position);
      if (dist < minDist) {
        minDist = dist;
        closestPlayer = p;
      }
    });

    if (closestPlayer) {
      // 2. Move towards player if not in range
      if (minDist > mech.stats.range) {
        const neighbors = getHexNeighbors(mech.position);
        let bestMove = mech.position;
        let bestDist = minDist;

        neighbors.forEach(n => {
          const d = hexDistance(n, closestPlayer!.position);
          if (d < bestDist) {
            bestDist = d;
            bestMove = n;
          }
        });
        
        const mechIdx = newState.mechs.findIndex(m => m.id === mech.id);
        newState.mechs[mechIdx] = { ...newState.mechs[mechIdx], position: bestMove, hasMoved: true };
      }

      // 3. Attack if in range
      if (hexDistance(mech.position, closestPlayer!.position) <= mech.stats.range) {
        const damage = calculateDamage(mech, closestPlayer!);
        const targetIdx = newState.mechs.findIndex(m => m.id === closestPlayer!.id);
        newState.mechs[targetIdx] = applyDamage(newState.mechs[targetIdx], damage);
      }
    }
  });

  return newState;
}
