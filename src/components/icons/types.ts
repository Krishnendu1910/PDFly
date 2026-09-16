import type { ComponentPropsWithoutRef, ComponentType } from 'react';
import type { IconWeight } from '@phosphor-icons/react';

export type { IconWeight };

export interface IconProps extends ComponentPropsWithoutRef<'svg'> {
  size?: number | string;
  weight?: IconWeight;
  color?: string;
  mirrored?: boolean;
}

export type PDFlyIcon = ComponentType<IconProps>;

