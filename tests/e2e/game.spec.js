import { test, expect } from '@playwright/test';

const STAND = 480;

async function open(page) {
  await page.goto('./?test=1');
  await expect(page.locator('#screen-start')).toBeVisible();
  await page.waitForFunction(() => Boolean(window.__dd));
}

async function tapCorner(page) {
  const { height } = page.viewportSize();
  await page.mouse.click(8, height - 8);
}

async function playing(page) {
  await expect(page.locator('#hud-score')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__dd.world.phase)).toBe('playing');
}

async function start(page, name = 'Tester') {
  await open(page);
  await page.locator('#player-name').fill(name);
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await playing(page);
}

async function place(page, offset) {
  await page.evaluate((dx) => {
    const w = window.__dd.world;
    Object.assign(w.chicken, { y: 480, vy: 0, grounded: true });
    w.nextSpawnAt = w.distance + 1e6;
    w.obstacles = [{ type: 'crate', x: w.chicken.x + dx, w: 45, h: 45, passed: false }];
  }, offset);
}

async function crash(page) {
  await place(page, 0);
  await expect(page.locator('#screen-over')).toBeVisible();
}

async function stubHidden(page, hidden) {
  await page.evaluate((h) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

test('Space starts and jumps', async ({ page }) => {
  await open(page);
  await page.keyboard.press('Space');
  await playing(page);
  expect(await page.evaluate(() => window.__dd.world.chicken.grounded)).toBe(false);
});

test('Enter starts', async ({ page }) => {
  await open(page);
  await page.keyboard.press('Enter');
  await playing(page);
});

test('a tap on the canvas starts', async ({ page }) => {
  await open(page);
  await tapCorner(page);
  await playing(page);
});

test('scores a point', async ({ page }) => {
  await start(page);
  await place(page, -60);
  await expect(page.locator('#hud-score')).toHaveText('1');
});

test('crash shows the score and the board', async ({ page }) => {
  await start(page);
  await crash(page);
  await expect(page.locator('#final-score')).toHaveText(/^\d+$/);
  await expect(page.locator('#board')).toContainText('Tester');
  expect(await page.evaluate(() => window.__dd.world.chicken.y)).toBe(STAND);
});

test('held Space does not restart from the over screen', async ({ page }) => {
  await start(page);
  await crash(page);
  await page.keyboard.down('Space');
  for (let i = 0; i < 20; i += 1) {
    await page.waitForTimeout(50);
    await page.keyboard.down('Space');
  }
  await page.keyboard.up('Space');
  // Checked at once: a restarted run would crash on its own a few seconds later.
  expect(await page.evaluate(() => window.__dd.world.phase)).toBe('over');
  expect(await page.locator('#screen-over').isVisible()).toBe(true);
});

test('Space after the guard starts a new run', async ({ page }) => {
  await start(page);
  await crash(page);
  await page.waitForTimeout(700);
  await page.keyboard.press('Space');
  await playing(page);
  await expect(page.locator('#screen-over')).toBeHidden();
});

test('best and mute survive a reload', async ({ page }) => {
  await start(page);
  await place(page, -60);
  await expect(page.locator('#hud-score')).toHaveText('1');
  await crash(page);
  await expect(page.locator('#best-score')).toHaveText('1');
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'Run again' }).click();
  await playing(page);
  await page.locator('#mute').click();
  await expect(page.locator('#mute')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('#best')).toHaveText('1');
  await expect(page.locator('#mute')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#player-name')).toHaveValue('Tester');
});

test('the old best is carried over', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('dopa-dopa-highscore', '37');
      sessionStorage.setItem('seeded', '1');
    }
  });
  await open(page);
  await expect(page.locator('#best')).toHaveText('37');
  expect(await page.evaluate(() => localStorage.getItem('dopa-dopa-highscore'))).toBe('37');
  await page.reload();
  await expect(page.locator('#best')).toHaveText('37');
});

test('hidden tab pauses and a tap resumes', async ({ page }) => {
  await start(page);
  await stubHidden(page, true);
  await expect(page.locator('#screen-paused')).toBeVisible();
  const before = await page.evaluate(() => window.__dd.world.distance);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__dd.world.distance)).toBe(before);
  await stubHidden(page, false);
  await tapCorner(page);
  await expect(page.locator('#screen-paused')).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.__dd.world.distance)).toBeGreaterThan(before);
});

test('a crash before the tab hides shows the over screen, not pause', async ({ page }) => {
  await start(page);
  await crash(page);
  await stubHidden(page, true);
  await expect(page.locator('#screen-over')).toBeVisible();
  await expect(page.locator('#screen-paused')).toBeHidden();
});

test('boots and plays with storage that throws', async ({ page }) => {
  await page.addInitScript(() => {
    const fail = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    Storage.prototype.getItem = fail;
    Storage.prototype.setItem = fail;
    Storage.prototype.removeItem = fail;
  });
  await start(page);
  await crash(page);
  await expect(page.locator('#board')).toContainText('Tester');
});

for (const size of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1366, height: 800 }]) {
  test(`fills the screen at ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await open(page);
    const box = await page.locator('#game').boundingBox();
    expect(box).toEqual({ x: 0, y: 0, width: size.width, height: size.height });
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(scroll).toBeLessThanOrEqual(0);
    await page.keyboard.press('Space');
    await playing(page);
    await page.setViewportSize({ width: size.height, height: size.width });
    await expect.poll(() => page.evaluate(() => window.__dd.world.phase)).toBe('playing');
  });
}

test('no console errors and no requests to other hosts', async ({ page }) => {
  const errors = [];
  const offsite = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    const { hostname, protocol } = new URL(r.url());
    if (protocol.startsWith('http') && hostname !== 'localhost') offsite.push(r.url());
  });
  await start(page);
  await place(page, -60);
  await expect(page.locator('#hud-score')).toHaveText('1');
  await crash(page);
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
  expect(offsite).toEqual([]);
});

async function scoreTo(page, score) {
  await page.evaluate((n) => {
    const w = window.__dd.world;
    w.score = n - 1;
    w.nextSpawnAt = w.distance + 1e6;
    w.obstacles = [{ type: 'crate', x: w.chicken.x - 60, w: 45, h: 45, passed: false }];
  }, score);
  await expect(page.locator('#hud-score')).toHaveText(String(score));
}

test('the phase follows the score and the Caught card shows a medal', async ({ page }) => {
  await start(page);
  await expect(page.locator('html')).toHaveAttribute('data-phase', 'morning');
  await scoreTo(page, 10);
  await expect(page.locator('html')).toHaveAttribute('data-phase', 'day');
  await crash(page);
  await expect(page.locator('#screen-over .medal')).toHaveAttribute('data-medal', 'bronze');
  await expect(page.locator('#screen-over .medal')).toBeVisible();
});

test('no medal below 10', async ({ page }) => {
  await start(page);
  await scoreTo(page, 9);
  await crash(page);
  await expect(page.locator('#screen-over .medal')).toBeHidden();
});

test('the name is prefilled from the newest board entry', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('dopadopa.leaderboard', JSON.stringify([
      { name: 'Old', score: 30, ts: 1000 },
      { name: 'Newest', score: 5, ts: 2000 },
    ]));
  });
  await open(page);
  await expect(page.locator('#player-name')).toHaveValue('Newest');
});
