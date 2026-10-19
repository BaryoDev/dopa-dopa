import { describe, it, expect } from 'vitest';
import {
  RULES, OBSTACLES, speedFor, intervalFor, gapFor, airtime, jumpHeight,
  isFasterAt, viewWidth, chickenX, obstacleSize,
} from '../../src/game/rules.js';

describe('rules', () => {
  it('starts at the old feel', () => {
    expect(speedFor(0)).toBe(300);
    expect(airtime()).toBeCloseTo(0.8, 6);
    expect(jumpHeight()).toBeCloseTo(120, 6);
  });

  it('speed rises with score to a cap and never falls', () => {
    for (let s = 1; s <= 300; s++) expect(speedFor(s)).toBeGreaterThanOrEqual(speedFor(s - 1));
    expect(speedFor(1000)).toBe(520);
    expect(speedFor(10)).toBeGreaterThan(speedFor(0));
  });

  it('the spawn interval shrinks to a floor', () => {
    expect(intervalFor(0)).toBe(1.5);
    expect(intervalFor(1000)).toBe(1.0);
  });

  it('every gap is clearable at every score', () => {
    const widest = Math.max(...Object.values(OBSTACLES).map((o) => o.w[1]));
    for (let s = 0; s <= 300; s++) {
      expect(gapFor(s, 0)).toBeGreaterThan(speedFor(s) * airtime() + widest + 2 * RULES.chickenRadius);
    }
  });

  it('jitter only widens the gap', () => {
    expect(gapFor(5, 0.99)).toBeGreaterThan(gapFor(5, 0));
  });

  it('a jump clears the tallest obstacle', () => {
    const tallest = Math.max(...Object.values(OBSTACLES).map((o) => o.h[1]));
    expect(jumpHeight()).toBeGreaterThan(tallest + RULES.chickenRadius);
  });

  it('calls out faster only while speed is still rising', () => {
    expect([5, 10, 20, 30, 40].map(isFasterAt)).toEqual([false, true, true, true, false]);
  });

  it('clamps the aspect', () => {
    expect(viewWidth(0.3)).toBe(300);
    expect(viewWidth(1)).toBe(600);
    expect(viewWidth(3)).toBe(1200);
  });

  it('treats a 0 by 0 screen as square', () => {
    expect(viewWidth(0 / 0)).toBe(600);
    expect(viewWidth(Infinity)).toBe(1200);
  });

  it('keeps the chicken on screen', () => {
    expect(chickenX(300)).toBe(60);
    expect(chickenX(600)).toBe(120);
    expect(chickenX(1200)).toBe(200);
  });

  it('sizes obstacles inside their ranges', () => {
    expect(obstacleSize('rock', 0, 0)).toEqual({ w: 30, h: 25 });
    expect(obstacleSize('rock', 1, 1)).toEqual({ w: 50, h: 40 });
    expect(obstacleSize('crate', 0.5, 0.5)).toEqual({ w: 45, h: 45 });
  });
});
