const DURATION = 0.3;

export function createShake({ reduced }) {
  let strength = 0;
  let left = 0;
  return {
    kick(amount) {
      if (reduced) return;
      strength = Math.max(amount, left > 0 ? strength : 0);
      left = DURATION;
    },
    offset(dt) {
      left = Math.max(0, left - dt);
      if (left < 1e-6) return { x: 0, y: 0 };
      const a = strength * (left / DURATION);
      return { x: (Math.random() * 2 - 1) * a, y: (Math.random() * 2 - 1) * a };
    },
  };
}
