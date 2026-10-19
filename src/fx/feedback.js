const NOOP = { faster() {}, milestone() {}, oops() {} };
const FONT = 'ui-monospace, Menlo, Consolas, monospace';

export function createFeedback(kernel, { reduced }) {
  const system = kernel.systems.get('feedback');
  if (!system) return NOOP;
  const show = (type, x, y, text, color) => system.trigger(type, x, y, { text, color, fontFamily: FONT, fontSize: 22 });
  return {
    faster: (x, y) => show('faster', x, y, 'Faster', '#50fa7b'),
    // The plugin reads count with ||, so count 0 still fires confetti. A custom type has none.
    milestone: (x, y) => show(reduced ? 'custom' : 'milestone', x, y, 'Ten more', '#FFD700'),
    oops: (x, y) => show('oops', x, y, 'Caught', '#FF4444'),
  };
}
