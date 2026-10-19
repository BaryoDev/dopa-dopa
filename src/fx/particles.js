const NOOP = { dust() {}, burst() {}, landing() {}, feathers() {}, confetti() {} };

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
const CONFETTI = ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#da77f2'];

/* The particle overlay draws in CSS pixels, so world points go through the view first. */
export function createParticles(kernel, view, { reduced }) {
  const system = kernel.systems.get('particles');
  if (!system) return NOOP;
  const n = (count) => (reduced ? Math.ceil(count / 2) : count);
  const emit = (x, y, opts) =>
    system.emit({
      x: view.offsetX + x * view.scale,
      y: view.offsetY + y * view.scale,
      ...opts,
      size: opts.size * view.scale,
      spread: opts.spread * view.scale,
      velocity: { x: opts.velocity.x * view.scale, y: opts.velocity.y * view.scale },
    });
  return {
    dust(x, y) {
      emit(x, y, { count: n(2), color: [0.72, 0.5, 0.3, 0.6], size: 5, lifetime: 0.45, velocity: { x: -120, y: -30 }, spread: 25 });
    },
    landing(x, y) {
      emit(x, y, { count: n(12), color: [0.75, 0.56, 0.36, 0.7], size: 6, lifetime: 0.5, velocity: { x: -60, y: -70 }, spread: 80 });
    },
    feathers(x, y) {
      emit(x, y, { count: n(5), color: [1, 0.96, 0.8, 0.9], size: 6, lifetime: 0.6, velocity: { x: -90, y: 40 }, spread: 50 });
    },
    confetti(x, y) {
      for (const c of CONFETTI) {
        emit(x, y, { count: n(10), color: [...hex(c), 1], size: 7, lifetime: 1, velocity: { x: 0, y: -120 }, spread: 260 });
      }
    },
    burst(x, y, color) {
      emit(x, y, { count: n(24), color: [...hex(color), 1], size: 7, lifetime: 0.9, velocity: { x: 0, y: -90 }, spread: 220 });
      emit(x, y, { count: n(14), color: [1, 0.97, 0.85, 1], size: 8, lifetime: 1.1, velocity: { x: -40, y: -60 }, spread: 160 });
    },
  };
}
