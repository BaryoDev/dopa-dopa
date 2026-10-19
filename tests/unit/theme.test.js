import { describe, it, expect } from 'vitest';
import { applyTheme, setPhaseTheme, themeFor } from '../../src/theme.js';
import { PHASES } from '../../src/game/palette.js';

function fakeEngine() {
  const themes = new Map();
  const set = [];
  return {
    themes,
    set,
    registerTheme: (name, vars) => themes.set(name, vars),
    setTheme: (name) => set.push(name),
  };
}

describe('theme', () => {
  it('registers a theme for every phase and starts on morning', () => {
    const engine = fakeEngine();
    applyTheme(engine);
    for (const p of PHASES) expect(engine.themes.has(themeFor(p.name))).toBe(true);
    expect(engine.set).toEqual([themeFor('morning')]);
  });

  it('gives every phase theme the same tokens and a local font', () => {
    const engine = fakeEngine();
    applyTheme(engine);
    const keys = Object.keys(engine.themes.get(themeFor('morning'))).sort();
    for (const p of PHASES) {
      const vars = engine.themes.get(themeFor(p.name));
      expect(Object.keys(vars).sort()).toEqual(keys);
      expect(vars['--dopamine-font']).not.toMatch(/Press Start|Inter|Poppins|Orbitron/);
    }
  });

  it('switches theme only when the phase changes', () => {
    const engine = fakeEngine();
    applyTheme(engine);
    setPhaseTheme(engine, 'morning');
    setPhaseTheme(engine, 'day');
    setPhaseTheme(engine, 'day');
    setPhaseTheme(engine, 'night');
    expect(engine.set).toEqual([themeFor('morning'), themeFor('day'), themeFor('night')]);
  });

  it('falls back to morning for an unknown phase', () => {
    expect(themeFor('noon')).toBe(themeFor('morning'));
  });
});
