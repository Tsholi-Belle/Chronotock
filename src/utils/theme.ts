import { ThemeMode } from '../types';

let systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null;

export const applyTheme = (theme: ThemeMode): void => {
  const root = document.documentElement;

  // Clean up existing media query listener if any
  if (systemThemeListener && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.removeEventListener('change', systemThemeListener);
    systemThemeListener = null;
  }

  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else if (theme === 'system') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const isDark = mediaQuery.matches;
    
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    systemThemeListener = (e: MediaQueryListEvent) => {
      if (e.matches) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    };

    mediaQuery.addEventListener('change', systemThemeListener);
  }
};
