# Dopa-Dopa rebuild

## Why

Dopa-Dopa is the dopaminejs web game at https://playground.baryo.dev/dopadopa/, linked from
baryo.dev as "Play Dopa-Dopa". It is a one-commit prototype from January 2026 and it shows:

- Enter and tapping the canvas do not start a run, only the Start button does, though the
  screen says "press space to jump".
- The debug overlay (FPS, systems, plugins) is visible to players.
- The jump, crash and achievement sounds are hotlinked from mixkit and return 403, so the game
  is silent.
- The canvas is a fixed 800x600 box, so on a phone it is shrunk and the text is tiny.
- The difficulty curve announces "faster" every 30 seconds but obstacles never speed up:
  `Obstacle.speed` is fixed at `SCROLL_SPEED`.
- `src/components/*.js` duplicate classes that `main.js` defines again; only `main.js` runs.
- It registers the battle pass and leaderboard plugins and a stub rewards system, and uses none
  of them.
- No tests, `^` version ranges, on dopaminejs 2.0.

Bird Flight (`~/repos/SimpleMobileGames`) was rebuilt on dopaminejs 2.4 this week and is now
the reference for how a dopaminejs game is built here. Arnel wants Dopa-Dopa brought to the same
standard. It stays a web game on the playground.

Dopa-Dopa and Bird Flight are both dopaminejs showcases. Bird Flight shows the core. Dopa-Dopa
keeps showing the plugins, so between them baryo.dev shows the whole framework.

## Goals

1. Same game: a chicken runs along a farm road and jumps over rocks, crates and bushes. One
   input, jump. Score is obstacles cleared.
2. Built like Bird Flight: Vite, a small modular codebase, game rules as pure functions over
   plain state, stepped at a fixed 60 Hz timestep and drawn with interpolation.
3. dopaminejs 2.4.0 core drives progression and feel the way Bird Flight uses it:
   `RewardSystem` (XP, levels, achievements, daily streak, high score), `GameUI` for toasts and
   level-up, `SoundManager` with synthesized sounds (no audio files, no network).
4. The plugins that earn their place stay, on current versions:
   `dopaminejs-plugin-webgl-particles` (dust, landing, crash, milestone bursts),
   `dopaminejs-plugin-feedback-effects` (screen shake, "faster" callouts), and
   `dopaminejs-themes` (retro). Each has a fallback, so the game still runs if WebGL is not
   available.
5. Fills the screen on a phone and on a desktop, in portrait and landscape, without stretching.
6. Input: tap anywhere, click, Space or Enter jumps and starts a run. Buttons stay buttons.
7. A local leaderboard with player names, like Bird Flight.
8. Pause when the tab is hidden. A paused run resumes on tap.
9. Difficulty that actually ramps: speed and spawn gap change with score, pinned by tests.
10. Deployed to the same URL, `https://playground.baryo.dev/dopadopa/`.

## Non-goals

- A mobile app or Play Store listing. Web only.
- Farmers chasing the chicken, new obstacle types, power-ups or other new content.
- Online leaderboards, accounts or analytics beyond the Umami script the playground already
  serves, if it does.
- Changes to dopaminejs or its plugins, unless the rebuild finds a real bug. A bug goes to the
  dopaminejs repo as its own fix.

## Anti-goals

- Frame-rate-dependent physics. The jump must reach the same height at 60 Hz and 120 Hz.
- Losing a returning player's best score. The old `dopa-dopa-highscore` key is read once and
  carried into the new save.
- Any request to a third-party host at runtime. Sounds are synthesized, fonts are local or
  system.
- Plugins registered and not used.

## Constraints

- Repo `~/Documents/repos/dopa-dopa` (remote `BaryoDev/dopa-dopa`), branch off `main`.
- The built site is served from `/var/www/playground.baryo.dev/dopadopa/` (root-owned, nginx
  `location /dopadopa` alias). Vite `base: './'` stays so the build works under that path.
- Pinned dependency versions, no `^` ranges. Drop the packages that are no longer used:
  debug overlay, ecosystem, howler audio, sound packs, `howler`, and the unused `esbuild`
  dev dependency.
- Copy follows Arnel's writing rules: plain, no em dashes, no emoji in UI text, README or
  commits. The README drops its emoji and checkmark lists.
- Motion respects `prefers-reduced-motion`: no screen shake and fewer particles.
- Mobile-friendly by default.

## How it is built

### Code layout (mirrors Bird Flight)

```
src/
  main.js            boot: storage, rewards, plugins, then the game
  game/
    rules.js         pure: gravity, jump, speed and spawn curve, obstacle sizes, collision
    world.js         pure: chicken, obstacles, score as plain state, step(world, dt, input)
    scene.js         dopaminejs Scene: fixed step, interpolated draw, events to sound/fx
    draw.js          canvas drawing of chicken, obstacles, ground, sky
  fx/                particles and feedback, each behind a no-op fallback
  ui/                start screen, HUD, pause, game over, leaderboard (DOM)
  progression/       achievements and XP rules for Dopa-Dopa
  leaderboard.js
  migrate.js         one-time import of dopa-dopa-highscore
index.html
```

The world is in logical units with a fixed ground line; the canvas scales to the viewport with
device pixel ratio, and the visible width changes rather than the physics.

### Versions

Checked on npm on 2026-10-19, all with a `dopaminejs` peer range that includes 2.4.0:
`dopaminejs` 2.4.0, `dopaminejs-plugin-webgl-particles` 1.1.2,
`dopaminejs-plugin-feedback-effects` 1.0.2, `dopaminejs-themes` 1.0.2. Pin those, plus Vite,
Vitest and Playwright at the versions Bird Flight pins.

### Storage

Web only, so a guarded localStorage wrapper (Bird Flight's `guardedLocalStorage` pattern with an
in-memory fallback), not Capacitor. The playground origin is shared with other apps, so every
new key is prefixed `dopadopa.` and the RewardSystem save uses its own key. `dopa-dopa-highscore`
is read once into the new save and left in place.

### Feel and difficulty

- The first run feels like today: gravity 1500, jump velocity -600, start speed 300 px/s, in
  logical units.
- Speed rises with score to a cap, and the spawn gap shrinks to a floor. Tests pin that every
  spawn gap is clearable at the capped speed: the distance between obstacles is always more
  than the ground distance a full jump covers plus the widest obstacle.

### Screen

- The page is the game: the canvas fills the viewport, no rounded card. The world has a fixed
  logical height; the visible width follows the screen's aspect, clamped between 0.5 and 2.0,
  with letterboxing outside that.
- Obstacles spawn just past the right edge of the visible world, and spacing is in world
  distance, so a wide screen sees further ahead without changing the gaps.
- Rotating mid-run keeps the run going.

### Leaderboard and progression

- Copied from Bird Flight: the name is entered once on the start screen, optional, default
  "Player", up to 16 characters. Top 10 entries.
- Achievements: first run, 10, 25, 50 and 100 obstacles cleared in a run, a 3-day and a 7-day
  streak, 250 obstacles in total.

### Theme

`dopaminejs-themes` retro sets the DOM UI tokens (colours, font, button style) for the screens,
HUD and toasts. The canvas art (chicken, obstacles, ground, sky) stays in its current style,
redrawn at device pixel ratio so it is sharp.

### Tests

- Vitest over `rules.js`, `world.js`, `migrate.js` and the progression config: jump height and
  airtime, landing, scoring once per obstacle, collision for each obstacle type, the difficulty
  curve, the fixed step giving the same result whatever the frame rate, and migration of the
  old high score.
- Playwright against the built site at a phone and a desktop size: start with Space, Enter and
  a tap; jump; score; crash; game over shows the score; best score and mute survive a reload;
  no console errors and no requests to other hosts.

### Deploy

`npm run build`, then rsync `dist/` to the VM into `/var/www/playground.baryo.dev/dopadopa/`
with sudo, keeping a backup of the current folder. Check the live URL on a phone size after.
Rollback is restoring the backup.

## Decided by Arnel

- Dopa-Dopa stays a web game on the playground.
- Rebuild it to the same standard as Bird Flight.
- Keep the plugins that are used (particles, feedback, themes) so it stays the plugin showcase.

## Builder's calls (Claude)

- Which plugins stay and which go (above).
- Synthesized sounds instead of audio files.
- The code layout, the fixed timestep, the leaderboard and pause, mirroring Bird Flight.
- Fixing the difficulty curve so speed really increases.
- Migrating `dopa-dopa-highscore`.
- Same URL, deploy by rsync with a backup.
- The storage prefix, the feel numbers, the aspect clamp, the achievement list, and the
  leaderboard rules copied from Bird Flight.
- Playwright runs locally, not in CI.
