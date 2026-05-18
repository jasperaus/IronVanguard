import test from 'node:test';
import assert from 'node:assert';
import { runAITurn } from './AI';
import { GameState, MechInstance, MechType } from './types';

// Helper function to create a basic Mech
function createMech(
  id: string,
  ownerId: string,
  q: number,
  r: number,
  overrides: Partial<MechInstance> = {}
): MechInstance {
  return {
    id,
    type: 'medium' as MechType,
    ownerId,
    position: { q, r },
    rotation: 0,
    isDestroyed: false,
    hasMoved: false,
    hasAttacked: false,
    stats: {
      hp: 10,
      maxHp: 10,
      armor: 5,
      maxArmor: 5,
      movement: 3,
      range: 2,
      damage: 4,
      heat: 0,
      maxHeat: 10,
    },
    ...overrides,
  };
}

function createGameState(mechs: MechInstance[]): GameState {
  return {
    id: 'test-game',
    players: ['player_1', 'ai_1'],
    mechs,
    turn: 1,
    activePlayerId: 'ai_1',
    status: 'playing',
  };
}

test('runAITurn - moves towards player when out of range', () => {
  const aiMech = createMech('ai_mech_1', 'ai_1', 0, 0);
  const playerMech = createMech('player_mech_1', 'player_1', 0, 3);
  const state = createGameState([aiMech, playerMech]);

  const newState = runAITurn(state);
  const updatedAi = newState.mechs.find(m => m.id === 'ai_mech_1');

  assert.ok(updatedAi);
  assert.strictEqual(updatedAi.hasMoved, true);
  assert.notDeepStrictEqual(updatedAi.position, { q: 0, r: 0 });

  // Player shouldn't have taken damage
  const updatedPlayer = newState.mechs.find(m => m.id === 'player_mech_1');
  assert.ok(updatedPlayer);
  assert.strictEqual(updatedPlayer.stats.armor, 5);
});

test('runAITurn - attacks player when in range', () => {
  const aiMech = createMech('ai_mech_1', 'ai_1', 0, 0);
  const playerMech = createMech('player_mech_1', 'player_1', 0, 2);
  const state = createGameState([aiMech, playerMech]);

  const newState = runAITurn(state);
  const updatedAi = newState.mechs.find(m => m.id === 'ai_mech_1');
  const updatedPlayer = newState.mechs.find(m => m.id === 'player_mech_1');

  assert.ok(updatedAi);
  // AI won't move if in range
  assert.strictEqual(updatedAi.hasMoved, false);

  assert.ok(updatedPlayer);
  // Initial armor is 5, damage is 4, so armor should be 1
  assert.strictEqual(updatedPlayer.stats.armor, 1);
  assert.strictEqual(updatedPlayer.stats.hp, 10);
});

test('runAITurn - ignores destroyed mechs', () => {
  const aiMech = createMech('ai_mech_1', 'ai_1', 0, 0);
  const destroyedPlayer = createMech('player_mech_destroyed', 'player_1', 0, 1, { isDestroyed: true });
  const alivePlayer = createMech('player_mech_alive', 'player_1', 0, 3);

  const state = createGameState([aiMech, destroyedPlayer, alivePlayer]);

  const newState = runAITurn(state);
  const updatedAi = newState.mechs.find(m => m.id === 'ai_mech_1');

  assert.ok(updatedAi);
  assert.strictEqual(updatedAi.hasMoved, true);
  // Should move towards (0, 3), not (0, 1)
  assert.deepStrictEqual(updatedAi.position, { q: 0, r: 1 });
});

test('runAITurn - multiple AI mechs process correctly', () => {
  const aiMech1 = createMech('ai_mech_1', 'ai_1', 0, 0);
  const aiMech2 = createMech('ai_mech_2', 'ai_1', 0, 5); // Out of range initially
  const playerMech = createMech('player_mech_1', 'player_1', 0, 2);

  const state = createGameState([aiMech1, aiMech2, playerMech]);

  const newState = runAITurn(state);
  const updatedAi1 = newState.mechs.find(m => m.id === 'ai_mech_1');
  const updatedAi2 = newState.mechs.find(m => m.id === 'ai_mech_2');
  const updatedPlayer = newState.mechs.find(m => m.id === 'player_mech_1');

  assert.ok(updatedAi1);
  assert.ok(updatedAi2);
  assert.ok(updatedPlayer);

  // aiMech1 is in range, so it attacks and does not move
  assert.strictEqual(updatedAi1.hasMoved, false);

  // aiMech2 is out of range, so it moves
  assert.strictEqual(updatedAi2.hasMoved, true);

  // Player should have taken damage from aiMech1
  assert.strictEqual(updatedPlayer.stats.armor, 1);
});

test('runAITurn - does nothing if no player mechs', () => {
  const aiMech = createMech('ai_mech_1', 'ai_1', 0, 0);
  const state = createGameState([aiMech]);

  const newState = runAITurn(state);
  const updatedAi = newState.mechs.find(m => m.id === 'ai_mech_1');

  assert.ok(updatedAi);
  assert.strictEqual(updatedAi.hasMoved, false);
  assert.deepStrictEqual(updatedAi.position, { q: 0, r: 0 });
});
