# Dopa-Dopa art direction

## Why

Arnel asked for Dopa-Dopa's look and feel to get the same care Bird Flight got this week, in its
own style rather than a copy, and with every plugin it loads doing visible work. The rebuild fixed
how it plays; it still looks like the January prototype: a dark night sky, a flat brown road, and
square retro cards in a monospace font.

## Style: sticker-book farm

Bird Flight is soft and outline-free. Dopa-Dopa goes the other way: every shape on the canvas is a
flat fill with a thick rounded outline in a dark tint of the phase, like a sticker, and things on
the road cast a hard offset shadow. Cards are cream stickers with a thick border, 20px corners and
a hard offset shadow, in a rounded system font (`ui-rounded`, then system sans).

## What changes

- **Time of day follows the score.** Morning from 0, day from 10, sunset from 25, night from 50,
  the same floors as Bird Flight. The sky, hills, road and obstacles change palette, blended over
  1.5 seconds. Reduced motion snaps instead of blending.
- **Farm scenery in parallax.** Far hills, mid hills and a near row of trees and fence posts,
  painted once per palette into offscreen canvases and scrolled at 0.1, 0.3 and 0.6 of the run
  speed. A sun by day, a moon with craters and twinkling stars at night, drifting clouds, a barn
  on the mid layer.
- **A road with depth.** A grass lip with a highlight, a dirt road with scrolling ruts.
- **Sticker obstacles.** Crate, rock and bush with a thick outline, a light face and a highlight,
  tinted by the phase.
- **A chunkier chicken.** Round body with a belly, a big eye with a highlight, a red comb and
  wattle, a wing that flaps in the air, running legs on the ground, X eyes when caught.
- **Sticker cards.** Cream by morning, sky by day, peach at sunset, ink at night. Pill buttons with
  a press shadow. Cards pop in with a small tilt.
- **Medals on the Caught card.** Bronze 10, silver 25, gold 50, platinum 100, as SVG.
- **A "Tap to jump" hint** while a run has no score yet.
- **The name is prefilled** from the newest leaderboard entry when no name is saved.

## Every plugin does visible work

- `dopaminejs-themes` registers one theme per phase (`dopadopa-morning`, `dopadopa-day`,
  `dopadopa-sunset`, `dopadopa-night`) and the game switches theme when the phase changes. The
  cards, HUD and toasts read only `--dopamine-*` tokens, so the UI recolours with the sky.
- `dopaminejs-plugin-webgl-particles`: dust while running, a feather puff on every jump, a
  landing puff, confetti at every 10, a feather burst when caught. The overlay sits under the
  cards so it never covers the Caught card.
- `dopaminejs-plugin-feedback-effects`: screen shake on a crash, "Faster" and milestone callouts,
  a "Close one" callout when the chicken clears an obstacle by a hair, a level-up callout.

## Constraints

- 60 fps on a mid phone: no allocation per frame, scenery painted only on a resize or a phase
  change.
- The drawing never writes to the world.
- Copy stays plain, no exclamation marks.
- Same input, rules, storage and tests as the rebuild. Existing e2e tests keep passing.

## Tests

- Unit: `phaseFor` floors and bad input, `skyAt` endpoints, midpoint and clamping, `medalFor`
  floors, `themeFor` mapping every phase to a registered theme.
- e2e: the phase on `<html>` follows the score, a medal shows at 10 and none below, the name is
  prefilled from the newest board entry.

## Builder's calls (Claude)

The sticker style, the farm scenery, the per-phase themes, the chicken redesign, the new
particle and callout moments, and reusing Bird Flight's phase and medal floors.
