export const PHASES = [
  {
    name: 'morning',
    floor: 0,
    colors: {
      top: '#8fd3f4', mid: '#ffe8c7', bottom: '#ffd29e',
      far: '#b9d6e8', hillMid: '#9fd28a', near: '#74bf5c', tree: '#4f9a45',
      barn: '#d9534a', roof: '#8c3a35', fence: '#f2e3c4',
      grass: '#7cc35a', grassLight: '#a8e07f', road: '#e3b77a', roadMark: '#c9965a',
      crate: '#e2a25a', crateDark: '#b8763a', rock: '#b9b2c4', rockDark: '#8d859c',
      bush: '#5fb34e', bushDark: '#3f8a38', ink: '#4a2f22', shadow: '#5a3b20',
      cloud: '#ffffff', orb: '#fff1b0', glow: '#ffd98a',
      cloudA: 0.9, star: 0, moon: 0, orbX: 0.78, orbY: 0.62,
    },
  },
  {
    name: 'day',
    floor: 10,
    colors: {
      top: '#3fa9f5', mid: '#7cc6f7', bottom: '#c3e9fb',
      far: '#8ab9de', hillMid: '#7cc66a', near: '#55ad49', tree: '#3a8a3a',
      barn: '#e0473d', roof: '#962f2a', fence: '#fff3d8',
      grass: '#62b845', grassLight: '#93dc68', road: '#ddb071', roadMark: '#c08b4e',
      crate: '#e8a452', crateDark: '#b97433', rock: '#b4b0bf', rockDark: '#878196',
      bush: '#4cab42', bushDark: '#2f7f30', ink: '#3d2a1f', shadow: '#4f3520',
      cloud: '#ffffff', orb: '#fff6b8', glow: '#ffef94',
      cloudA: 0.95, star: 0, moon: 0, orbX: 0.8, orbY: 0.16,
    },
  },
  {
    name: 'sunset',
    floor: 25,
    colors: {
      top: '#ff8a4c', mid: '#ff8fa3', bottom: '#9b6fd0',
      far: '#b57bb3', hillMid: '#8f5f9e', near: '#6c4a86', tree: '#4c3268',
      barn: '#c4404a', roof: '#7a2a40', fence: '#f6cdb8',
      grass: '#8a9a4a', grassLight: '#b5c46a', road: '#d0946a', roadMark: '#ad7250',
      crate: '#d98a52', crateDark: '#a85f38', rock: '#a99ab8', rockDark: '#7c6c92',
      bush: '#6f9a44', bushDark: '#4c7234', ink: '#3e2033', shadow: '#4a2433',
      cloud: '#ffc6cf', orb: '#ffd59a', glow: '#ff9d5c',
      cloudA: 0.85, star: 0, moon: 0, orbX: 0.72, orbY: 0.68,
    },
  },
  {
    name: 'night',
    floor: 50,
    colors: {
      top: '#0e1640', mid: '#1f2766', bottom: '#3b3283',
      far: '#29336f', hillMid: '#1f2a5c', near: '#18214a', tree: '#11183b',
      barn: '#6e3046', roof: '#3d1d33', fence: '#7b7fa8',
      grass: '#2f6450', grassLight: '#43826a', road: '#5a5378', roadMark: '#474066',
      crate: '#8a6a6e', crateDark: '#64494f', rock: '#7d7fa6', rockDark: '#5b5c82',
      bush: '#2f6a52', bushDark: '#1f4c3c', ink: '#0a0d26', shadow: '#070a1e',
      cloud: '#8a93c8', orb: '#f4f1dc', glow: '#b8c4ff',
      cloudA: 0.25, star: 1, moon: 1, orbX: 0.78, orbY: 0.22,
    },
  },
];

const BY_NAME = new Map(PHASES.map((p) => [p.name, p]));

export function phaseFor(score) {
  if (!Number.isFinite(score) || score < 0) return PHASES[0].name;
  let name = PHASES[0].name;
  for (const p of PHASES) if (score >= p.floor) name = p.name;
  return name;
}

export function colorsOf(phase) {
  return (BY_NAME.get(phase) ?? PHASES[0]).colors;
}

const channel = (hex, i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);

function mix(a, b, t) {
  let out = '#';
  for (let i = 0; i < 3; i += 1) {
    const v = Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t);
    out += v.toString(16).padStart(2, '0');
  }
  return out;
}

export function skyAt(fromPhase, toPhase, t, out = {}) {
  const a = colorsOf(fromPhase);
  const b = colorsOf(toPhase);
  const k = Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 1;
  for (const key of Object.keys(a)) {
    const from = a[key];
    const to = b[key];
    out[key] = typeof from === 'number' ? from * (1 - k) + to * k : mix(from, to, k);
  }
  return out;
}
