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
};

const THEME_STYLES: Record<ToolColorFamily, Omit<ToolTheme, 'family' | 'badgeVariant'>> = {
  cobalt: {
    iconBg: 'bg-cobalt/10 text-cobalt dark:bg-cobalt/20 dark:text-cobalt',
    cardHoverBorder: 'group-hover:border-cobalt/40 dark:group-hover:border-cobalt/50',
    cardHoverText: 'group-hover:text-cobalt',
    accentBorder: 'border-cobalt/30',
  },
  vermillion: {
    iconBg: 'bg-vermillion/10 text-vermillion dark:bg-vermillion/20 dark:text-vermillion',
    cardHoverBorder: 'group-hover:border-vermillion/40 dark:group-hover:border-vermillion/50',
    cardHoverText: 'group-hover:text-vermillion',
    accentBorder: 'border-vermillion/30',
  },
  emerald: {
    iconBg: 'bg-emerald/10 text-emerald dark:bg-emerald/20 dark:text-emerald',
    cardHoverBorder: 'group-hover:border-emerald/40 dark:group-hover:border-emerald/50',
    cardHoverText: 'group-hover:text-emerald',
    accentBorder: 'border-emerald/30',
  },
  amber: {
    iconBg: 'bg-amber/10 text-amber dark:bg-amber/20 dark:text-amber',
    cardHoverBorder: 'group-hover:border-amber/40 dark:group-hover:border-amber/50',
    cardHoverText: 'group-hover:text-amber',
    accentBorder: 'border-amber/30',
  },
  violet: {
    iconBg: 'bg-violet/10 text-violet dark:bg-violet/20 dark:text-violet',
    cardHoverBorder: 'group-hover:border-violet/40 dark:group-hover:border-violet/50',
    cardHoverText: 'group-hover:text-violet',
    accentBorder: 'border-violet/30',
  },
  coral: {
    iconBg: 'bg-coral/10 text-coral dark:bg-coral/20 dark:text-coral',
    cardHoverBorder: 'group-hover:border-coral/40 dark:group-hover:border-coral/50',
    cardHoverText: 'group-hover:text-coral',
    accentBorder: 'border-coral/30',
  },
  teal: {
    iconBg: 'bg-teal/10 text-teal dark:bg-teal/20 dark:text-teal',
    cardHoverBorder: 'group-hover:border-teal/40 dark:group-hover:border-teal/50',
    cardHoverText: 'group-hover:text-teal',
    accentBorder: 'border-teal/30',
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

