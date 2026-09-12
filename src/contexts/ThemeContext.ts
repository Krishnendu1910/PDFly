import { createContext } from 'react';
import type { ThemeContextValue } from '@/types/theme';

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

