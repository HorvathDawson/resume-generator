import type { CSSProperties } from 'react';
import type { Theme } from '../model/types';
import { fontStack } from '../model/variants';

/** CSS custom properties that drive every resume style. */
export function themeVars(theme: Theme): CSSProperties {
  return {
    '--rg-font': fontStack(theme.font),
    '--rg-heading-font': fontStack(theme.headingFont),
    '--rg-fs': `${theme.fontSize}pt`,
    '--rg-lh': String(theme.lineHeight),
    '--rg-space': String(theme.spacing),
    '--rg-accent': theme.accent,
    '--rg-text': theme.text,
    '--rg-muted': theme.muted,
    '--rg-shade': theme.shade,
    '--rg-shade-text': theme.shadeText,
    '--rg-shade-accent': theme.shadeAccent,
    '--rg-m': `${theme.margin}cm`,
    '--rg-gap': `${theme.columnGap}cm`,
  } as CSSProperties;
}
