import { Scene } from 'dopaminejs';
import { step } from './world.js';
import { drawWorld, worldTransform } from './draw.js';
import { FIXED_STEP } from './step.js';

export const FIXED_DT = FIXED_STEP;
export const MAX_STEPS = 5;

const STILL = { offset: () => ({ x: 0, y: 0 }) };

export class RunScene extends Scene {
  constructor({ world, onEvents, view, shake = STILL }) {
    super();
    this.world = world;
    this.onEvents = onEvents;
    this.view = view;
    this.shake = shake;
    this._jump = false;
    this._paused = false;
    this._acc = 0;
    this._prevY = world.chicken.y;
    this._shakeAt = { x: 0, y: 0 };
    this._onFixed = (e) => this._fixed(e.dt);
  }

  get paused() {
    return this._paused;
  }

  get alpha() {
    return this._acc / FIXED_DT;
  }

  setWorld(world) {
    this.world = world;
    this._jump = false;
    this._acc = 0;
    this._prevY = world.chicken.y;
  }

  snap() {
    this._prevY = this.world.chicken.y;
  }

  jump() {
    this._jump = true;
  }

  pause() {
    this._paused = true;
  }

  resume() {
    this._paused = false;
    this._jump = false;
    this._acc = 0;
  }

  onEnter() {
    this.kernel.events.on('fixed_update', this._onFixed);
  }

  onExit() {
    this.kernel.events.off('fixed_update', this._onFixed);
  }

  update(dt) {
    if (this._paused) return;
    this._acc = Math.min(this._acc + dt, FIXED_DT * MAX_STEPS);
    this._shakeAt = this.shake.offset(dt);
    super.update(dt);
  }

  _fixed(dt) {
    if (this._paused) return;
    this._acc = Math.max(0, this._acc - dt);
    this._prevY = this.world.chicken.y;
    const events = step(this.world, dt, { jump: this._jump });
    this._jump = false;
    this.onEvents(events);
  }

  render(ctx) {
    drawWorld(ctx, this.world, this.alpha, performance.now() / 1000, this._prevY, this.view, this._shakeAt);
    worldTransform(ctx, this.view, this._shakeAt);
    super.render(ctx);
  }
}
