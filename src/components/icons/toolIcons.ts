import { createElement } from 'react';
import {
  Files,
  Scissors,
  ArrowsDownUp,
  ArrowsClockwise,
  FileMinus,
  Export,
  FileImage,
  Image,
  FileCode,
  ArrowsIn,
  ListNumbers,
  Stamp,
  Crop,
  Signature,
  ShieldCheck,
} from '@phosphor-icons/react';
import type { ToolId } from '@/types/tools';
import type { PDFlyIcon } from './types';

/**
 * Semantic Phosphor icon mappings for all 15 PDFly tools.
 * Uses visually appropriate concepts as specified in visual system migration:
 * 01 Merge: Files (two/multiple documents into one)
 * 02 Split: Scissors (dividing/separating document)
 * 03 Reorder: ArrowsDownUp (page sorting/movement)
 * 04 Rotate: ArrowsClockwise (document rotation)
 * 05 Remove Pages: FileMinus (document page removal)
 * 06 Extract: Export (document/page extraction)
 * 07 Images to PDF: FileImage (images -> document)
 * 08 PDF to Images: Image (document -> image gallery)
 * 09 PDF to Markdown: FileCode (document -> structured text/code)
 * 10 Compress: ArrowsIn (document compression/stream compaction)
 * 11 Page Numbers: ListNumbers (document numbered index)
 * 12 Watermark: Stamp (document overlay stamp)
 * 13 Crop: Crop (margin trimmer)
 * 14 Sign: Signature (visual signature pad & embed)
 * 15 Protect: ShieldCheck (AES-256 security & encryption)
 */
export const TOOL_BASE_ICONS: Record<ToolId, PDFlyIcon> = {
  merge: Files,
  split: Scissors,
  reorder: ArrowsDownUp,
  rotate: ArrowsClockwise,
  'remove-pages': FileMinus,
  extract: Export,
  'images-to-pdf': FileImage,
  'pdf-to-images': Image,
  'pdf-to-markdown': FileCode,
  compress: ArrowsIn,
  'page-numbers': ListNumbers,
  watermark: Stamp,
  crop: Crop,
  sign: Signature,
  protect: ShieldCheck,
};

/**
 * Creates a component for a specific tool identity that defaults to Duotone weight.
 * Designed for tool definitions (e.g. in constants/tools.ts) so callsites
 * rendering `<tool.icon className="..." />` automatically render duotone styling.
 */
export function createToolIdentityIcon(toolId: ToolId): PDFlyIcon {
  const BaseIcon = TOOL_BASE_ICONS[toolId];
  const IdentityIcon: PDFlyIcon = ({ weight = 'duotone', ...props }) =>
    createElement(BaseIcon, { weight, 'aria-hidden': 'true', ...props });
  IdentityIcon.displayName = `ToolIdentityIcon(${toolId})`;
  return IdentityIcon;
}
