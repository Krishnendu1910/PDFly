import { useContext } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';
import type { ThemeContextValue } from '@/types/theme';

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

