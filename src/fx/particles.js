const NOOP = { dust() {}, burst() {}, landing() {} };

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);

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
      emit(x, y, { count: n(2), color: [0.55, 0.36, 0.2, 0.6], size: 4, lifetime: 0.4, velocity: { x: -120, y: -30 }, spread: 25 });
    },
    landing(x, y) {
      emit(x, y, { count: n(10), color: [0.6, 0.42, 0.25, 0.7], size: 5, lifetime: 0.5, velocity: { x: -60, y: -60 }, spread: 70 });
    },
    burst(x, y, color) {
      emit(x, y, { count: n(30), color: [...hex(color), 1], size: 6, lifetime: 0.8, velocity: { x: 0, y: -80 }, spread: 220 });
    },
  };
}
