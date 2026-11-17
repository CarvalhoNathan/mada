import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'mada-theme';
const THEME_COLORS: Record<Theme, string> = { dark: '#0A0A0C', light: '#F4F4F5' };

function readInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** Aplica o tema no <html> (data-theme) e sincroniza a cor da barra do navegador/PWA. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLORS[theme]);
}

/**
 * Tema claro/escuro persistido em localStorage.
 * O valor inicial é aplicado antes da renderização por um script inline em index.html
 * (evita o "flash" de tema errado ao abrir o app).
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // armazenamento indisponível (modo privado): mantém apenas em memória
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggleTheme };
}
