import { RULES, speedFor, gapFor, isFasterAt, chickenX, obstacleSize } from './rules.js';
import { seeded } from './random.js';

const TYPES = ['rock', 'crate', 'bush'];
const STAND = RULES.groundY - RULES.chickenHalfHeight;

const noEvents = () => ({
  started: false, jumped: false, landed: false, scored: false, faster: false, crashed: false, close: false,
});

export function createWorld({ width, seed }) {
  return {
    phase: 'ready',
    width,
    score: 0,
    speed: speedFor(0),
    distance: 0,
    nextSpawnAt: RULES.firstGap,
    chicken: { x: chickenX(width), y: STAND, vy: 0, grounded: true, run: 0 },
    obstacles: [],
    buffer: 0,
    rand: seeded(seed),
  };
}

export function resize(world, width) {
  const dx = chickenX(width) - world.chicken.x;
  world.width = width;
  world.chicken.x += dx;
  for (const o of world.obstacles) o.x += dx;
}

function jump(world) {
  world.chicken.vy = RULES.jumpVelocity;
  world.chicken.grounded = false;
  world.buffer = 0;
}

/* After a resize to a narrower screen the obstacles already in flight sit past the new edge,
   so a new one goes behind the last by its gap rather than at the edge. */
function spawn(world) {
  const type = TYPES[Math.floor(world.rand() * TYPES.length)];
  const { w, h } = obstacleSize(type, world.rand(), world.rand());
  const gap = gapFor(world.score, world.rand());
  const last = world.obstacles.at(-1);
  const edge = world.width + 10 - (world.distance - world.nextSpawnAt);
  const left = last ? Math.max(edge, last.x - last.w / 2 + (last.gap ?? 0)) : edge;
  world.obstacles.push({ type, x: left + w / 2, w, h, gap, passed: false });
  world.nextSpawnAt += gap;
}

function hits(chicken, o) {
  const r = RULES.chickenRadius;
  return (
    chicken.x + r > o.x - o.w / 2 &&
    chicken.x - r < o.x + o.w / 2 &&
    chicken.y + r > RULES.groundY - o.h &&
    chicken.y - r < RULES.groundY
  );
}

export function step(world, dt, input) {
  const e = noEvents();
  if (world.phase === 'over') return e;

  const { chicken } = world;
  if (world.phase === 'ready') {
    if (!input.jump) return e;
    world.phase = 'playing';
    e.started = true;
  }

  world.buffer = Math.max(0, world.buffer - dt);
  if (input.jump) {
    if (chicken.grounded) {
      jump(world);
      e.jumped = true;
    } else {
      world.buffer = RULES.jumpBuffer;
    }
  }

  if (!chicken.grounded) {
    chicken.y += chicken.vy * dt + 0.5 * RULES.gravity * dt * dt;
    chicken.vy += RULES.gravity * dt;
    if (chicken.y >= STAND) {
      chicken.y = STAND;
      chicken.vy = 0;
      chicken.grounded = true;
      e.landed = true;
      if (world.buffer > 0) {
        jump(world);
        e.jumped = true;
      }
    }
  }

  world.speed = speedFor(world.score);
  const move = world.speed * dt;
  world.distance += move;
  chicken.run += move;
  for (const o of world.obstacles) o.x -= move;
  world.obstacles = world.obstacles.filter((o) => o.x + o.w / 2 >= -50);
  while (world.distance >= world.nextSpawnAt) spawn(world);

  const r = RULES.chickenRadius;
  for (const o of world.obstacles) {
    if (o.passed) continue;
    if (chicken.x + r > o.x - o.w / 2 && chicken.x - r < o.x + o.w / 2) {
      o.clear = Math.min(o.clear ?? Infinity, RULES.groundY - o.h - (chicken.y + r));
    }
    if (o.x + o.w / 2 >= chicken.x - r) continue;
    o.passed = true;
    world.score += 1;
    e.scored = true;
    if ((o.clear ?? Infinity) < RULES.closeMargin) e.close = true;
    if (isFasterAt(world.score)) e.faster = true;
  }
  world.speed = speedFor(world.score);

  if (world.obstacles.some((o) => hits(chicken, o))) {
    world.phase = 'over';
    e.crashed = true;
  }
  return e;
}
