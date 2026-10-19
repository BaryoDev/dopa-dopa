import { Game, GameUI, ParticleSystem, SoundManager } from 'dopaminejs';
import { WebGLParticlePlugin } from 'dopaminejs-plugin-webgl-particles';
import { FeedbackPlugin } from 'dopaminejs-plugin-feedback-effects';
import { themeEngine } from 'dopaminejs-themes';
import 'dopaminejs/style.css';
import './ui/styles.css';
import { RULES, viewWidth } from './game/rules.js';
import { createWorld, resize } from './game/world.js';
import { RunScene } from './game/scene.js';
import { createShake } from './fx/shake.js';
import { createParticles } from './fx/particles.js';
import { createFeedback } from './fx/feedback.js';
import { shouldAct } from './ui/input.js';
import { createScreens, svgElement, FLAME_ICON } from './ui/screens.js';
import { applyTheme, setPhaseTheme } from './theme.js';
import { phaseFor } from './game/palette.js';
import { guardedLocalStorage, asyncStore } from './platform/storage.js';
import { migrateLegacy, markMigrated } from './migrate.js';
import { addScore, sanitize, LEADERBOARD_KEY } from './leaderboard.js';
import { createRewards, recordRun, GAME } from './progression/rewards.js';

const NAME_KEY = 'dopadopa.name';
const MAX_DPR = 3;
const DUST_EVERY = 6;

function safe(fn) {
  try {
    return fn();
  } catch (error) {
    console.warn('[dopa-dopa]', error);
    return undefined;
  }
}

function parseBoard(raw) {
  try {
    return sanitize(JSON.parse(raw));
  } catch {
    return [];
  }
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

function newestName(entries) {
  if (entries.length === 0) return '';
  const name = entries.reduce((a, b) => (b.ts > a.ts ? b : a)).name;
  return name && name !== 'Player' && name !== 'Anonymous' ? name : '';
}

const newSeed = () => (Date.now() ^ (Math.random() * 2 ** 32)) >>> 0;

async function boot() {
  safe(() => applyTheme(themeEngine));
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  const local = guardedLocalStorage();
  const store = asyncStore(local);

  let legacyBest = 0;
  try {
    legacyBest = await migrateLegacy({ legacy: local, store });
  } catch (error) {
    console.warn('[dopa-dopa] migration failed', error);
  }

  let rewards = null;
  try {
    rewards = await createRewards(store, { legacyBest });
    await markMigrated(store);
  } catch (error) {
    console.warn('[dopa-dopa] rewards unavailable', error);
  }

  let board = [];
  let playerName = '';
  try {
    board = parseBoard(await store.getItem(LEADERBOARD_KEY));
    playerName = (await store.getItem(NAME_KEY)) ?? '';
    if (!playerName) playerName = newestName(board);
  } catch (error) {
    console.warn('[dopa-dopa] could not read saved data', error);
  }

  const savedBest = rewards?.player?.stats?.[GAME]?.highScore ?? 0;
  let best = Math.max(savedBest, legacyBest, ...board.map((e) => e.score), 0);

  const view = { scale: 1, offsetX: 0, offsetY: 0, dpr: 1 };
  const canvas = document.getElementById('game');
  const game = new Game({ canvas, width: window.innerWidth, height: window.innerHeight, backgroundColor: '#8fd3f4' });
  const { kernel } = game;
  if (hasWebGL()) {
    try {
      kernel.plugins.use(WebGLParticlePlugin);
    } catch (error) {
      console.warn('[dopa-dopa] particles unavailable', error);
    }
  }
  try {
    kernel.plugins.use(FeedbackPlugin);
  } catch (error) {
    console.warn('[dopa-dopa] feedback unavailable', error);
  }

  const gameUI = new GameUI(new ParticleSystem());
  const sound = new SoundManager({ storage: local, storageKey: 'dopadopa.muted' });
  const shake = createShake({ reduced });
  const particles = createParticles(kernel, view, { reduced });
  const feedback = createFeedback(kernel, { reduced });

  const streakIcon = gameUI.container.querySelector('.streak-icon');
  const flame = svgElement(FLAME_ICON);
  if (streakIcon && flame) streakIcon.replaceChildren(flame);

  let world = createWorld({ width: viewWidth(window.innerWidth / window.innerHeight), seed: newSeed() });
  let mode = 'menu';
  let steps = 0;

  const syncProgress = () => {
    if (!rewards?.player) return;
    const { player } = rewards;
    const { total, needed, progress } = rewards.getXPForNextLevel();
    gameUI.updateXP(player.xp, needed, total, progress);
    gameUI.updateLevel(player.level);
    gameUI.updateStreak(player.streak.current);
  };
  safe(syncProgress);
  rewards?.on('level_up', (data) => {
    safe(() => feedback.levelUp(world.width / 2, RULES.height / 3, data.newLevel));
  });

  const screens = createScreens(document.getElementById('ui'), {
    onStart: startRun,
    onToggleMute: () => sound.toggleMute(),
  });
  screens.setMuted(sound.muted);
  screens.setName(playerName);
  screens.showStart(best);

  function startRun() {
    playerName = screens.name.trim().slice(0, 16);
    store.setItem(NAME_KEY, playerName).catch((e) => console.warn('[dopa-dopa] could not save the name', e));
    safe(() => sound.initAudio());
    world = createWorld({ width: world.width, seed: newSeed() });
    scene.setWorld(world);
    steps = 0;
    mode = 'playing';
    safe(() => setPhaseTheme(themeEngine, 'morning'));
    screens.showPlaying();
    scene.jump();
  }

  async function persistRun(score, entries) {
    try {
      await store.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
    } catch (error) {
      console.warn('[dopa-dopa] could not save the leaderboard', error);
    }
    if (!rewards) return;
    try {
      await recordRun(rewards, score);
      syncProgress();
      const unseen = rewards.getUnseenAchievements();
      unseen.forEach((a, i) => setTimeout(() => safe(() => screens.showAchievement(a)), 500 + i * 700));
      if (unseen.length > 0) await rewards.markAchievementsSeen(unseen.map((a) => a.id));
    } catch (error) {
      console.warn('[dopa-dopa] could not record the run', error);
    }
  }

  function onCrash() {
    mode = 'over';
    const score = world.score;
    const { chicken } = world;
    safe(() => sound.playGameOver());
    shake.kick(10);
    safe(() => particles.burst(chicken.x, chicken.y, '#FF4444'));
    safe(() => feedback.oops(chicken.x, chicken.y - 40));
    let run = null;
    try {
      ({ entries: board, run } = addScore(board, playerName, score, Date.now()));
    } catch (error) {
      console.warn('[dopa-dopa] could not rank the run', error);
    }
    const previousBest = best;
    best = Math.max(best, score);
    screens.showOver(score, best, board, run, previousBest);
    persistRun(score, board);
  }

  function onEvents(events) {
    const { chicken } = world;
    const feet = RULES.groundY;
    if (events.jumped) {
      safe(() => sound.playJump());
      safe(() => particles.feathers(chicken.x, chicken.y));
    }
    if (events.landed) safe(() => particles.landing(chicken.x, feet));
    if (world.phase === 'playing' && chicken.grounded && ++steps % DUST_EVERY === 0) {
      safe(() => particles.dust(chicken.x - RULES.chickenRadius, feet));
    }
    if (events.scored) {
      screens.showScore(world.score);
      safe(() => setPhaseTheme(themeEngine, phaseFor(world.score)));
      safe(() => sound.playScore());
      if (world.score % 10 === 0) {
        safe(() => sound.playSuccess());
        safe(() => feedback.milestone(world.width / 2, RULES.height / 3, world.score));
        safe(() => particles.confetti(world.width / 2, RULES.height / 3));
      } else if (events.close) {
        safe(() => feedback.close(chicken.x, chicken.y - 50));
      }
    }
    if (events.faster) safe(() => feedback.faster(world.width / 2, RULES.height / 3 + 40));
    if (events.crashed) onCrash();
  }

  const scene = new RunScene({ world, onEvents, view, shake });

  function fit() {
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const width = viewWidth(cssW / cssH);
    const scale = Math.min(cssW / width, cssH / RULES.height);
    Object.assign(view, {
      scale,
      dpr,
      offsetX: (cssW - width * scale) / 2,
      offsetY: (cssH - RULES.height * scale) / 2,
    });
    game.renderer.resize(Math.round(cssW * dpr), Math.round(cssH * dpr));
    resize(world, width);
    scene.snap();
  }
  fit();
  window.addEventListener('resize', fit);

  function onInput(event) {
    if (!shouldAct(event, mode)) return;
    if (event.type === 'keydown') event.preventDefault();
    if (scene.paused) {
      scene.resume();
      screens.hidePaused();
      return;
    }
    if (mode === 'playing') scene.jump();
    else if (mode === 'menu' || screens.overGuardClear()) startRun();
  }
  window.addEventListener('pointerdown', onInput);
  window.addEventListener('keydown', onInput);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && mode === 'playing' && !scene.paused) {
      scene.pause();
      screens.showPaused();
    }
  });

  game.setScene(scene);
  game.start();

  if (import.meta.env.DEV || new URLSearchParams(window.location.search).get('test') === '1') {
    window.__dd = {
      get world() {
        return world;
      },
      scene,
    };
  }
}

boot().catch((error) => console.error('[dopa-dopa] failed to start', error));
