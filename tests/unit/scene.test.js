import { describe, it, expect, vi } from 'vitest';
import { EventBus, GameObject, Component } from 'dopaminejs';
import { RunScene, FIXED_DT } from '../../src/game/scene.js';
import { createWorld } from '../../src/game/world.js';

const VIEW = { scale: 1, offsetX: 0, offsetY: 0, dpr: 1 };

function fakeCtx() {
  const target = { canvas: { width: 600, height: 600 } };
  const ctx = new Proxy(target, {
    get(t, k) {
      if (k in t) return t[k];
      return () => ({ addColorStop() {} });
    },
    set(t, k, v) {
      t[k] = v;
      return true;
    },
  });
  return ctx;
}

function setup(seed = 1) {
  const world = createWorld({ width: 600, seed });
  const seen = [];
  const scene = new RunScene({ world, onEvents: (e) => seen.push(e), view: VIEW });
  const events = new EventBus();
  scene.kernel = { events };
  scene.onEnter();
  let acc = 0;
  const frame = (dt) => {
    scene.update(dt);
    acc = Math.min(acc + dt, FIXED_DT * 5);
    while (acc >= FIXED_DT) {
      events.emit('fixed_update', { dt: FIXED_DT });
      acc -= FIXED_DT;
    }
  };
  return { world, scene, frame, seen };
}

describe('RunScene', () => {
  it('same run at 60 Hz and 120 Hz', () => {
    const run = (hz) => {
      const { world, scene, frame } = setup(3);
      const perJump = hz / 2;
      for (let i = 0; i < 3 * hz; i++) {
        if (i % perJump === 0) scene.jump();
        frame(1 / hz);
      }
      return { score: world.score, y: world.chicken.y, xs: world.obstacles.map((o) => o.x), phase: world.phase };
    };
    const a = run(60);
    const b = run(120);
    expect(a.xs.length).toBeGreaterThan(0);
    expect(b).toEqual(a);
  });

  it('a long frame catches up 5 steps at most', () => {
    const { world, scene, frame } = setup();
    scene.jump();
    frame(FIXED_DT);
    const before = world.distance;
    frame(2);
    expect(world.distance - before).toBeLessThanOrEqual((5 * world.speed) / 60 + 1e-9);
  });

  it('paused means no steps, and a jump queued while paused is dropped', () => {
    const { world, scene, frame, seen } = setup();
    scene.pause();
    scene.jump();
    frame(FIXED_DT * 2);
    expect(seen.length).toBe(0);
    expect(scene.paused).toBe(true);
    scene.resume();
    frame(FIXED_DT);
    expect(world.phase).toBe('ready');
  });

  it('objects added to the scene update and render', () => {
    const { scene, frame } = setup();
    const counts = { update: 0, render: 0 };
    class Counter extends Component {
      update() {
        counts.update += 1;
      }
      render() {
        counts.render += 1;
      }
    }
    const obj = new GameObject(0, 0);
    obj.addComponent(new Counter());
    scene.add(obj);
    frame(FIXED_DT);
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => fakeCtx() }) });
    try {
      scene.render(fakeCtx());
    } finally {
      vi.unstubAllGlobals();
    }
    expect(counts).toEqual({ update: 1, render: 1 });
  });

  it('setWorld resets the interpolation start', () => {
    const { scene } = setup();
    const next = createWorld({ width: 600, seed: 2 });
    next.chicken.y = 123;
    scene.setWorld(next);
    expect(scene.world).toBe(next);
    expect(scene._prevY).toBe(123);
    expect(scene.alpha).toBe(0);
  });
});
