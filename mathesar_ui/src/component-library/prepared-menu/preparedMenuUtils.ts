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

export type BasicMenuEntry =
  | ButtonMenuEntryRecipe
  | HyperlinkMenuEntryRecipe
  | HeadingMenuEntryRecipe;

export type PrimitiveMenuEntry = BasicMenuEntry | DividerMenuEntryRecipe;

export type MenuEntry = BasicMenuEntry | MenuSection;

export interface MenuSection {
  type: 'section';
  entries: MenuEntry[];
}

export function menuSection(...entries: MenuEntry[]): MenuSection {
  return { type: 'section', entries };
}

export function* flattenMenuEntries(
  entries: Iterable<MenuEntry>,
): Generator<PrimitiveMenuEntry, void, undefined> {
  let lastEntryType: 'section' | 'primitive' | undefined;

  for (const entry of entries) {
    if (entry.type === 'section') {
      const sectionEntries = [...flattenMenuEntries(entry.entries)];
      if (!sectionEntries.length) continue;

      if (lastEntryType !== undefined) {
        yield dividerMenuEntry();
      }
      yield* sectionEntries;
      lastEntryType = 'section';
    } else {
      if (lastEntryType === 'section') {
        yield dividerMenuEntry();
      }
      yield entry;
      lastEntryType = 'primitive';
    }
  }
}
