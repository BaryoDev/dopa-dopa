import { describe, it, expect } from 'vitest';
import { shouldAct } from '../../src/ui/input.js';

const target = (matches) => ({ closest: (sel) => (sel.split(',').some((s) => matches.includes(s.trim())) ? {} : null) });
const canvas = target([]);
const button = target(['button']);
const card = target(['[data-ui]']);
const nameField = target(['input', '[data-ui]']);

const key = (code, extra = {}) => ({ type: 'keydown', code, repeat: false, target: canvas, ...extra });

describe('shouldAct', () => {
  it('a pointerdown on the canvas acts', () => {
    expect(shouldAct({ type: 'pointerdown', target: canvas }, 'playing')).toBe(true);
    expect(shouldAct({ type: 'pointerdown', target: canvas }, 'menu')).toBe(true);
  });

  it('Space and Enter act', () => {
    expect(shouldAct(key('Space'), 'playing')).toBe(true);
    expect(shouldAct(key('Enter'), 'menu')).toBe(true);
    expect(shouldAct(key('Enter'), 'over')).toBe(true);
  });

  it('a held Space does not act', () => {
    expect(shouldAct(key('Space', { repeat: true }), 'playing')).toBe(false);
    expect(shouldAct(key('Space', { repeat: true }), 'over')).toBe(false);
  });

  it('other keys and key-ups do nothing', () => {
    expect(shouldAct(key('ArrowUp'), 'playing')).toBe(false);
    expect(shouldAct(key('KeyA'), 'playing')).toBe(false);
    expect(shouldAct({ type: 'keyup', code: 'Space', repeat: false, target: canvas }, 'playing')).toBe(false);
  });

  it('a pointerdown on a button or inside a card does not act', () => {
    expect(shouldAct({ type: 'pointerdown', target: button }, 'menu')).toBe(false);
    expect(shouldAct({ type: 'pointerdown', target: card }, 'over')).toBe(false);
  });

  it('Enter in the name field is left to the form', () => {
    expect(shouldAct(key('Enter', { target: nameField }), 'menu')).toBe(false);
  });

  it('a key on a target without closest, like the document, acts', () => {
    expect(shouldAct(key('Space', { target: {} }), 'playing')).toBe(true);
  });
});
