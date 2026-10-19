import { describe, it, expect } from 'vitest';
import { createShake } from '../../src/fx/shake.js';

describe('shake', () => {
  it('settles to zero within 0.3 s of a kick', () => {
    const shake = createShake({ reduced: false });
    shake.kick(10);
    let moved = false;
    for (let i = 0; i < 18; i++) {
      const o = shake.offset(1 / 60);
      if (o.x !== 0 || o.y !== 0) moved = true;
      expect(Math.abs(o.x)).toBeLessThanOrEqual(10);
    }
    expect(moved).toBe(true);
    expect(shake.offset(1 / 60)).toEqual({ x: 0, y: 0 });
  });

  it('reduced motion never shakes', () => {
    const shake = createShake({ reduced: true });
    shake.kick(10);
    for (let i = 0; i < 10; i++) expect(shake.offset(1 / 60)).toEqual({ x: 0, y: 0 });
  });
});
