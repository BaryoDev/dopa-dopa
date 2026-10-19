# Dopa-Dopa

A chicken runs along a farm road and jumps over rocks, crates and bushes. One input, jump. Your
score is how many obstacles you clear.

Play it at https://playground.baryo.dev/dopadopa/.

It is a showcase for [dopaminejs](https://github.com/BaryoDev/dopaminejs). The core runs the game
loop, XP, levels, daily streak, achievements and the synthesized sound. Three plugins add WebGL
particles, feedback text and confetti, and the retro theme.

## Controls

Tap, click, Space or Enter to start and to jump. The run pauses when the tab is hidden.

## Code

```
src/
  main.js            boot: theme, storage, rewards, plugins, then the game
  game/rules.js      pure: physics numbers and the difficulty curve
  game/world.js      pure: step(world, dt, input) returns events
  game/scene.js      fixed 1/60 s step, interpolated drawing
  game/draw.js       canvas art
  fx/                particles, feedback and shake, each with a no-op fallback
  ui/                start, HUD, pause, game over, leaderboard
  progression/       achievements and the reward system
  leaderboard.js
  migrate.js         carries the old best score over
```

## Develop

```bash
npm install
npm run dev
npm test          # unit tests
npx playwright install chromium   # once, for the browser tests
npm run e2e       # browser tests at phone and desktop sizes
npm run build     # static site in dist/
```

MIT licence.
