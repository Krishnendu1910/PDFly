export type ToolColorFamily =
  | 'cobalt'
  | 'vermillion'
  | 'emerald'
  | 'amber'
  | 'violet'
  | 'coral'
  | 'teal';

export interface ToolTheme {
  family: ToolColorFamily;
  iconBg: string;
  cardHoverBorder: string;
  cardHoverText: string;
  accentBorder: string;
  badgeVariant: ToolColorFamily;
  accentBg: string;
}

const TOOL_FAMILY_MAP: Record<string, ToolColorFamily> = {
  merge: 'cobalt',
  split: 'vermillion',
  reorder: 'violet',
  rotate: 'amber',
  'remove-pages': 'vermillion',
  extract: 'teal',
  'images-to-pdf': 'coral',
  'pdf-to-images': 'teal',
  compress: 'emerald',
  'page-numbers': 'cobalt',
  watermark: 'violet',
  crop: 'amber',
  'pdf-to-markdown': 'teal',
  sign: 'violet',
  protect: 'emerald',
};

const THEME_STYLES: Record<ToolColorFamily, Omit<ToolTheme, 'family' | 'badgeVariant'>> = {
  cobalt: {
    iconBg: 'bg-cobalt/10 text-cobalt dark:bg-cobalt/20 dark:text-cobalt group-hover:bg-cobalt/15 dark:group-hover:bg-cobalt/25',
    cardHoverBorder: 'group-hover:border-zinc-300 dark:group-hover:border-zinc-700',
    cardHoverText: 'group-hover:text-foreground',
    accentBorder: 'border-cobalt/30',
    accentBg: 'bg-cobalt',
  },
  vermillion: {
    iconBg: 'bg-vermillion/10 text-vermillion dark:bg-vermillion/20 dark:text-vermillion group-hover:bg-vermillion/15 dark:group-hover:bg-vermillion/25',
    cardHoverBorder: 'group-hover:border-zinc-300 dark:group-hover:border-zinc-700',
    cardHoverText: 'group-hover:text-foreground',
    accentBorder: 'border-vermillion/30',
    accentBg: 'bg-vermillion',
  },
  emerald: {
    iconBg: 'bg-emerald/10 text-emerald dark:bg-emerald/20 dark:text-emerald group-hover:bg-emerald/15 dark:group-hover:bg-emerald/25',
    cardHoverBorder: 'group-hover:border-zinc-300 dark:group-hover:border-zinc-700',
    cardHoverText: 'group-hover:text-foreground',
    accentBorder: 'border-emerald/30',
    accentBg: 'bg-emerald',
  },
  amber: {
    iconBg: 'bg-amber/10 text-amber dark:bg-amber/20 dark:text-amber group-hover:bg-amber/15 dark:group-hover:bg-amber/25',
    cardHoverBorder: 'group-hover:border-zinc-300 dark:group-hover:border-zinc-700',
    cardHoverText: 'group-hover:text-foreground',
    accentBorder: 'border-amber/30',
    accentBg: 'bg-amber',
  },
  violet: {
    iconBg: 'bg-violet/10 text-violet dark:bg-violet/20 dark:text-violet group-hover:bg-violet/15 dark:group-hover:bg-violet/25',
    cardHoverBorder: 'group-hover:border-zinc-300 dark:group-hover:border-zinc-700',
    cardHoverText: 'group-hover:text-foreground',
    accentBorder: 'border-violet/30',
    accentBg: 'bg-violet',
  },
  coral: {
    iconBg: 'bg-coral/10 text-coral dark:bg-coral/20 dark:text-coral group-hover:bg-coral/15 dark:group-hover:bg-coral/25',
    cardHoverBorder: 'group-hover:border-zinc-300 dark:group-hover:border-zinc-700',
    cardHoverText: 'group-hover:text-foreground',
    accentBorder: 'border-coral/30',
    accentBg: 'bg-coral',
  },
  teal: {
    iconBg: 'bg-teal/10 text-teal dark:bg-teal/20 dark:text-teal group-hover:bg-teal/15 dark:group-hover:bg-teal/25',
    cardHoverBorder: 'group-hover:border-zinc-300 dark:group-hover:border-zinc-700',
    cardHoverText: 'group-hover:text-foreground',
    accentBorder: 'border-teal/30',
    accentBg: 'bg-teal',
  },
};

export function getToolTheme(toolIdOrSlug: string): ToolTheme {
  const family = TOOL_FAMILY_MAP[toolIdOrSlug] || 'cobalt';
  const styles = THEME_STYLES[family];

  return {
    family,
    badgeVariant: family,
    ...styles,
  };
}

