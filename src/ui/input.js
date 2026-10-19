const KEYS = new Set(['Space', 'Enter']);
const MODES = new Set(['menu', 'playing', 'over']);
const UI_SELECTOR = 'button, input, a, [data-ui]';

export function shouldAct(event, mode) {
  if (!MODES.has(mode)) return false;
  const pressed = event.type === 'pointerdown' || (event.type === 'keydown' && KEYS.has(event.code) && !event.repeat);
  if (!pressed) return false;
  return !event.target?.closest?.(UI_SELECTOR);
}
