import {
  Layers,
  Scissors,
  ArrowUpDown,
  RotateCw,
  Images,
  Minimize2,
  FileImage,
} from 'lucide-react';
import type { ToolDefinition } from '@/types/tools';

export const TOOLS: readonly ToolDefinition[] = [
  {
    id: 'merge',
    slug: 'merge',
    name: 'Merge PDF',
    description: 'Combine multiple PDF documents into a single, cohesive file in your chosen order.',
    iconName: 'Layers',
    icon: Layers,
    category: 'organize',
    badge: 'Popular',
    popular: true,
  },
  {
    id: 'split',
    slug: 'split',
    name: 'Split PDF',
    description: 'Extract specific page ranges or split each page into standalone documents.',
    iconName: 'Scissors',
    icon: Scissors,
    category: 'organize',
    badge: 'Popular',
    popular: true,
  },
  {
    id: 'reorder',
    slug: 'reorder',
    name: 'Reorder PDF',
    description: 'Reorganize page flow, swap positions, and clean up multi-page documents.',
    iconName: 'ArrowUpDown',
    icon: ArrowUpDown,
    category: 'organize',
  },
  {
    id: 'rotate',
    slug: 'rotate',
    name: 'Rotate PDF',
    description: 'Fix page orientations permanently by rotating 90, 180, or 270 degrees.',
    iconName: 'RotateCw',
    icon: RotateCw,
    category: 'organize',
  },
  {
    id: 'images-to-pdf',
    slug: 'images-to-pdf',
    name: 'Images to PDF',
    description: 'Convert JPG, PNG, and WebP images into a standardized, shareable PDF document.',
    iconName: 'Images',
    icon: Images,
    category: 'convert',
    badge: 'Popular',
    popular: true,
  },
  {
    id: 'pdf-to-images',
    slug: 'pdf-to-images',
    name: 'PDF to Images',
    description: 'Render high-resolution PNG or JPG image extracts from any PDF document.',
    iconName: 'FileImage',
    icon: FileImage,
    category: 'convert',
  },
  {
    id: 'compress',
    slug: 'compress',
    name: 'Compress PDF',
    description: 'Reduce document file sizes to simplify sharing while preserving readability.',
    iconName: 'Minimize2',
    icon: Minimize2,
    category: 'optimize',
    badge: 'Popular',
    popular: true,
  },
] as const;

export const TOOL_MAP: Readonly<Record<string, ToolDefinition>> = TOOLS.reduce<
  Record<string, ToolDefinition>
>((acc, tool) => {
  acc[tool.slug] = tool;
  return acc;
}, {});
