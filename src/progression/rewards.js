import { RewardSystem, DataService } from 'dopaminejs';
import { ACHIEVEMENTS } from './achievements.js';

export const GAME = 'dopaDopa';

/* RewardSystem has no setter for a high score, so the carried-over best is written into
   player.stats directly. totalPlays stays as it was: an imported best is not a game played. */
export async function createRewards(store, { legacyBest = 0 } = {}) {
  const rewards = new RewardSystem(new DataService({ storage: store, prefix: 'dopadopa.' }), { achievements: ACHIEVEMENTS });
  await rewards.init();
  const stats = rewards.player.stats[GAME] ?? { totalPlays: 0, highScore: 0 };
  if (legacyBest > stats.highScore) {
    rewards.player.stats[GAME] = { ...stats, highScore: legacyBest };
    await rewards.save();
  }
  return rewards;
}

export async function recordRun(rewards, score) {
  const safe = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  // recordGame sums extra numeric keys per game, so totalScore keeps a running total for dd_total_250.
  return rewards.recordGame(GAME, { score: safe, totalScore: safe });
}
