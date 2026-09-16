import type { FC } from 'react';
import { Sun, Moon } from '@/components/icons';
import { useTheme } from '@/hooks/useTheme';

export const ThemeToggle: FC = () => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400 transition-transform rotate-0 hover:rotate-45" aria-hidden="true" />
      ) : (
        <Moon className="w-5 h-5 text-slate-700 transition-transform rotate-0 hover:-rotate-12" aria-hidden="true" />
      )}
    </button>
  );
};
