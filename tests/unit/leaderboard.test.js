import { describe, it, expect } from 'vitest';
import { addScore, sanitize, LEADERBOARD_KEY, MAX_ENTRIES } from '../../src/leaderboard.js';

describe('leaderboard', () => {
  it('uses the leaderboard key', () => {
    expect(LEADERBOARD_KEY).toBe('dopadopa.leaderboard');
    expect(MAX_ENTRIES).toBe(10);
  });

  it('keeps the best score per name, case-insensitive', () => {
    let { entries } = addScore([], 'Ana', 10, 1);
    ({ entries } = addScore(entries, 'ana', 7, 2));
    expect(entries).toHaveLength(1);
    expect(entries[0].score).toBe(10);
    ({ entries } = addScore(entries, 'ANA', 15, 3));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ score: 15, ts: 3 });
  });

  it('blank name becomes Player', () => {
    const { entries, run } = addScore([], '   ', 4, 1);
    expect(run.name).toBe('Player');
    expect(entries[0].name).toBe('Player');
  });

  it('top ten only', () => {
    let entries = [];
    for (let i = 1; i <= 11; i++) ({ entries } = addScore(entries, `p${i}`, i, i));
    expect(entries.map((e) => e.score)).toEqual([11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  });

  it('long names are cut at 16', () => {
    const { run } = addScore([], 'x'.repeat(40), 1, 1);
    expect(run.name).toHaveLength(16);
  });

  it('sanitize drops bad rows and non-arrays', () => {
    expect(sanitize(null)).toEqual([]);
    expect(sanitize('x')).toEqual([]);
    expect(
      sanitize([
        { name: 'Ana', score: 12, ts: 1 },
        { name: 5 },
        { name: 'Ben', score: 'x', ts: 1 },
        { name: 'Cy', score: -1, ts: 1 },
        { name: 'Di', score: Infinity, ts: 1 },
        { name: 'Ed', score: 1, ts: NaN },
        { name: 'Flo', score: 1, ts: Infinity },
        null,
      ]),
    ).toEqual([{ name: 'Ana', score: 12, ts: 1 }]);
  });

  it('sanitize applies the name rule, dedupes, sorts and caps at ten', () => {
    const rows = [
      { name: '  ana ', score: 3, ts: 1 },
      { name: 'ANA', score: 9, ts: 2 },
      { name: '  ', score: 5, ts: 3 },
      { name: 'x'.repeat(30), score: 4, ts: 4 },
      { name: 'b', score: 1, ts: 5 },
      { name: 'c', score: 2, ts: 6 },
      { name: 'd', score: 6, ts: 7 },
      ...Array.from({ length: 6 }, (_, i) => ({ name: `z${i}`, score: 0, ts: 8 + i })),
    ];
    const out = sanitize(rows);
    expect(out.map((e) => e.score)).toEqual([9, 6, 5, 4, 2, 1, 0, 0, 0, 0]);
    expect(out[0].name).toBe('ANA');
    expect(out[2].name).toBe('Player');
    expect(out[3].name).toHaveLength(16);
  });
});
