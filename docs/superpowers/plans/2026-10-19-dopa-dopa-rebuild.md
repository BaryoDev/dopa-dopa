# Dopa-Dopa Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Dopa-Dopa as a small, tested dopaminejs 2.4 web game in the shape of Bird Flight, and redeploy it to https://playground.baryo.dev/dopadopa/.

**Architecture:** Pure rules and world state stepped at a fixed 1/60 s by a dopaminejs Scene, which draws with interpolation and then lets the scene's own objects (feedback text, confetti) update and draw. DOM screens for start, HUD, pause, game over and leaderboard. Plugins sit behind small `fx/` adapters with no-op fallbacks.

**Tech Stack:** dopaminejs 2.4.0, dopaminejs-plugin-webgl-particles 1.1.2, dopaminejs-plugin-feedback-effects 1.0.2, dopaminejs-themes 1.0.2, Vite 8.3.4, Vitest 5.0.5, @playwright/test 1.64.1, Node 22.

**Spec:** `docs/superpowers/specs/2026-10-19-dopa-dopa-rebuild-design.md`

**Reference:** Bird Flight at `~/repos/SimpleMobileGames`. Where a task says "as Bird Flight", read that file and follow its shape.

## Global Constraints

- Repo `~/Documents/repos/dopa-dopa`, branch `rebuild` (already off `main`, holds the spec).
- Pinned versions, no `^` or `~`. Dependencies: exactly the four dopaminejs packages above. Dev: vite, vitest, @playwright/test. Remove debug-overlay, ecosystem, howler-audio, sound-packs, howler, esbuild.
- Vite `base: './'`, output `dist/`. No `resolve.alias` or `optimizeDeps` blocks.
- No runtime request to any other host. No audio files, no web fonts. Sounds come from dopaminejs `SoundManager` (`playJump`, `playScore`, `playGameOver`, `playSuccess`).
- Every storage key starts with `dopadopa.`. RewardSystem: `new DataService({ storage, prefix: 'dopadopa.' })`. SoundManager: `storageKey: 'dopadopa.muted'`.
- `dopa-dopa-highscore` is read once and never written or removed.
- Feel: gravity 1500, jump velocity -600, start speed 300, logical height 600, ground line y 500.
- Aspect clamp 0.5 to 2.0; visible world width = 600 × clamped aspect.
- `prefers-reduced-motion: reduce`: no screen shake, particle counts halved, no confetti.
- Copy: plain words, no em dashes, no emoji, no exclamation-heavy UI text. Commits: short imperative subject, no trailers.
- Tests run only through `bash /Users/arnelirobles/repos/lean-agent-test-phase/bin/heavy.sh node <cmd>`, one run at a time. Implementer subagents write tests and code and do not run Playwright; the controller runs every "Run" step.

## Rulings made while planning

- The feedback plugin has no screen shake. Shake is done in the scene (a decaying canvas offset), feedback-effects does the "Faster" text and milestone confetti. Spec goal 4 is met by the pair.
- The retro theme names "Press Start 2P", a web font. The game registers `dopadopa-retro` = retro with `--dopamine-font` set to `ui-monospace, Menlo, Consolas, monospace`, so no font is fetched.
- WebGL particles draw on their own overlay canvas in CSS pixels, so `fx/particles.js` converts world to screen coordinates.
- Feedback adds GameObjects to the current scene, so the scene calls `super.update(dt)` and `super.render(ctx)` after its own work, with the world transform applied.
- Chicken x = clamp(width × 0.2, 60, 200), so a portrait phone still sees ahead.
- A jump pressed up to 0.1 s before landing is buffered and fires on landing.
- Game over takes Space, Enter or a tap to restart after a 600 ms guard, like Bird Flight's over guard.
- Leaderboard is copied from Bird Flight with 10 entries instead of 5, per the spec.

## Review Focus

1. Resize or rotate mid-run: obstacles keep their world x, the chicken x moves with the new width, the run continues. Test in Task 2.
2. Holding Space: key repeat must not jump repeatedly or restart from the over screen. Test in Task 6 (`input.test.js`) and Task 7.
3. Tab hidden at the exact moment of a crash: the over screen wins, no pause overlay on top of it. Test in Task 7.
4. localStorage throwing (private mode, quota): the game boots, plays and shows game over. Test in Task 7.
5. A frame gap of seconds (tab switch without visibilitychange, debugger): the scene catches up at most 5 steps, no tunnelling through an obstacle. Test in Task 5.

---

### Task 1: Tooling and rules

**Files:**
- Delete: `src/main.js`, `src/components/` (all four files)
- Modify: `package.json`, `vite.config.js`, `README.md` (drop emoji and checkmark lists, describe the new layout and `npm test`)
- Create: `vitest.config.js`, `playwright.config.js`, `.gitignore`, `src/game/rules.js`, `src/game/random.js`, `tests/unit/rules.test.js`

**Interfaces:**
- Produces:
  - `RULES` with `height: 600, groundY: 500, gravity: 1500, jumpVelocity: -600, chickenRadius: 15, chickenHalfHeight: 20, jumpBuffer: 0.1, startSpeed: 300, maxSpeed: 520, speedPerPoint: 8, startInterval: 1.5, minInterval: 1.0, intervalPerPoint: 1 / 60, gapJitter: 0.3, firstGap: 450, minAspect: 0.5, maxAspect: 2.0`
  - `OBSTACLES = { rock: { w: [30, 50], h: [25, 40] }, crate: { w: [45, 45], h: [45, 45] }, bush: { w: [50, 50], h: [35, 35] } }`
  - `speedFor(score): number` = min(maxSpeed, startSpeed + speedPerPoint × score)
  - `intervalFor(score): number` = max(minInterval, startInterval − intervalPerPoint × score)
  - `gapFor(score, r = 0): number` = speedFor × intervalFor × (1 + gapJitter × r), r in [0, 1)
  - `airtime(): number`, `jumpHeight(): number` from gravity and jump velocity
  - `isFasterAt(score): boolean`, true when score > 0, score % 10 === 0 and speedFor(score) > speedFor(score − 10)
  - `viewWidth(aspect): number` = height × clamp(aspect, minAspect, maxAspect)
  - `chickenX(width): number` = clamp(width × 0.2, 60, 200)
  - `obstacleSize(type, r1, r2): { w, h }` linear in each range
  - `random.js`: `seeded(seed): () => number`, copied from Bird Flight

- [ ] **Step 1: Set up tooling.** `package.json` scripts `dev`, `build`, `preview`, `test: vitest run`, `e2e: playwright test`; versions from Tech Stack; `"version": "2.0.0"`. Configs as Bird Flight's, with Playwright projects `pixel7` (`devices['Pixel 7']`) and `desktop` (`devices['Desktop Chrome']`, viewport 1366×800), preview port 4174. `.gitignore`: `node_modules/`, `dist/`, `test-results/`, `playwright-report/`, `.DS_Store`. Run `npm install` to regenerate the lockfile.

- [ ] **Step 2: Write the failing tests** in `tests/unit/rules.test.js`:

```js
it('starts at the old feel', () => {
  expect(speedFor(0)).toBe(300);
  expect(airtime()).toBeCloseTo(0.8, 6);
  expect(jumpHeight()).toBeCloseTo(120, 6);
});
it('speed rises with score to a cap and never falls', () => {
  for (let s = 1; s <= 300; s++) expect(speedFor(s)).toBeGreaterThanOrEqual(speedFor(s - 1));
  expect(speedFor(1000)).toBe(520);
  expect(speedFor(10)).toBeGreaterThan(speedFor(0));
});
it('every gap is clearable at every score', () => {
  const widest = Math.max(...Object.values(OBSTACLES).map((o) => o.w[1]));
  for (let s = 0; s <= 300; s++) {
    expect(gapFor(s, 0)).toBeGreaterThan(speedFor(s) * airtime() + widest + 2 * RULES.chickenRadius);
  }
});
it('a jump clears the tallest obstacle', () => {
  const tallest = Math.max(...Object.values(OBSTACLES).map((o) => o.h[1]));
  expect(jumpHeight()).toBeGreaterThan(tallest + RULES.chickenRadius);
});
it('calls out faster only while speed is still rising', () => {
  expect([5, 10, 20, 30, 40].map(isFasterAt)).toEqual([false, true, true, true, false]);
});
it('clamps the aspect', () => {
  expect(viewWidth(0.3)).toBe(300);
  expect(viewWidth(1)).toBe(600);
  expect(viewWidth(3)).toBe(1200);
});
it('keeps the chicken on screen', () => {
  expect(chickenX(300)).toBe(60);
  expect(chickenX(600)).toBe(120);
  expect(chickenX(1200)).toBe(200);
});
```

- [ ] **Step 3: Run to see them fail.** `bash ~/repos/lean-agent-test-phase/bin/heavy.sh node npx vitest run tests/unit/rules.test.js`. Expected: FAIL, module not found.
- [ ] **Step 4: Implement `rules.js` and `random.js`.**
- [ ] **Step 5: Run.** Same command. Expected: PASS.
- [ ] **Step 6: Commit** `rebuild on vite 8 and pin the dopaminejs packages, with tested rules`.

### Task 2: World

**Files:**
- Create: `src/game/world.js`, `tests/unit/world.test.js`

**Interfaces:**
- Consumes: Task 1 `RULES`, `OBSTACLES`, `speedFor`, `gapFor`, `isFasterAt`, `chickenX`, `obstacleSize`, `seeded`.
- Produces:
  - `createWorld({ width, seed }): World` where `World = { phase: 'ready' | 'playing' | 'over', width, score, speed, distance, nextSpawnAt, chicken: { x, y, vy, grounded, run }, obstacles: [{ type, x, w, h, passed }], buffer, rand }`. Chicken starts grounded at y = groundY − chickenHalfHeight. `nextSpawnAt = RULES.firstGap`.
  - `step(world, dt, input: { jump: boolean }): Events` with `Events = { started, jumped, landed, scored, faster, crashed }`, all booleans.
  - `resize(world, width): void` sets `width` and `chicken.x = chickenX(width)`; obstacles untouched.

Behaviour `step` must have: `over` returns all false. In `ready`, a jump sets `playing`, `started` and jumps. Speed = `speedFor(score)`. Distance grows by speed × dt; when `distance >= nextSpawnAt` an obstacle (type and size from `rand`) spawns at `x = width + w / 2 + 10` and `nextSpawnAt += gapFor(score, rand())`. Obstacles move left by speed × dt and drop once `x + w / 2 < -50`. Jump only when grounded, otherwise buffer for `jumpBuffer` seconds and fire on landing. Score once when an obstacle's right edge passes `chicken.x − chickenRadius`. Collision: the chicken's box (radius 15 each side) against the obstacle box from `x − w/2` to `x + w/2`, `groundY − h` to `groundY`; a hit sets `over` and `crashed`.

- [ ] **Step 1: Write the failing tests:**
  - `ready ignores time and starts on a jump`: 60 steps with no input leave `phase === 'ready'` and no obstacles; one step with `{ jump: true }` gives `started` and `jumped`, `phase === 'playing'`, `vy < 0`.
  - `a jump peaks near 120 and lands after about 0.8 s`: step at 1/60 after a jump, track min y; `groundY − 20 − minY` within 2 of 120; `landed` arrives between step 46 and 50.
  - `no double jump, but a jump just before landing is buffered`: a jump mid-air does nothing; a jump 3 steps before landing gives `jumped` on the landing step.
  - `scores once per obstacle`: put one crate behind the chicken's x, step, `scored` once and `score === 1`; more steps, still 1.
  - `each obstacle type crashes a grounded chicken`: for each type, place it at `chicken.x` and step; `crashed`, `phase === 'over'`.
  - `jumping over an obstacle at top speed is safe`: score 40, obstacle spawned at the right edge, jump when its left edge is `speed × airtime / 2 + w / 2` ahead; no crash and one point.
  - `spacing is world distance, not screen width`: two worlds, width 300 and 1200, same seed, run 600 steps with jumps every time `grounded` and an obstacle is within 120 of the chicken; the x gaps between consecutive obstacles are the same in both.
  - `speed follows score`: set score 10, step, `world.speed === speedFor(10)` and `faster` is true on the step that reaches 10.
  - `resize keeps the run`: mid-run `resize(world, 900)`, obstacle x values unchanged, `chicken.x === chickenX(900)`, `phase === 'playing'`.
  - `the same seed gives the same run`: two worlds with seed 7 and the same inputs end with equal `obstacles` and `score`.
- [ ] **Step 2: Run to see them fail.** `heavy.sh node npx vitest run tests/unit/world.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement `world.js`.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `pure world for the chicken run`.

### Task 3: Storage, leaderboard and migration

**Files:**
- Create: `src/platform/storage.js`, `src/leaderboard.js`, `src/migrate.js`, `tests/unit/leaderboard.test.js`, `tests/unit/migrate.test.js`

**Interfaces:**
- Produces:
  - `storage.js`: `guardedLocalStorage(): { getItem, setItem, removeItem }` (sync, in-memory fallback on throw, as Bird Flight `main.js:49`), and `asyncStore(sync): { getItem, setItem, removeItem }` returning promises over it.
  - `leaderboard.js`: as Bird Flight, `LEADERBOARD_KEY = 'dopadopa.leaderboard'`, `MAX_ENTRIES = 10`, `addScore(entries, name, score, now): { entries, run }`, `sanitize(value): Entry[]`.
  - `migrate.js`: `LEGACY_KEY = 'dopa-dopa-highscore'`, `MIGRATED_KEY = 'dopadopa.migrated'`, `migrateLegacy({ legacy, store }): Promise<number>` returns the legacy best (0 if none, non-numeric or negative) and sets `MIGRATED_KEY = '1'`; a second call returns 0 and reads nothing. It never writes or removes `LEGACY_KEY`.

- [ ] **Step 1: Write the failing tests.** Leaderboard: Bird Flight's `tests/unit/leaderboard.test.js` cases with the limit at 10 (11 distinct names keep the top 10; blank name becomes `Player`; names cut to 16; one entry per name, case-insensitive, best kept; junk input gives `[]`). Migration: `'37'` returns 37 and sets the flag; legacy left as `'37'`; second call returns 0; `'abc'`, `'-5'` and missing return 0; a `legacy.getItem` that throws returns 0 and still sets the flag.
- [ ] **Step 2: Run to see them fail.** Expected: FAIL.
- [ ] **Step 3: Implement the three files.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `keep scores under dopadopa keys and carry the old best over`.

### Task 4: Progression

**Files:**
- Create: `src/progression/achievements.js`, `src/progression/rewards.js`, `tests/unit/progression.test.js`

**Interfaces:**
- Consumes: Task 3 `asyncStore`.
- Produces:
  - `GAME = 'dopaDopa'`
  - `ACHIEVEMENTS` with ids and names: `first_run` "First run" (totalGamesPlayed ≥ 1), `dd_score_10` "Ten clear", `dd_score_25` "Twenty-five clear", `dd_score_50` "Fifty clear", `dd_score_100` "Hundred clear" (result.score ≥ n), `streak_3` "Three days running", `streak_7` "Seven days running", `dd_total_250` "Long road" (stats[GAME].totalScore ≥ 250). XP 10, 20, 40, 80, 160, 30, 70, 100. Icons: inline SVG strings, as Bird Flight `icons.js`, no emoji.
  - `createRewards(store, { legacyBest }): Promise<RewardSystem>` with `new DataService({ storage: store, prefix: 'dopadopa.' })`. When `legacyBest > (stats[GAME]?.highScore ?? 0)`, set the high score to it and save, without counting a game.
  - `recordRun(rewards, score)` as Bird Flight, `{ score, totalScore }`.

- [ ] **Step 1: Write the failing tests:** a run of 10 unlocks `first_run` and `dd_score_10` only; 9 does not unlock `dd_score_10`; three runs of 90 unlock `dd_total_250`; `legacyBest: 37` gives highScore 37 with `totalGamesPlayed === 0`; `legacyBest: 5` under a saved 20 leaves 20; saved keys all start with `dopadopa.`.
- [ ] **Step 2: Run to see them fail.** Expected: FAIL.
- [ ] **Step 3: Implement.** Read the RewardSystem save shape in `node_modules/dopaminejs/src` to set the high score; if there is no public way, write it through `player.stats` and the system's save method, and note which in the report.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `dopa-dopa achievements on the dopaminejs reward system`.

### Task 5: Scene, drawing and effects

**Files:**
- Create: `src/game/scene.js`, `src/game/draw.js`, `src/fx/particles.js`, `src/fx/feedback.js`, `src/fx/shake.js`, `tests/unit/scene.test.js`, `tests/unit/shake.test.js`

**Interfaces:**
- Consumes: Task 2 `step`, `World`, `Events`.
- Produces:
  - `RunScene extends Scene`, `new RunScene({ world, onEvents, view })` where `view = { scale, offsetX, offsetY, dpr }` maps world to CSS pixels. Methods as Bird Flight `FlightScene`: `setWorld`, `jump()`, `pause()`, `resume()`, `paused`, `alpha`, `snap()`. `FIXED_DT = 1 / 60`, `MAX_STEPS = 5`. `update(dt)` also calls `super.update(dt)`; `render(ctx)` draws the world, then sets the world transform (dpr × scale, offset, plus shake) and calls `super.render(ctx)`.
  - `draw.js`: `drawWorld(ctx, world, alpha, time, prevY, view)`. Sky, clouds, barn silhouette, ground, rocks, crates, bushes and the chicken in the current art (old `src/main.js` render methods, kept in git history at `main`), letterbox bars outside the view.
  - `shake.js`: `createShake({ reduced }): { kick(strength), offset(dt): { x, y } }`. Decays to 0 within 0.3 s; `reduced` always gives `{ x: 0, y: 0 }`.
  - `particles.js`: `createParticles(kernel, view, { reduced }): { dust(x, y), burst(x, y, color), landing(x, y) }` in world coordinates; a no-op object when `kernel.systems.get('particles')` is missing. Counts halved when `reduced`.
  - `feedback.js`: `createFeedback(kernel, { reduced }): { faster(x, y), milestone(x, y), oops(x, y) }` over `kernel.systems.get('feedback').trigger`; `text` overrides "Faster", "Ten more", "Caught"; `reduced` passes `{ count: 0 }` so no confetti. No-op when the system is missing.

- [ ] **Step 1: Write the failing tests** (`scene.test.js`, set up as Bird Flight's with a fake kernel and `EventBus`):
  - `same run at 60 Hz and 120 Hz`: two scenes, seed 3, jump on the same simulated times, 3 s of frames at 1/60 and 1/120; equal `world.score`, `chicken.y` and obstacle x values.
  - `a long frame catches up 5 steps at most`: one `frame(2)` advances `world.distance` by at most 5 × speed / 60.
  - `paused means no steps, and a jump queued while paused is dropped`.
  - `objects added to the scene update and render`: add a GameObject with a component that counts calls; after one frame and one render both are 1.
  - `shake.test.js`: kick then 0.3 s of `offset` reaches `{0, 0}`; reduced is always zero.
- [ ] **Step 2: Run to see them fail.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `fixed-step scene with interpolated drawing and guarded effects`.

### Task 6: Screens, input and boot

**Files:**
- Create: `src/main.js`, `src/ui/screens.js`, `src/ui/input.js`, `src/ui/styles.css`, `src/theme.js`, `tests/unit/input.test.js`
- Modify: `index.html` (full rewrite: `<canvas id="game">`, `<div id="ui">`, viewport meta with `viewport-fit=cover`, no external links)

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `input.js`: `shouldAct(event, mode): boolean`. True for `pointerdown` and for `keydown` with `code` `Space` or `Enter` and `repeat === false`, when the target is not inside `button, input, a, [data-ui]` (an `Enter` inside `#player-name` is handled by the form instead).
  - `screens.js`: as Bird Flight `screens.js`, element ids `#screen-start`, `#player-name`, `#screen-over`, `#final-score`, `#best-score`, `#board`, `#screen-paused`, `#hud-score`, `#mute`. Start card copy: title "Dopa-Dopa", line "Tap, click, Space or Enter to jump.", button "Start". Over: "Caught", score, best, "New best" only when the run beats the old best, leaderboard, button "Run again". Paused: "Paused", "Tap to keep running".
  - `theme.js`: `applyTheme(themeEngine)` registers and sets `dopadopa-retro` (ruling above).
  - `main.js` boot order: theme, storage, `migrateLegacy`, rewards with `legacyBest`, leaderboard and name, `Game` on `#game`, `kernel.plugins.use(WebGLParticlePlugin)` and `use(FeedbackPlugin)` each in its own try, `GameUI` and `SoundManager({ storage, storageKey: 'dopadopa.muted' })`, scene, then `game.start()`. `fit()` on resize sets `view` from `viewWidth(innerWidth / innerHeight)` and calls `resize(world, width)`. `visibilitychange` hidden while playing pauses; resume on `shouldAct`. Modes `menu`, `playing`, `over`; on the start screen and after the 600 ms over guard, `shouldAct` starts a run. Milestones every 10 points: `feedback.milestone`, `sound.playSuccess`. Level up and achievements as Bird Flight. Test hook `window.__dd = { world, scene }` under `import.meta.env.DEV` or `?test=1`.
- [ ] **Step 1: Write the failing test** `input.test.js`: pointerdown on the canvas is true; Space and Enter are true; Space with `repeat: true` is false; ArrowUp is false; a pointerdown on a button or inside `[data-ui]` is false; Enter inside `#player-name` is false.
- [ ] **Step 2: Run to see it fail.** Expected: FAIL.
- [ ] **Step 3: Implement.** Styles: full-viewport canvas, no card frame, cards and buttons from the theme variables, safe-area padding, `prefers-reduced-motion` turns off CSS transitions.
- [ ] **Step 4: Run** the unit suite, then `npm run build`. Expected: all unit tests PASS, build writes `dist/index.html`.
- [ ] **Step 5: Commit** `screens, input and boot for the rebuilt game`.

### Task 7: Browser tests

**Files:**
- Create: `tests/e2e/game.spec.js`

**Interfaces:**
- Consumes: Task 6 ids, copy and `window.__dd`.

- [ ] **Step 1: Write the tests**, each run on `pixel7` and `desktop`:
  - `Space starts and jumps`, `Enter starts`, `a tap on the canvas starts`: from the start screen, the HUD shows and `__dd.world.phase === 'playing'`.
  - `scores a point`: place a crate just behind the chicken through `__dd`, HUD reads `1`.
  - `crash shows the score and the board`: place a crate at the chicken; `#screen-over` visible, `#final-score` numeric, `#board` contains the name.
  - `held Space does not restart from the over screen`: crash, then `keyboard.down('Space')` for 1 s; over screen still visible.
  - `best and mute survive a reload`.
  - `the old best is carried over`: `localStorage['dopa-dopa-highscore'] = '37'` before load; start screen shows best 37; the key still reads `'37'`.
  - `hidden tab pauses and a tap resumes`: dispatch `visibilitychange` with `document.hidden` stubbed true; `#screen-paused` visible; tap; hidden.
  - `a crash while hidden shows the over screen, not pause`.
  - `boots and plays with storage that throws`: `addInitScript` that makes `localStorage.getItem` and `setItem` throw.
  - `fills the screen`: canvas box equals the viewport, no horizontal scroll, at 390×844, 844×390 and 1366×800.
  - `no console errors and no requests to other hosts`: collect `console` errors and every request URL; none off `localhost`.
- [ ] **Step 2: Run** `heavy.sh node npx playwright test`. Expected: all pass on both projects. Fix code, not tests, when a test shows a real bug.
- [ ] **Step 3: Commit** `browser tests at phone and desktop sizes`.

### Task 8: Deploy

**Files:** none in the repo beyond what is already committed.

- [ ] **Step 1: Build** `npm run build`.
- [ ] **Step 2: Back up and upload.**

```bash
ssh -i ~/.ssh/oracle_vm_key opc@140.245.103.105 'sudo cp -a /var/www/playground.baryo.dev/dopadopa /var/www/playground.baryo.dev/dopadopa.bak-20261019'
rsync -az --delete -e "ssh -i ~/.ssh/oracle_vm_key" --rsync-path="sudo rsync" dist/ opc@140.245.103.105:/var/www/playground.baryo.dev/dopadopa/
ssh -i ~/.ssh/oracle_vm_key opc@140.245.103.105 'sudo restorecon -R /var/www/playground.baryo.dev/dopadopa'
```

- [ ] **Step 3: Check live.** Playwright against `https://playground.baryo.dev/dopadopa/` at 390×844: start with a tap, jump, crash, over screen shows; no console errors; no request off `playground.baryo.dev`. Screenshot for Arnel.
- [ ] **Step 4: Rollback, only if Step 3 fails:** swap the `.bak-20261019` folder back with `sudo`, then `restorecon`.
- [ ] **Step 5:** Ask Arnel before pushing `rebuild` or opening a PR.
