import { createMech } from './Mech';
import { applyDamage, calculateDamage } from './Combat';
import { hexDistance } from './hexUtils';
import { GameState, MechInstance, MechType } from './types';

export const LOCAL_PLAYER_ID = 'local_player';
export const LOCAL_AI_ID = 'ai_1';

const startPositions = [
  { q: -6, r: 0 }, { q: -5, r: -1 }, { q: -5, r: 1 },
  { q: 6, r: 0 }, { q: 5, r: 1 }, { q: 5, r: -1 },
];

export function createLocalSkirmishGame(): GameState {
  const mechs: MechInstance[] = [];
  const players = [LOCAL_PLAYER_ID, LOCAL_AI_ID];

  players.forEach((playerId, playerIdx) => {
    const types: MechType[] = ['light', 'medium', 'heavy'];
    types.forEach((type, typeIdx) => {
      const pos = startPositions[playerIdx * 3 + typeIdx];
      mechs.push(createMech(`${playerId}_${type}`, type, playerId, pos.q, pos.r));
    });
  });

  return {
    id: 'local_skirmish',
    players,
    mechs,
    turn: 1,
    activePlayerId: LOCAL_PLAYER_ID,
    status: 'playing',
  };
}

export function moveLocalMech(state: GameState, mechId: string, q: number, r: number): GameState {
  const mech = state.mechs.find((m) => m.id === mechId);
  if (!mech || mech.isDestroyed || mech.hasMoved || mech.ownerId !== state.activePlayerId) return state;
  if (hexDistance(mech.position, { q, r }) > mech.stats.movement) return state;

  const isOccupied = state.mechs.some(
    (m) => !m.isDestroyed && m.id !== mechId && m.position.q === q && m.position.r === r
  );
  if (isOccupied) return state;

  return {
    ...state,
    mechs: state.mechs.map((m) => (
      m.id === mechId
        ? { ...m, position: { q, r }, hasMoved: true, stats: { ...m.stats, heat: Math.min(m.stats.maxHeat, m.stats.heat + 6) } }
        : m
    )),
  };
}

export function attackLocalMech(state: GameState, attackerId: string, defenderId: string): GameState {
  const attacker = state.mechs.find((m) => m.id === attackerId);
  const defender = state.mechs.find((m) => m.id === defenderId);
  if (!attacker || !defender || attacker.isDestroyed || defender.isDestroyed) return state;
  if (attacker.ownerId !== state.activePlayerId || attacker.ownerId === defender.ownerId || attacker.hasAttacked) return state;
  if (hexDistance(attacker.position, defender.position) > attacker.stats.range) return state;

  const damage = calculateDamage(attacker, defender);
  const damagedDefender = applyDamage(defender, damage);
  const mechs = state.mechs.map((m) => {
    if (m.id === defenderId) return damagedDefender;
    if (m.id === attackerId) {
      return {
        ...m,
        hasAttacked: true,
        stats: { ...m.stats, heat: Math.min(m.stats.maxHeat, m.stats.heat + 18) },
      };
    }
    return m;
  });

  const winnerId = getWinnerId(mechs);
  return {
    ...state,
    mechs,
    status: winnerId ? 'finished' : state.status,
    winnerId,
  };
}

export function endLocalTurn(state: GameState): GameState {
  if (state.status === 'finished') return state;

  const nextPlayerIdx = (state.players.indexOf(state.activePlayerId) + 1) % state.players.length;
  const nextPlayerId = state.players[nextPlayerIdx];

  return {
    ...state,
    turn: state.turn + 1,
    activePlayerId: nextPlayerId,
    mechs: state.mechs.map((m) => (
      m.ownerId === state.activePlayerId
        ? { ...m, hasMoved: false, hasAttacked: false, stats: { ...m.stats, heat: Math.max(0, m.stats.heat - 12) } }
        : m
    )),
  };
}

export function runLocalAiTurn(state: GameState): GameState {
  if (state.status === 'finished' || state.activePlayerId !== LOCAL_AI_ID) return state;

  let nextState = state;
  const aiMechs = nextState.mechs.filter((m) => m.ownerId === LOCAL_AI_ID && !m.isDestroyed);

  for (const mech of aiMechs) {
    const currentMech = nextState.mechs.find((m) => m.id === mech.id);
    if (!currentMech || currentMech.isDestroyed) continue;

    const target = findNearestEnemy(nextState, currentMech);
    if (!target) break;

    if (hexDistance(currentMech.position, target.position) > currentMech.stats.range) {
      const moveTarget = chooseStepTowardTarget(nextState, currentMech, target);
      if (moveTarget) {
        nextState = moveLocalMech(nextState, currentMech.id, moveTarget.q, moveTarget.r);
      }
    }

    const movedMech = nextState.mechs.find((m) => m.id === mech.id);
    const currentTarget = movedMech ? findNearestEnemy(nextState, movedMech) : undefined;
    if (movedMech && currentTarget && hexDistance(movedMech.position, currentTarget.position) <= movedMech.stats.range) {
      nextState = attackLocalMech(nextState, movedMech.id, currentTarget.id);
    }
  }

  return endLocalTurn(nextState);
}

function findNearestEnemy(state: GameState, mech: MechInstance): MechInstance | undefined {
  return state.mechs
    .filter((m) => m.ownerId !== mech.ownerId && !m.isDestroyed)
    .sort((a, b) => hexDistance(mech.position, a.position) - hexDistance(mech.position, b.position))[0];
}

function chooseStepTowardTarget(
  state: GameState,
  mech: MechInstance,
  target: MechInstance
): { q: number; r: number } | undefined {
  const occupiedHexes = new Set(
    state.mechs
      .filter((m) => !m.isDestroyed && m.id !== mech.id)
      .map((m) => `${m.position.q},${m.position.r}`)
  );
  let currentPos = mech.position;
  let movesLeft = mech.stats.movement;
  let moved = false;

  while (movesLeft > 0) {
    const neighbors = [
      { q: currentPos.q + 1, r: currentPos.r },
      { q: currentPos.q + 1, r: currentPos.r - 1 },
      { q: currentPos.q, r: currentPos.r - 1 },
      { q: currentPos.q - 1, r: currentPos.r },
      { q: currentPos.q - 1, r: currentPos.r + 1 },
      { q: currentPos.q, r: currentPos.r + 1 },
    ];

    const bestHex = neighbors
      .filter((hex) => !occupiedHexes.has(`${hex.q},${hex.r}`))
      .sort((a, b) => hexDistance(a, target.position) - hexDistance(b, target.position))[0];

    if (!bestHex || hexDistance(bestHex, target.position) >= hexDistance(currentPos, target.position)) break;
    currentPos = bestHex;
    moved = true;
    movesLeft -= 1;
  }

  return moved ? currentPos : undefined;
}

function getWinnerId(mechs: MechInstance[]): string | undefined {
  const livingOwners = new Set(mechs.filter((m) => !m.isDestroyed).map((m) => m.ownerId));
  return livingOwners.size === 1 ? [...livingOwners][0] : undefined;
}
