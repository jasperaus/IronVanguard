import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
  LOCAL_AI_ID,
  LOCAL_PLAYER_ID,
  attackLocalMech,
  createLocalSkirmishGame,
  endLocalTurn,
  moveLocalMech,
  runLocalAiTurn,
} from './localSkirmish';

describe('local skirmish', () => {
  test('creates a playable player-vs-AI battle', () => {
    const state = createLocalSkirmishGame();

    assert.strictEqual(state.activePlayerId, LOCAL_PLAYER_ID);
    assert.strictEqual(state.status, 'playing');
    assert.strictEqual(state.mechs.filter((m) => m.ownerId === LOCAL_PLAYER_ID).length, 3);
    assert.strictEqual(state.mechs.filter((m) => m.ownerId === LOCAL_AI_ID).length, 3);
  });

  test('moves a mech only within its movement allowance', () => {
    const state = createLocalSkirmishGame();
    const light = state.mechs.find((m) => m.id === `${LOCAL_PLAYER_ID}_light`);
    assert.ok(light);

    const moved = moveLocalMech(state, light.id, -2, 0);
    assert.deepStrictEqual(moved.mechs.find((m) => m.id === light.id)?.position, { q: -2, r: 0 });
    assert.strictEqual(moved.mechs.find((m) => m.id === light.id)?.hasMoved, true);

    const illegal = moveLocalMech(state, light.id, 8, 0);
    assert.deepStrictEqual(illegal.mechs.find((m) => m.id === light.id)?.position, light.position);
  });

  test('attacks armor before structure in local mode', () => {
    let state = createLocalSkirmishGame();
    const attacker = state.mechs.find((m) => m.id === `${LOCAL_PLAYER_ID}_medium`);
    const defender = state.mechs.find((m) => m.id === `${LOCAL_AI_ID}_heavy`);
    assert.ok(attacker);
    assert.ok(defender);

    state = {
      ...state,
      mechs: state.mechs.map((m) => {
        if (m.id === attacker.id) return { ...m, position: { q: 0, r: 0 } };
        if (m.id === defender.id) return { ...m, position: { q: 0, r: 1 } };
        return m;
      }),
    };
    state = attackLocalMech(state, attacker.id, defender.id);

    const damagedDefender = state.mechs.find((m) => m.id === defender.id);
    assert.ok(damagedDefender);
    assert.ok(damagedDefender.stats.armor < defender.stats.armor);
    assert.strictEqual(damagedDefender.stats.hp, defender.stats.hp);
  });

  test('runs an AI turn and returns control to the player', () => {
    let state = createLocalSkirmishGame();
    state = endLocalTurn(state);

    const afterAi = runLocalAiTurn(state);

    assert.strictEqual(afterAi.activePlayerId, LOCAL_PLAYER_ID);
    assert.strictEqual(afterAi.turn, 3);
  });
});
