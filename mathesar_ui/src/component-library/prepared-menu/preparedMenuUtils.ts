import type { ComponentAndProps, IconProps } from '../types';

export interface ButtonMenuEntryRecipe {
  type: 'button';
  label: string | ComponentAndProps;
  icon?: IconProps;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}

export interface HyperlinkMenuEntryRecipe {
  type: 'hyperlink';
  label: string | ComponentAndProps;
  icon?: IconProps;
  disabled?: boolean;
  href: string;
}

export interface DividerMenuEntryRecipe {
  type: 'divider';
}

export interface HeadingMenuEntryRecipe {
  type: 'heading';
  label: string | ComponentAndProps;
}

export function buttonMenuEntry(
  args: Omit<ButtonMenuEntryRecipe, 'type'>,
): ButtonMenuEntryRecipe {
  return { type: 'button', ...args };
}

export function hyperlinkMenuEntry(
  args: Omit<HyperlinkMenuEntryRecipe, 'type'>,
): HyperlinkMenuEntryRecipe {
  return { type: 'hyperlink', ...args };
}

export function dividerMenuEntry(): DividerMenuEntryRecipe {
  return { type: 'divider' };
}

export function headingMenuEntry(
  args: Omit<HeadingMenuEntryRecipe, 'type'>,
): HeadingMenuEntryRecipe {
  return { type: 'heading', ...args };
}

export type PreparedMenuEntry =
  | ButtonMenuEntryRecipe
  | HyperlinkMenuEntryRecipe
  | HeadingMenuEntryRecipe
  | DividerMenuEntryRecipe;
