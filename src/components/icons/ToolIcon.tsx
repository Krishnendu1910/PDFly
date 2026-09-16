import type { FC } from 'react';
import type { ToolId } from '@/types/tools';
import type { IconProps } from './types';
import { TOOL_BASE_ICONS } from './toolIcons';

export interface ToolIconProps extends IconProps {
  toolId: ToolId;
}

/**
 * ToolIcon renders the semantic Phosphor icon for a PDFly tool.
 * Defaults to weight="duotone" to preserve expressive tool identity styling.
 */
export const ToolIcon: FC<ToolIconProps> = ({
  toolId,
  weight = 'duotone',
  size,
  className = '',
  ...props
}) => {
  const BaseIcon = TOOL_BASE_ICONS[toolId];
  if (!BaseIcon) return null;
  return <BaseIcon weight={weight} size={size} className={className} aria-hidden="true" {...props} />;
};
