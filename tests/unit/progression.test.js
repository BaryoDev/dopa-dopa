import { describe, it, expect } from 'vitest';
import { createRewards, recordRun, GAME } from '../../src/progression/rewards.js';
import { ACHIEVEMENTS } from '../../src/progression/achievements.js';
import { asyncStore } from '../../src/platform/storage.js';

function memory() {
  const data = new Map();
  const sync = {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
  return { data, store: asyncStore(sync) };
}

const ids = (rewards) => rewards.getUnlockedAchievements().map((a) => a.id);

describe('progression', () => {
  it('uses the dopaDopa game name', () => {
    expect(GAME).toBe('dopaDopa');
  });

  it('a run of 10 unlocks first run and ten clear only', async () => {
    const rewards = await createRewards(memory().store, { legacyBest: 0 });
    await recordRun(rewards, 10);
    expect(ids(rewards).sort()).toEqual(['dd_score_10', 'first_game']);
  });

  it('a run of 9 does not unlock ten clear', async () => {
    const rewards = await createRewards(memory().store, { legacyBest: 0 });
    await recordRun(rewards, 9);
    expect(ids(rewards)).toEqual(['first_game']);
  });

  it('three runs of 90 unlock long road', async () => {
    const rewards = await createRewards(memory().store, { legacyBest: 0 });
    await recordRun(rewards, 90);
    await recordRun(rewards, 90);
    expect(ids(rewards)).not.toContain('dd_total_250');
    await recordRun(rewards, 90);
    expect(ids(rewards)).toContain('dd_total_250');
  });

  it('the old best becomes the high score without counting a game', async () => {
    const { store } = memory();
    const rewards = await createRewards(store, { legacyBest: 37 });
    expect(rewards.player.stats[GAME].highScore).toBe(37);
    expect(rewards.player.totalGamesPlayed).toBe(0);
    const again = await createRewards(store, { legacyBest: 0 });
    expect(again.player.stats[GAME].highScore).toBe(37);
  });

  it('a lower old best leaves a saved high score alone', async () => {
    const { store } = memory();
    const first = await createRewards(store, { legacyBest: 0 });
    await recordRun(first, 20);
    const rewards = await createRewards(store, { legacyBest: 5 });
    expect(rewards.player.stats[GAME].highScore).toBe(20);
  });

  it('every saved key starts with dopadopa.', async () => {
    const { data, store } = memory();
    const rewards = await createRewards(store, { legacyBest: 3 });
    await recordRun(rewards, 12);
    expect(data.size).toBeGreaterThan(0);
    for (const key of data.keys()) expect(key.startsWith('dopadopa.'), key).toBe(true);
  });

  it('the achievement list, xp and svg icons', () => {
    expect(Object.fromEntries(Object.entries(ACHIEVEMENTS).map(([id, a]) => [id, [a.name, a.xp]]))).toEqual({
      first_game: ['First run', 10],
      dd_score_10: ['Ten clear', 20],
      dd_score_25: ['Twenty-five clear', 40],
      dd_score_50: ['Fifty clear', 80],
      dd_score_100: ['Hundred clear', 160],
      streak_3: ['Three days running', 30],
      streak_7: ['Seven days running', 70],
      dd_total_250: ['Long road', 100],
    });
    for (const [id, a] of Object.entries(ACHIEVEMENTS)) {
      expect(a.icon.startsWith('<svg'), id).toBe(true);
      expect(/\p{Extended_Pictographic}/u.test(a.icon + a.name + a.description), id).toBe(false);
    }
  });

  it('a bad score never throws and never lowers the total', async () => {
    const rewards = await createRewards(memory().store, { legacyBest: 0 });
    await recordRun(rewards, 10);
    for (const bad of [NaN, Infinity, -5]) await recordRun(rewards, bad);
    expect(rewards.player.stats[GAME].totalScore).toBe(10);
  });
});
