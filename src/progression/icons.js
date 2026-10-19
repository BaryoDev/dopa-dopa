const svg = (body, fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ${
    fill ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
  } aria-hidden="true">${body}</svg>`;

const digits = (text) =>
  svg(`<text x="12" y="16" text-anchor="middle" textLength="${text.length * 4.5}" lengthAdjust="spacingAndGlyphs" font-size="9" font-weight="700" font-family="sans-serif">${text}</text><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>`, true);

export const ICONS = {
  first_game: svg('<path d="M4 18c2-6 6-9 10-9h4M14 5l4 4-4 4"/><path d="M3 21h18"/>'),
  dd_score_10: digits('10'),
  dd_score_25: digits('25'),
  dd_score_50: digits('50'),
  dd_score_100: digits('100'),
  streak_3: svg('<path d="M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z"/>'),
  streak_7: svg('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
  dd_total_250: svg('<path d="M3 20h18M6 20l3-16M18 20l-3-16M12 6v2M12 11v2M12 16v2"/>'),
};
