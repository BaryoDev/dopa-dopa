import { RULES } from './rules.js';

const TAU = Math.PI * 2;
export const STRIP = 260;

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  return canvas;
}

function hash(i) {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/* Each profile repeats a whole number of times across the width, so two tiles side by side meet
   without a seam. Heights are fractions of the strip. */
const far = (x, w) => 0.62 + 0.14 * Math.sin((TAU * 2 * x) / w + 0.5) + 0.07 * Math.sin((TAU * 5 * x) / w + 1.3);
const mid = (x, w) => 0.4 + 0.1 * Math.sin((TAU * 2 * x) / w + 1) + 0.05 * Math.sin((TAU * 4 * x) / w + 2);
const near = (x, w) => 0.2 + 0.06 * Math.sin((TAU * 3 * x) / w) + 0.03 * Math.sin((TAU * 7 * x) / w + 1);

const top = (profile, x, w) => STRIP * (1 - profile(x, w));

function sticker(g, color, ink, width, inkAlpha = 1) {
  g.lineJoin = 'round';
  g.lineCap = 'round';
  if (width > 0) {
    g.globalAlpha = inkAlpha;
    g.strokeStyle = ink;
    g.lineWidth = width * 2;
    g.stroke();
    g.globalAlpha = 1;
  }
  g.fillStyle = color;
  g.fill();
}

function hill(g, w, profile, color, ink, outline, inkAlpha) {
  g.beginPath();
  g.moveTo(-10, STRIP + 10);
  for (let x = 0; x <= w; x += 6) g.lineTo(x, top(profile, x, w));
  g.lineTo(w, top(profile, w, w));
  g.lineTo(w + 10, STRIP + 10);
  g.closePath();
  sticker(g, color, ink, outline, inkAlpha);
}

function barn(g, x, base, c) {
  const w = 54;
  const h = 40;
  g.beginPath();
  g.moveTo(x - w / 2, base);
  g.lineTo(x - w / 2, base - h);
  g.lineTo(x, base - h - 24);
  g.lineTo(x + w / 2, base - h);
  g.lineTo(x + w / 2, base);
  g.closePath();
  sticker(g, c.barn, c.ink, 2.5, 0.7);
  g.beginPath();
  g.moveTo(x - w / 2 - 4, base - h + 2);
  g.lineTo(x, base - h - 26);
  g.lineTo(x + w / 2 + 4, base - h + 2);
  g.lineWidth = 6;
  g.strokeStyle = c.roof;
  g.stroke();
  g.fillStyle = c.fence;
  g.fillRect(x - 10, base - 22, 20, 22);
  g.strokeStyle = c.barn;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x - 10, base - 22);
  g.lineTo(x + 10, base);
  g.moveTo(x + 10, base - 22);
  g.lineTo(x - 10, base);
  g.stroke();
}

function trees(g, w, c) {
  const count = Math.max(2, Math.round(w / 170));
  for (let i = 0; i < count; i += 1) {
    const x = ((i + 0.3 + hash(i) * 0.4) / count) * w;
    const base = top(near, x, w) + 4;
    const r = 15 + hash(i + 40) * 8;
    g.beginPath();
    g.rect(x - 3, base - r, 6, r);
    sticker(g, c.roof, c.ink, 2, 0.6);
    g.beginPath();
    g.arc(x, base - r * 1.5, r, 0, TAU);
    g.arc(x - r * 0.6, base - r * 1.1, r * 0.7, 0, TAU);
    g.arc(x + r * 0.6, base - r * 1.1, r * 0.7, 0, TAU);
    sticker(g, c.tree, c.ink, 2.5, 0.6);
  }
}

function fence(g, w, c) {
  const step = w / Math.max(4, Math.round(w / 48));
  const y = STRIP - 6;
  g.beginPath();
  g.rect(-4, y - 26, w + 8, 5);
  g.rect(-4, y - 14, w + 8, 5);
  for (let x = step / 2; x < w; x += step) g.rect(x - 3, y - 34, 6, 34);
  sticker(g, c.fence, c.ink, 2, 0.55);
}

export function createScenery() {
  let width = 0;
  let density = 1;
  let sets = [null, null];

  function alloc() {
    sets = [0, 1].map(() => ({
      sky: makeCanvas(4, RULES.groundY * density),
      far: makeCanvas(width * density, STRIP * density),
      mid: makeCanvas(width * density, STRIP * density),
      near: makeCanvas(width * density, STRIP * density),
    }));
  }

  return {
    ensure(w, k) {
      if (w === width && k === density && sets[0]) return false;
      width = w;
      density = k;
      alloc();
      return true;
    },
    paint(index, c) {
      const set = sets[index];
      const sky = set.sky.getContext('2d');
      sky.setTransform(1, 0, 0, density, 0, 0);
      const grad = sky.createLinearGradient(0, 0, 0, RULES.groundY);
      grad.addColorStop(0, c.top);
      grad.addColorStop(0.6, c.mid);
      grad.addColorStop(1, c.bottom);
      sky.fillStyle = grad;
      sky.fillRect(0, 0, 4, RULES.groundY);

      for (const key of ['far', 'mid', 'near']) {
        const g = set[key].getContext('2d');
        g.setTransform(density, 0, 0, density, 0, 0);
        g.clearRect(0, 0, width, STRIP);
        if (key === 'far') hill(g, width, far, c.far, c.ink, 0, 0);
        if (key === 'mid') {
          hill(g, width, mid, c.hillMid, c.ink, 2, 0.3);
          const bx = width * 0.62;
          barn(g, bx, top(mid, bx, width) + 6, c);
        }
        if (key === 'near') {
          trees(g, width, c);
          hill(g, width, near, c.near, c.ink, 2.5, 0.45);
          fence(g, width, c);
        }
      }
    },
    set(index) {
      return sets[index];
    },
  };
}
