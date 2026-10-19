const NOOP = { faster() {}, milestone() {}, levelUp() {}, oops() {}, close() {} };
const FONT = 'ui-rounded, "SF Pro Rounded", system-ui, -apple-system, "Segoe UI", sans-serif';

export function createFeedback(kernel, { reduced }) {
  const system = kernel.systems.get('feedback');
  if (!system) return NOOP;
  const show = (type, x, y, text, color, fontSize = 26) =>
    system.trigger(type, x, y, { text, color, fontFamily: FONT, fontSize });
  return {
    faster: (x, y) => show('faster', x, y, 'Faster', '#69db7c'),
    // The plugin reads count with ||, so count 0 still fires confetti. A custom type has none.
    milestone: (x, y, score) => show(reduced ? 'custom' : 'milestone', x, y, `${score} cleared`, '#ffd43b', 30),
    levelUp: (x, y, level) => show(reduced ? 'custom' : 'levelup', x, y, `Level ${level}`, '#da77f2', 30),
    oops: (x, y) => show('oops', x, y, 'Caught', '#ff6b6b', 30),
    close: (x, y) => show('custom', x, y, 'Close one', '#ffa94d', 22),
  };
}
