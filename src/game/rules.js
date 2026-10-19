export const RULES = {
  height: 600,
  groundY: 500,
  gravity: 1500,
  jumpVelocity: -600,
  chickenRadius: 15,
  chickenHalfHeight: 20,
  jumpBuffer: 0.1,
  startSpeed: 300,
  maxSpeed: 520,
  speedPerPoint: 8,
  startInterval: 1.5,
  minInterval: 1.0,
  intervalPerPoint: 1 / 60,
  gapJitter: 0.3,
  firstGap: 450,
  minAspect: 0.5,
  maxAspect: 2.0,
};

export const OBSTACLES = {
  rock: { w: [30, 50], h: [25, 40] },
  crate: { w: [45, 45], h: [45, 45] },
  bush: { w: [50, 50], h: [35, 35] },
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function speedFor(score) {
  return Math.min(RULES.maxSpeed, RULES.startSpeed + RULES.speedPerPoint * score);
}

export function intervalFor(score) {
  return Math.max(RULES.minInterval, RULES.startInterval - RULES.intervalPerPoint * score);
}

export function gapFor(score, r = 0) {
  return speedFor(score) * intervalFor(score) * (1 + RULES.gapJitter * r);
}

export function airtime() {
  return (2 * -RULES.jumpVelocity) / RULES.gravity;
}

export function jumpHeight() {
  return (RULES.jumpVelocity * RULES.jumpVelocity) / (2 * RULES.gravity);
}

export function isFasterAt(score) {
  return score > 0 && score % 10 === 0 && speedFor(score) > speedFor(score - 10);
}

export function viewWidth(aspect) {
  return RULES.height * clamp(Number.isNaN(aspect) ? 1 : aspect, RULES.minAspect, RULES.maxAspect);
}

export function chickenX(width) {
  return clamp(width * 0.2, 60, 200);
}

export function obstacleSize(type, r1, r2) {
  const { w, h } = OBSTACLES[type];
  return { w: w[0] + (w[1] - w[0]) * r1, h: h[0] + (h[1] - h[0]) * r2 };
}
