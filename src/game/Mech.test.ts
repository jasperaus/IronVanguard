import { describe, it, expect } from 'vitest';
import { createMech, MECH_TEMPLATES } from './Mech';
import type { MechType } from './types';

describe('createMech', () => {
  it('should create a mech with the correct initial properties', () => {
    const id = 'mech-1';
    const type: MechType = 'light';
    const ownerId = 'player-1';
    const q = 1;
    const r = 2;

    const mech = createMech(id, type, ownerId, q, r);

    expect(mech.id).toBe(id);
    expect(mech.type).toBe(type);
    expect(mech.ownerId).toBe(ownerId);
    expect(mech.position.q).toBe(q);
    expect(mech.position.r).toBe(r);
    expect(mech.stats).toEqual(MECH_TEMPLATES.light);
    expect(mech.isDestroyed).toBe(false);
    expect(mech.hasMoved).toBe(false);
    expect(mech.hasAttacked).toBe(false);
    expect(mech.rotation).toBe(0);
  });

  it('should copy stats, not reference them', () => {
    const mech = createMech('id', 'light', 'owner', 0, 0);
    const initialHp = MECH_TEMPLATES.light.hp;

    mech.stats.hp = 0;

    expect(MECH_TEMPLATES.light.hp).toBe(initialHp);
  });

  it('should create different mech types correctly', () => {
    const types: MechType[] = ['light', 'medium', 'heavy'];

    types.forEach(type => {
      const mech = createMech('id', type, 'owner', 0, 0);
      expect(mech.type).toBe(type);
      expect(mech.stats).toEqual(MECH_TEMPLATES[type]);
    });
  });
});
