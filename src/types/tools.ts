import type { LucideIcon } from 'lucide-react';

export type ToolId =
  | 'merge'
  | 'split'
  | 'reorder'
  | 'rotate'
  | 'images-to-pdf'
  | 'compress'
  | 'pdf-to-images'
  | 'remove-pages'
  | 'extract'
  | 'page-numbers'
  | 'watermark'
  | 'crop'
  | 'pdf-to-markdown'
  | 'sign';

export type ToolCategory = 'all' | 'organize' | 'convert' | 'optimize' | 'edit';

export interface ToolDefinition {
  id: ToolId;
  slug: string;
  name: string;
  description: string;
  iconName: string;
  icon: LucideIcon;
  category: 'organize' | 'convert' | 'optimize' | 'edit';
  badge?: string;
  popular?: boolean;
}
