import type { PDFlyIcon } from '@/components/icons';

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
  | 'sign'
  | 'protect';

export type ToolCategory = 'all' | 'organize' | 'convert' | 'optimize' | 'edit' | 'security';

export interface ToolDefinition {
  id: ToolId;
  slug: string;
  name: string;
  description: string;
  shortDescription?: string;
  iconName: string;
  icon: PDFlyIcon;
  category: 'organize' | 'convert' | 'optimize' | 'edit' | 'security';
  badge?: string;
  popular?: boolean;
}
