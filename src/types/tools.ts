import type { LucideIcon } from 'lucide-react';

export type ToolId =
  | 'merge'
  | 'split'
  | 'reorder'
  | 'rotate'
  | 'images-to-pdf'
  | 'compress'
  | 'pdf-to-images';

export type ToolCategory = 'all' | 'organize' | 'convert' | 'optimize';

export interface ToolDefinition {
  id: ToolId;
  slug: string;
  name: string;
  description: string;
  iconName: string;
  icon: LucideIcon;
  category: 'organize' | 'convert' | 'optimize';
  badge?: string;
  popular?: boolean;
}
