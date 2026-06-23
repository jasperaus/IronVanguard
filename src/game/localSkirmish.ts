import { createMech } from './Mech';
import { applyDamage, calculateDamage } from './Combat';
import { hexDistance } from './hexUtils';
import { getReachableTerrainHexes, getTerrainProfile, toHexKey } from './terrain';
import { GameState, MechInstance, MechType } from './types';

export const LOCAL_PLAYER_ID = 'local_player';
export const LOCAL_AI_ID = 'ai_1';
export const HEAT_STRESS_THRESHOLD = 70;

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
  const effectiveMovement = getEffectiveMovement(mech);
  if (effectiveMovement <= 0) return state;

  const blockedHexes = new Set(
    state.mechs
      .filter((m) => !m.isDestroyed && m.id !== mechId)
      .map((m) => toHexKey(m.position))
  );
  const reachableHexes = getReachableTerrainHexes(mech.position, effectiveMovement, blockedHexes);
  if (!reachableHexes.has(toHexKey({ q, r }))) return state;

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
  if (isHeatLocked(attacker)) return state;
  if (hexDistance(attacker.position, defender.position) > attacker.stats.range) return state;

  const defenderTerrain = getTerrainProfile(defender.position.q, defender.position.r);
  const damage = Math.max(0, calculateDamage(attacker, defender) - defenderTerrain.defenseBonus * 4);
  const damagedDefender = applyDamage(defender, damage);
  const mechs = state.mechs.map((m) => {
    if (m.id === defenderId) return damagedDefender;
    if (m.id === attackerId) {
      return {
        ...m,
        hasAttacked: true,
        stats: { ...m.stats, heat: Math.min(m.stats.maxHeat, m.stats.heat + getAttackHeat(m)) },
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

export function isHeatLocked(mech: MechInstance): boolean {
  return mech.stats.heat >= mech.stats.maxHeat;
}

export function getEffectiveMovement(mech: MechInstance): number {
  if (isHeatLocked(mech)) return 0;
  if (mech.stats.heat >= HEAT_STRESS_THRESHOLD) {
    return Math.max(1, Math.floor(mech.stats.movement / 2));
  }
  return mech.stats.movement;
}

export function getAttackHeat(mech: MechInstance): number {
  if (mech.type === 'heavy') return 26;
  if (mech.type === 'medium') return 20;
  return 14;
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
      .map((m) => toHexKey(m.position))
  );
  const reachableHexes = [...getReachableTerrainHexes(mech.position, getEffectiveMovement(mech), occupiedHexes).keys()]
    .map((key) => {
      const [q, r] = key.split(',').map(Number);
      return { q, r };
    })
    .filter((hex) => hex.q !== mech.position.q || hex.r !== mech.position.r);

  return reachableHexes.sort((a, b) => (
    hexDistance(a, target.position) - hexDistance(b, target.position)
  ))[0];
}

function getWinnerId(mechs: MechInstance[]): string | undefined {
  const livingOwners = new Set(mechs.filter((m) => !m.isDestroyed).map((m) => m.ownerId));
  return livingOwners.size === 1 ? [...livingOwners][0] : undefined;
}
