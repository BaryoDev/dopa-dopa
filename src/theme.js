import { PHASES } from './game/palette.js';

const FONT = 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, -apple-system, "Segoe UI", sans-serif';

const shared = {
  '--dopamine-primary': '#e8590c',
  '--dopamine-success': '#2f9e44',
  '--dopamine-warning': '#ffc233',
  '--dopamine-error': '#e03131',
  '--dopamine-font': FONT,
  '--dopamine-border-radius': '20px',
  '--dopamine-animation-speed': '0.25s',
};

const LOOKS = {
  morning: {
    '--dopamine-secondary': '#c2410c',
    '--dopamine-bg': '#fff6e4',
    '--dopamine-bg-light': '#f6e2bf',
    '--dopamine-text': '#4a2f22',
    '--dopamine-text-dim': '#8a6450',
    '--dopamine-border': '#4a2f22',
    '--dopamine-shadow': 'rgba(74, 47, 34, 0.9)',
  },
  day: {
    '--dopamine-secondary': '#1c7ed6',
    '--dopamine-bg': '#f1fbff',
    '--dopamine-bg-light': '#cfeaf8',
    '--dopamine-text': '#1f3550',
    '--dopamine-text-dim': '#5b7590',
    '--dopamine-border': '#1f3550',
    '--dopamine-shadow': 'rgba(31, 53, 80, 0.9)',
  },
  sunset: {
    '--dopamine-secondary': '#c2255c',
    '--dopamine-bg': '#fff0ea',
    '--dopamine-bg-light': '#f9d3cc',
    '--dopamine-text': '#3e2033',
    '--dopamine-text-dim': '#86586e',
    '--dopamine-border': '#3e2033',
    '--dopamine-shadow': 'rgba(62, 32, 51, 0.9)',
  },
  night: {
    '--dopamine-secondary': '#ffc233',
    '--dopamine-bg': '#1b2257',
    '--dopamine-bg-light': '#2c3575',
    '--dopamine-text': '#f1f3ff',
    '--dopamine-text-dim': '#a9b2e8',
    '--dopamine-border': '#0a0d26',
    '--dopamine-shadow': 'rgba(4, 6, 20, 0.95)',
  },
};

export const themeFor = (phase) => `dopadopa-${LOOKS[phase] ? phase : 'morning'}`;

let current = null;

export function applyTheme(themeEngine) {
  for (const { name } of PHASES) themeEngine.registerTheme(themeFor(name), { ...shared, ...LOOKS[name] });
  current = themeFor('morning');
  themeEngine.setTheme(current);
}

export function setPhaseTheme(themeEngine, phase) {
  const name = themeFor(phase);
  if (name === current) return;
  current = name;
  themeEngine.setTheme(name);
}
