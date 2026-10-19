import { ICONS } from './icons.js';

const scoreAtLeast = (n) => (player, gameName, result) => Boolean(result) && result.score >= n;

export const ACHIEVEMENTS = {
  first_game: {
    name: 'First run',
    description: 'Finish your first run',
    icon: ICONS.first_game,
    xp: 10,
    check: (player) => player.totalGamesPlayed >= 1,
  },
  dd_score_10: {
    name: 'Ten clear',
    description: 'Clear 10 obstacles in one run',
    icon: ICONS.dd_score_10,
    xp: 20,
    check: scoreAtLeast(10),
  },
  dd_score_25: {
    name: 'Twenty-five clear',
    description: 'Clear 25 obstacles in one run',
    icon: ICONS.dd_score_25,
    xp: 40,
    check: scoreAtLeast(25),
  },
  dd_score_50: {
    name: 'Fifty clear',
    description: 'Clear 50 obstacles in one run',
    icon: ICONS.dd_score_50,
    xp: 80,
    check: scoreAtLeast(50),
  },
  dd_score_100: {
    name: 'Hundred clear',
    description: 'Clear 100 obstacles in one run',
    icon: ICONS.dd_score_100,
    xp: 160,
    check: scoreAtLeast(100),
  },
  streak_3: {
    name: 'Three days running',
    description: 'Play 3 days in a row',
    icon: ICONS.streak_3,
    xp: 30,
    check: (player) => player.streak.current >= 3,
  },
  streak_7: {
    name: 'Seven days running',
    description: 'Play 7 days in a row',
    icon: ICONS.streak_7,
    xp: 70,
    check: (player) => player.streak.current >= 7,
  },
  dd_total_250: {
    name: 'Long road',
    description: 'Clear 250 obstacles across all runs',
    icon: ICONS.dd_total_250,
    xp: 100,
    check: (player) => (player.stats?.dopaDopa?.totalScore ?? 0) >= 250,
  },
};
