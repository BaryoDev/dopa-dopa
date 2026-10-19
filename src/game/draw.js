import { RULES } from './rules.js';
import { FIXED_STEP } from './step.js';
import { phaseFor, colorsOf, skyAt, mix } from './palette.js';
import { createScenery, STRIP } from './scenery.js';

const { groundY: G } = RULES;
const TAU = Math.PI * 2;
const BLEND_SECONDS = 1.5;
const BLEND_STEPS = 24;
const LIP = 16;
const SQUASH_SECONDS = 0.18;

const CLOUDS = [
  { x: 0.08, y: 0.1, w: 90, s: 8 },
  { x: 0.36, y: 0.42, w: 66, s: 12 },
  { x: 0.57, y: 0.02, w: 110, s: 6 },
  { x: 0.8, y: 0.55, w: 74, s: 14 },
];

const STARS = Array.from({ length: 50 }, (_, i) => {
  const h = (n) => {
    const s = Math.sin((i + 1) * n) * 43758.5453;
    return s - Math.floor(s);
  };
  return { x: h(12.9898), y: h(78.233), r: 0.8 + h(37.719) * 1.4, p: h(4.1414) * TAU };
});

const wrap = (v, span) => ((v % span) + span) % span;
const smooth = (t) => t * t * (3 - 2 * t);

function prefersReducedMotion() {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function worldTransform(ctx, view, shake = { x: 0, y: 0 }) {
  const k = view.dpr * view.scale;
  ctx.setTransform(k, 0, 0, k, view.dpr * (view.offsetX + shake.x), view.dpr * (view.offsetY + shake.y));
}

/* Stroke at twice the width, then fill over it: only the outer half of the line shows, so
   overlapping shapes in one path get a single outline. */
function sticker(ctx, fill, ink, width) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = ink;
  ctx.lineWidth = width * 2;
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundedRect(ctx, x, y, w, h, r) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}

function groundShadow(ctx, c, x, w, alpha) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = c.shadow;
  ctx.beginPath();
  ctx.ellipse(x + 4, G + 5, w, 5, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function crate(ctx, c, w, h) {
  ctx.beginPath();
  roundedRect(ctx, -w / 2, -h, w, h, 5);
  sticker(ctx, c.crate, c.ink, 3);
  ctx.strokeStyle = c.crateDark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 6, -h + 6);
  ctx.lineTo(w / 2 - 6, -6);
  ctx.moveTo(-w / 2 + 4, -h / 2);
  ctx.lineTo(w / 2 - 4, -h / 2);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = 0.35;
  ctx.fillRect(-w / 2 + 4, -h + 4, w - 8, 3);
  ctx.globalAlpha = 1;
}

function rock(ctx, c, w, h) {
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.quadraticCurveTo(-w / 2, -h * 0.75, -w * 0.15, -h);
  ctx.quadraticCurveTo(w * 0.35, -h * 1.02, w / 2, -h * 0.3);
  ctx.quadraticCurveTo(w * 0.55, 0, w * 0.45, 0);
  ctx.closePath();
  sticker(ctx, c.rock, c.ink, 3);
  ctx.fillStyle = c.rockDark;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, 0);
  ctx.quadraticCurveTo(w * 0.42, -h * 0.35, w * 0.44, -h * 0.05);
  ctx.lineTo(w * 0.42, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.ellipse(-w * 0.12, -h * 0.72, w * 0.12, h * 0.08, -0.4, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function bush(ctx, c, w, h) {
  const r = h * 0.45;
  ctx.beginPath();
  ctx.arc(-w / 2 + r, -r, r, 0, TAU);
  ctx.arc(w / 2 - r, -r, r, 0, TAU);
  ctx.arc(0, -h + r, r * 1.05, 0, TAU);
  ctx.rect(-w / 2 + r, -r, w - 2 * r, r);
  sticker(ctx, c.bush, c.ink, 3);
  ctx.fillStyle = c.bushDark;
  ctx.beginPath();
  ctx.arc(w / 2 - r, -r * 0.7, r * 0.6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(-r * 0.3, -h + r * 0.7, r * 0.35, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#e03131';
  ctx.beginPath();
  ctx.arc(-w * 0.18, -h * 0.45, 2.6, 0, TAU);
  ctx.arc(w * 0.12, -h * 0.62, 2.6, 0, TAU);
  ctx.arc(w * 0.22, -h * 0.3, 2.6, 0, TAU);
  ctx.fill();
}

const SHAPES = { crate, rock, bush };

export function createRenderer({ reducedMotion } = {}) {
  const scenery = createScenery();
  let reduced = reducedMotion ?? prefersReducedMotion();
  let curIdx = 0;
  let curPhase = 'morning';
  let blending = false;
  let blendStart = 0;
  let blendEase = 1;
  let table = null;
  let lastWorld = null;
  let wasGrounded = true;
  let landedAt = -10;

  if (reducedMotion === undefined && typeof matchMedia === 'function') {
    try {
      matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        reduced = e.matches;
      });
    } catch {
      // older browsers have no change event, the value read at boot stays
    }
  }

  function advancePhase(world, time, k) {
    const resized = scenery.ensure(world.width, k);
    const target = phaseFor(world.score);
    if (resized || world !== lastWorld) {
      lastWorld = world;
      curPhase = target;
      blending = false;
      blendEase = 1;
      scenery.paint(curIdx, colorsOf(curPhase));
    } else if (target !== curPhase) {
      const prev = curPhase;
      curPhase = target;
      if (reduced || blending) {
        blending = false;
        scenery.paint(curIdx, colorsOf(curPhase));
      } else {
        curIdx = 1 - curIdx;
        scenery.paint(curIdx, colorsOf(curPhase));
        blending = true;
        blendStart = time;
        table = [];
        for (let i = 0; i < BLEND_STEPS; i += 1) table.push(skyAt(prev, curPhase, smooth((i + 1) / BLEND_STEPS)));
      }
    }
    if (blending) {
      const t = (time - blendStart) / BLEND_SECONDS;
      if (t >= 1) {
        blending = false;
        blendEase = 1;
      } else {
        blendEase = smooth(Math.max(0, t));
      }
    }
    return blending ? table[Math.min(BLEND_STEPS - 1, Math.floor(blendEase * BLEND_STEPS))] : colorsOf(curPhase);
  }

  function tile(ctx, canvas, y, width, offset, alpha, k) {
    const tw = canvas.width / k;
    const px = Math.floor(wrap(offset, tw) * k) / k;
    ctx.globalAlpha = alpha;
    // A device pixel of overlap hides the antialiased edge where two tiles meet.
    for (let x = -px; x < width; x += tw - 1 / k) ctx.drawImage(canvas, x, y, tw, STRIP);
  }

  function drawLayer(ctx, key, width, offset, k) {
    const y = G - STRIP;
    if (blending) tile(ctx, scenery.set(1 - curIdx)[key], y, width, offset, 1, k);
    tile(ctx, scenery.set(curIdx)[key], y, width, offset, blending ? blendEase : 1, k);
    ctx.globalAlpha = 1;
  }

  function drawSky(ctx, c, width, above) {
    ctx.fillStyle = c.top;
    ctx.fillRect(0, above, width, -above);
    if (blending) ctx.drawImage(scenery.set(1 - curIdx).sky, 0, 0, width, G);
    ctx.globalAlpha = blending ? blendEase : 1;
    ctx.drawImage(scenery.set(curIdx).sky, 0, 0, width, G);
    ctx.globalAlpha = 1;
  }

  function drawOrb(ctx, c, width, time) {
    const x = c.orbX * width;
    const y = c.orbY * (G - 120);
    const r = c.moon > 0.5 ? 26 : 30;
    ctx.fillStyle = c.glow;
    for (const [scale, a] of [[2.6, 0.12], [1.8, 0.18], [1.3, 0.26]]) {
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(x, y, r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (c.moon < 0.5 && !reduced) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(time * 0.15);
      ctx.strokeStyle = c.glow;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.7 * (1 - c.moon);
      ctx.beginPath();
      for (let i = 0; i < 10; i += 1) {
        const a = (i / 10) * TAU;
        ctx.moveTo(Math.cos(a) * r * 1.35, Math.sin(a) * r * 1.35);
        ctx.lineTo(Math.cos(a) * r * 1.65, Math.sin(a) * r * 1.65);
      }
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.globalAlpha = 1;
    sticker(ctx, c.orb, c.glow, 2.5);
    if (c.moon > 0.02) {
      ctx.globalAlpha = c.moon * 0.4;
      ctx.fillStyle = '#9aa0c8';
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y - r * 0.25, r * 0.22, 0, TAU);
      ctx.moveTo(x + r * 0.65, y + r * 0.2);
      ctx.arc(x + r * 0.35, y + r * 0.2, r * 0.3, 0, TAU);
      ctx.moveTo(x + r * 0.04, y + r * 0.5);
      ctx.arc(x - r * 0.1, y + r * 0.5, r * 0.14, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawStars(ctx, c, width, time) {
    if (c.star < 0.01) return;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < STARS.length; i += 1) {
      const s = STARS[i];
      const x = wrap(s.x * width - (reduced ? 0 : time * 3), width);
      ctx.globalAlpha = c.star * (reduced ? 1 : 0.55 + 0.45 * Math.sin(time * 2.2 + s.p));
      ctx.beginPath();
      ctx.arc(x, s.y * G * 0.6, s.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawClouds(ctx, c, width, time) {
    if (c.cloudA < 0.01) return;
    // Opaque colours faded toward the sky, so the outline never shows through the fill.
    const fill = mix(c.cloud, c.top, 1 - c.cloudA);
    const ink = mix(c.ink, c.top, 1 - c.cloudA);
    for (let i = 0; i < CLOUDS.length; i += 1) {
      const cl = CLOUDS[i];
      const w = cl.w;
      const span = width + w * 2;
      const x = wrap(cl.x * width - (reduced ? 0 : time * cl.s), span) - w;
      const y = 40 + cl.y * G * 0.4;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(x + w * 0.25, y, w * 0.2, 0, TAU);
      ctx.arc(x + w * 0.5, y - w * 0.1, w * 0.26, 0, TAU);
      ctx.arc(x + w * 0.75, y, w * 0.19, 0, TAU);
      ctx.rect(x + w * 0.25, y, w * 0.5, w * 0.19);
      sticker(ctx, fill, ink, 2.5);
      ctx.globalAlpha = c.cloudA * 0.18;
      ctx.fillStyle = c.ink;
      ctx.fillRect(x + w * 0.2, y + w * 0.17, w * 0.6, 3);
    }
    ctx.globalAlpha = 1;
  }

  function drawGround(ctx, c, width, below, d) {
    ctx.fillStyle = c.road;
    ctx.fillRect(0, G, width, below - G);
    ctx.fillStyle = c.roadMark;
    for (let x = -wrap(d, 120); x < width; x += 120) {
      ctx.beginPath();
      roundedRect(ctx, x + 10, G + LIP + 24, 34, 6, 3);
      roundedRect(ctx, x + 70, G + LIP + 54, 22, 6, 3);
      ctx.fill();
    }
    ctx.globalAlpha = 0.5;
    for (let x = -wrap(d, 60); x < width; x += 60) {
      ctx.beginPath();
      ctx.arc(x + 30, G + LIP + 40, 2.5, 0, TAU);
      ctx.arc(x + 8, G + LIP + 70, 2, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = c.grass;
    ctx.fillRect(0, G, width, LIP);
    ctx.fillStyle = c.grassLight;
    ctx.fillRect(0, G, width, 4);
    ctx.fillStyle = c.grass;
    ctx.beginPath();
    for (let x = -wrap(d, 22); x < width + 22; x += 22) {
      ctx.moveTo(x, G + LIP);
      ctx.lineTo(x + 6, G + LIP + 7);
      ctx.lineTo(x + 12, G + LIP);
    }
    ctx.fill();
    ctx.fillStyle = c.ink;
    ctx.fillRect(0, G - 2, width, 3);
  }

  function drawObstacles(ctx, c, world, back) {
    for (const o of world.obstacles) {
      const x = o.x + back;
      groundShadow(ctx, c, x, o.w * 0.55, 0.28);
      ctx.save();
      ctx.translate(x, G);
      SHAPES[o.type](ctx, c, o.w, o.h);
      ctx.restore();
    }
  }

  function drawChicken(ctx, c, world, y, time) {
    const ch = world.chicken;
    const alive = world.phase !== 'over';
    const ready = world.phase === 'ready';
    const ink = '#3a2416';

    if (ch.grounded && !wasGrounded) landedAt = time;
    wasGrounded = ch.grounded;

    const height = G - RULES.chickenHalfHeight - y;
    groundShadow(ctx, c, ch.x - 4, Math.max(8, 22 - height * 0.08), Math.max(0.1, 0.3 - height * 0.0015));

    let sx = 1;
    let sy = 1;
    if (!reduced) {
      const since = time - landedAt;
      if (ch.grounded && since < SQUASH_SECONDS) {
        const p = 1 - since / SQUASH_SECONDS;
        sx = 1 + 0.14 * p;
        sy = 1 - 0.12 * p;
      } else if (!ch.grounded) {
        const stretch = Math.min(0.1, Math.abs(ch.vy) / 6000);
        sx = 1 - stretch;
        sy = 1 + stretch;
      }
    }
    const bob = ready && !reduced ? Math.sin(time * 5) * 2 : 0;

    ctx.save();
    ctx.translate(ch.x, y + RULES.chickenHalfHeight + bob);
    ctx.scale(sx, sy);
    ctx.translate(0, -RULES.chickenHalfHeight);
    ctx.rotate(alive ? Math.min(Math.max(ch.vy / 1600, -0.18), 0.18) : 0.25);

    if (alive) {
      const cycle = ch.run / 14;
      const swing = ch.grounded && !ready ? 1 : 0;
      ctx.lineCap = 'round';
      for (const [hip, phase] of [[-7, 0], [6, Math.PI]]) {
        const fx = hip + (ch.grounded ? Math.sin(cycle + phase) * 8 * swing : -4);
        const fy = 21 - (ch.grounded ? Math.max(0, Math.cos(cycle + phase)) * 4 * swing : 4);
        ctx.beginPath();
        ctx.moveTo(hip, 12);
        ctx.lineTo(fx, fy);
        ctx.lineTo(fx + 5, fy);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 7;
        ctx.stroke();
        ctx.strokeStyle = '#f08c00';
        ctx.lineWidth = 3.5;
        ctx.stroke();
      }
    }

    ctx.beginPath();
    ctx.ellipse(-25, -8, 7, 9, -0.5, 0, TAU);
    ctx.ellipse(-27, 0, 6, 7, -0.2, 0, TAU);
    ctx.ellipse(0, 2, 24, 19, 0, 0, TAU);
    ctx.arc(14, -12, 14, 0, TAU);
    sticker(ctx, '#ffd43b', ink, 3);

    ctx.fillStyle = '#fff3bf';
    ctx.beginPath();
    ctx.ellipse(4, 9, 15, 9, -0.1, 0, TAU);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(9, -27, 5, 0, TAU);
    ctx.arc(15, -29, 5.5, 0, TAU);
    ctx.arc(21, -26, 4.5, 0, TAU);
    ctx.moveTo(28, -2);
    ctx.ellipse(26, -2, 3.5, 5, 0, 0, TAU);
    sticker(ctx, '#f03e3e', ink, 2);

    ctx.beginPath();
    ctx.moveTo(26, -16);
    ctx.lineTo(38, -11);
    ctx.lineTo(26, -6);
    ctx.closePath();
    sticker(ctx, '#ff922b', ink, 2);

    if (alive) {
      const blink = ready && !reduced && wrap(time, 3.2) < 0.12;
      ctx.beginPath();
      ctx.arc(18, -15, 6, 0, TAU);
      sticker(ctx, '#fff', ink, 1.5);
      if (blink) {
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(13, -15);
        ctx.lineTo(23, -15);
        ctx.stroke();
      } else {
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.arc(20, -15, 3.4, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(21.2, -16.4, 1.2, 0, TAU);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(14, -19);
      ctx.lineTo(22, -11);
      ctx.moveTo(22, -19);
      ctx.lineTo(14, -11);
      ctx.stroke();
    }

    ctx.fillStyle = '#ff8787';
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.ellipse(13, -6, 3.5, 2.2, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    let flap = 0;
    if (!ch.grounded && alive && !reduced) flap = Math.sin(time * 28) * 0.6 - 0.3;
    ctx.save();
    ctx.translate(-6, 0);
    ctx.rotate(flap);
    ctx.beginPath();
    ctx.ellipse(-2, 4, 12, 8, -0.35, 0, TAU);
    sticker(ctx, '#fab005', ink, 2);
    ctx.restore();

    ctx.restore();
  }

  return {
    draw(ctx, world, alpha, time, prevY, view, shake) {
      const k = view.dpr * view.scale;
      const c = advancePhase(world, time, k);
      const back = world.phase === 'playing' ? world.speed * FIXED_STEP * (1 - alpha) : 0;
      const d = reduced ? 0 : world.distance - back;
      const { width } = world;
      const cssW = ctx.canvas.width / view.dpr;
      const cssH = ctx.canvas.height / view.dpr;
      const above = -view.offsetY / view.scale - 20;
      const below = (cssH - view.offsetY) / view.scale + 20;

      ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
      ctx.fillStyle = c.ink;
      ctx.fillRect(0, 0, cssW, cssH);

      worldTransform(ctx, view, shake);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, above, width, below - above);
      ctx.clip();
      drawSky(ctx, c, width, above);
      drawStars(ctx, c, width, time);
      drawOrb(ctx, c, width, time);
      drawClouds(ctx, c, width, time);
      drawLayer(ctx, 'far', width, d * 0.1, k);
      drawLayer(ctx, 'mid', width, d * 0.3, k);
      drawLayer(ctx, 'near', width, d * 0.6, k);
      drawGround(ctx, c, width, below, world.distance - back);
      drawObstacles(ctx, c, world, back);
      const y = prevY + (world.chicken.y - prevY) * alpha;
      drawChicken(ctx, c, world, y, time);
      ctx.restore();
    },
  };
}

const shared = createRenderer();

/* Draws one step behind the simulation, blended by alpha: obstacles and the road were one step's
   travel further right a step ago, and the chicken was at prevY. */
export function drawWorld(ctx, world, alpha, time, prevY, view, shake) {
  shared.draw(ctx, world, alpha, time, prevY, view, shake);
}
