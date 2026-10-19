import { RULES } from './rules.js';
import { FIXED_STEP } from './step.js';

const { groundY: G, height: H } = RULES;
const BAR = '#0d0d1a';

const CLOUDS = [
  { x: 100, y: 100, s: 0.2 },
  { x: 400, y: 150, s: 0.15 },
  { x: 700, y: 80, s: 0.25 },
];

const wrap = (v, span) => ((v % span) + span) % span;

export function worldTransform(ctx, view, shake = { x: 0, y: 0 }) {
  const k = view.dpr * view.scale;
  ctx.setTransform(k, 0, 0, k, view.dpr * (view.offsetX + shake.x), view.dpr * (view.offsetY + shake.y));
}

function sky(ctx, w, d) {
  const grad = ctx.createLinearGradient(0, 0, 0, G);
  grad.addColorStop(0, '#1a1a2e');
  grad.addColorStop(1, '#16213e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, G);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  for (const c of CLOUDS) {
    const x = wrap(c.x - d * c.s, w + 200) - 100;
    ctx.beginPath();
    ctx.arc(x, c.y, 30, 0, Math.PI * 2);
    ctx.arc(x + 25, c.y - 10, 25, 0, Math.PI * 2);
    ctx.arc(x + 50, c.y, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  const bx = wrap(100 - d * 0.05, w + 300) - 150;
  ctx.fillRect(bx, G - 80, 150, 80);
  ctx.beginPath();
  ctx.moveTo(bx, G - 80);
  ctx.lineTo(bx + 75, G - 120);
  ctx.lineTo(bx + 150, G - 80);
  ctx.fill();
}

function ground(ctx, w, d) {
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0, G, w, H - G);
  ctx.fillStyle = '#228B22';
  ctx.fillRect(0, G, w, 20);
  ctx.strokeStyle = '#6d350f';
  ctx.lineWidth = 2;
  for (let x = -wrap(d, 100); x < w; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x + 20, G + 40);
    ctx.lineTo(x + 50, G + 40);
    ctx.moveTo(x + 70, G + 70);
    ctx.lineTo(x + 90, G + 70);
    ctx.stroke();
  }
}

function obstacle(ctx, o, x) {
  const { w, h } = o;
  ctx.save();
  ctx.translate(x, G);
  if (o.type === 'crate') {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-w / 2, -h, w, h);
    ctx.strokeStyle = '#5d3e2a';
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2 + 3, -h + 3, w - 6, h - 6);
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(w / 2, -h / 2);
    ctx.stroke();
  } else if (o.type === 'rock') {
    ctx.fillStyle = '#808080';
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w / 2.5, -h);
    ctx.lineTo(w / 4, -h * 0.9);
    ctx.lineTo(w / 2, 0);
    ctx.fill();
  } else {
    ctx.fillStyle = '#4a7c44';
    ctx.beginPath();
    ctx.arc(-10, -10, 15, 0, Math.PI * 2);
    ctx.arc(10, -10, 15, 0, Math.PI * 2);
    ctx.arc(0, -20, 15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function chicken(ctx, c, y, alive, time) {
  ctx.save();
  ctx.translate(c.x, y);
  ctx.rotate(Math.min(Math.max(c.vy / 1000, -0.2), 0.2));

  if (alive) {
    const cycle = c.run / 20;
    const left = Math.sin(cycle) * 10;
    const right = Math.sin(cycle + Math.PI) * 10;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, 10);
    ctx.lineTo(-8 + (c.grounded ? left : 5), 20 + (c.grounded ? Math.max(0, -left) : 0));
    ctx.moveTo(8, 10);
    ctx.lineTo(8 + (c.grounded ? right : -5), 20 + (c.grounded ? Math.max(0, -right) : 0));
    ctx.stroke();
  }

  ctx.fillStyle = '#FFD700';
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 25, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFA500';
  ctx.beginPath();
  ctx.ellipse(-5, c.grounded ? 5 : 5 + Math.sin(time * 20) * 5, 12, 8, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(15, -10, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'black';
  ctx.beginPath();
  if (alive) ctx.arc(20, -12, 4, 0, Math.PI * 2);
  else {
    ctx.strokeStyle = 'black';
    ctx.moveTo(16, -16);
    ctx.lineTo(24, -8);
    ctx.moveTo(24, -16);
    ctx.lineTo(16, -8);
    ctx.stroke();
  }
  ctx.fill();

  ctx.fillStyle = '#FF6B35';
  ctx.beginPath();
  ctx.moveTo(28, -8);
  ctx.lineTo(40, -5);
  ctx.lineTo(28, -2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* Draws one step behind the simulation, blended by alpha: obstacles and the road were one step's
   travel further right a step ago, and the chicken was at prevY. */
export function drawWorld(ctx, world, alpha, time, prevY, view, shake) {
  const back = world.phase === 'playing' ? world.speed * FIXED_STEP * (1 - alpha) : 0;
  const d = world.distance - back;

  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.fillStyle = BAR;
  ctx.fillRect(0, 0, ctx.canvas.width / view.dpr, ctx.canvas.height / view.dpr);

  worldTransform(ctx, view, shake);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, world.width, H);
  ctx.clip();
  sky(ctx, world.width, d);
  ground(ctx, world.width, d);
  for (const o of world.obstacles) obstacle(ctx, o, o.x + back);
  const y = prevY + (world.chicken.y - prevY) * alpha;
  chicken(ctx, world.chicken, y, world.phase !== 'over', time);
  ctx.restore();
}
