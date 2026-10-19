import { describe, it, expect } from 'vitest';
import { createWorld, step, resize } from '../../src/game/world.js';
import { RULES, speedFor, gapFor, airtime, chickenX, obstacleSize } from '../../src/game/rules.js';

const DT = 1 / 60;
const STAND = RULES.groundY - RULES.chickenHalfHeight;

function playing(width = 600, seed = 1) {
  const world = createWorld({ width, seed });
  step(world, DT, { jump: true });
  return world;
}

function landingStep(world) {
  for (let i = 1; i < 200; i++) {
    if (step(world, DT, { jump: false }).landed) return i;
  }
  return -1;
}

function obstacle(world, type, x) {
  const { w, h } = obstacleSize(type, 0, 0);
  return { type, x, w, h, passed: false };
}

describe('world', () => {
  it('ready ignores time and starts on a jump', () => {
    const world = createWorld({ width: 600, seed: 1 });
    for (let i = 0; i < 60; i++) step(world, DT, { jump: false });
    expect(world.phase).toBe('ready');
    expect(world.obstacles).toEqual([]);
    expect(world.distance).toBe(0);
    const e = step(world, DT, { jump: true });
    expect(e.started).toBe(true);
    expect(e.jumped).toBe(true);
    expect(world.phase).toBe('playing');
    expect(world.chicken.vy).toBeLessThan(0);
  });

  it('a jump peaks near 120 and lands after about 0.8 s', () => {
    const world = playing();
    world.nextSpawnAt = Infinity;
    let minY = world.chicken.y;
    let landed = -1;
    for (let i = 1; i < 120 && landed < 0; i++) {
      if (step(world, DT, { jump: false }).landed) landed = i;
      minY = Math.min(minY, world.chicken.y);
    }
    expect(Math.abs(STAND - minY - 120)).toBeLessThan(2);
    expect(landed).toBeGreaterThanOrEqual(46);
    expect(landed).toBeLessThanOrEqual(50);
    expect(world.chicken.y).toBe(STAND);
    expect(world.chicken.grounded).toBe(true);
  });

  it('no double jump, but a jump just before landing is buffered', () => {
    const probe = playing();
    probe.nextSpawnAt = Infinity;
    const land = landingStep(probe);

    const world = playing();
    world.nextSpawnAt = Infinity;
    for (let i = 1; i < land; i++) {
      const press = i === 10 || i === land - 3;
      const e = step(world, DT, { jump: press });
      expect(e.jumped).toBe(false);
    }
    const e = step(world, DT, { jump: false });
    expect(e.landed).toBe(true);
    expect(e.jumped).toBe(true);
    expect(world.chicken.vy).toBeLessThan(0);
  });

  it('a mid-air press does not fire on a landing much later', () => {
    const probe = playing();
    probe.nextSpawnAt = Infinity;
    const land = landingStep(probe);

    const world = playing();
    world.nextSpawnAt = Infinity;
    for (let i = 1; i < land; i++) step(world, DT, { jump: i === 10 });
    const e = step(world, DT, { jump: false });
    expect(e.landed).toBe(true);
    expect(e.jumped).toBe(false);
  });

  it('scores once per obstacle', () => {
    const world = playing();
    world.nextSpawnAt = Infinity;
    const { w } = obstacleSize('crate', 0, 0);
    world.obstacles = [obstacle(world, 'crate', world.chicken.x - RULES.chickenRadius - w / 2 - 0.01)];
    const e = step(world, DT, { jump: false });
    expect(e.scored).toBe(true);
    expect(world.score).toBe(1);
    for (let i = 0; i < 30; i++) expect(step(world, DT, { jump: false }).scored).toBe(false);
    expect(world.score).toBe(1);
  });

  for (const type of ['rock', 'crate', 'bush']) {
    it(`a ${type} crashes a grounded chicken`, () => {
      const world = playing();
      for (let i = 0; i < 60 && !world.chicken.grounded; i++) step(world, DT, { jump: false });
      world.nextSpawnAt = Infinity;
      world.obstacles = [obstacle(world, type, world.chicken.x)];
      const e = step(world, DT, { jump: false });
      expect(e.crashed).toBe(true);
      expect(world.phase).toBe('over');
      expect(step(world, DT, { jump: true })).toEqual({
        started: false, jumped: false, landed: false, scored: false, faster: false, crashed: false,
      });
    });
  }

  it('jumping over an obstacle at top speed is safe', () => {
    const world = createWorld({ width: 600, seed: 1 });
    world.score = 40;
    world.nextSpawnAt = Infinity;
    const lead = (speedFor(40) * airtime()) / 2;
    world.obstacles = [obstacle(world, 'crate', world.chicken.x + lead)];
    step(world, DT, { jump: true });
    let crashed = false;
    for (let i = 0; i < 90; i++) crashed ||= step(world, DT, { jump: false }).crashed;
    expect(crashed).toBe(false);
    expect(world.score).toBe(41);
  });

  it('spacing is world distance, not screen width', () => {
    const spawns = (width) => {
      const world = playing(width, 5);
      const seen = new Set();
      const out = [];
      for (let i = 0; i < 600; i++) {
        world.chicken.y = -10000;
        world.chicken.vy = 0;
        world.score = 0;
        step(world, DT, { jump: false });
        for (const o of world.obstacles) {
          if (seen.has(o)) continue;
          seen.add(o);
          out.push(o.x + world.distance - world.width);
        }
      }
      return out;
    };
    const narrow = spawns(300);
    const wide = spawns(1200);
    expect(narrow.length).toBeGreaterThan(4);
    expect(wide.length).toBe(narrow.length);
    wide.forEach((v, i) => expect(v).toBeCloseTo(narrow[i], 6));
  });

  it('speed follows score and calls out faster at 10', () => {
    const world = playing();
    world.nextSpawnAt = Infinity;
    world.score = 9;
    const { w } = obstacleSize('crate', 0, 0);
    world.obstacles = [obstacle(world, 'crate', world.chicken.x - RULES.chickenRadius - w / 2 - 0.01)];
    const e = step(world, DT, { jump: false });
    expect(world.score).toBe(10);
    expect(e.faster).toBe(true);
    expect(world.speed).toBe(speedFor(10));
  });

  it('resize keeps the run', () => {
    const world = playing();
    for (let i = 0; i < 100; i++) step(world, DT, { jump: world.chicken.grounded });
    const xs = world.obstacles.map((o) => o.x - world.chicken.x);
    resize(world, 900);
    expect(world.obstacles.map((o) => o.x - world.chicken.x)).toEqual(xs);
    expect(world.chicken.x).toBe(chickenX(900));
    expect(world.width).toBe(900);
    expect(world.phase).toBe('playing');
  });

  it('widening mid-run keeps each obstacle the same distance from the chicken', () => {
    const world = playing(300);
    world.nextSpawnAt = Infinity;
    const ahead = 200 - world.chicken.x;
    world.obstacles = [obstacle(world, 'crate', 200)];
    resize(world, 1200);
    expect(world.obstacles[0].x - world.chicken.x).toBeCloseTo(ahead, 6);
    const e = step(world, DT, { jump: false });
    expect(e.crashed).toBe(false);
    expect(e.scored).toBe(false);
  });

  it('narrowing mid-run never spawns an obstacle in front of ones already coming', () => {
    const world = playing(1200, 3);
    world.score = 40;
    for (let i = 0; i < 400 && world.obstacles.length < 3; i++) {
      world.chicken.y = -10000;
      world.chicken.vy = 0;
      step(world, DT, { jump: false });
    }
    resize(world, 300);
    for (let i = 0; i < 600; i++) {
      world.chicken.y = -10000;
      world.chicken.vy = 0;
      world.score = 40;
      step(world, DT, { jump: false });
      const lefts = world.obstacles.map((o) => o.x - o.w / 2);
      for (let j = 1; j < lefts.length; j++) {
        expect(lefts[j] - lefts[j - 1]).toBeGreaterThanOrEqual(gapFor(40, 0) - speedFor(40) * DT);
      }
    }
  });

  it('the same seed gives the same run', () => {
    const run = () => {
      const world = createWorld({ width: 600, seed: 7 });
      for (let i = 0; i < 300; i++) step(world, DT, { jump: i % 30 === 0 });
      return { obstacles: world.obstacles, score: world.score, phase: world.phase };
    };
    expect(run()).toEqual(run());
  });
});
