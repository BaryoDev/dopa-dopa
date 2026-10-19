import { Themes } from 'dopaminejs-themes';

export const THEME = 'dopadopa-retro';

/* The retro theme names a web font; a system monospace keeps the game off font hosts. */
export function applyTheme(themeEngine) {
  themeEngine.registerTheme(THEME, { ...Themes.retro, '--dopamine-font': 'ui-monospace, Menlo, Consolas, monospace' });
  themeEngine.setTheme(THEME);
}
