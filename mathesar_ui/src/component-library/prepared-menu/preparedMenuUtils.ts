import type { ComponentAndProps, IconProps } from '../types';

export interface ButtonMenuEntry {
  type: 'button';
  label: string | ComponentAndProps;
  icon?: IconProps;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}

export function buttonMenuEntry(
  args: Omit<ButtonMenuEntry, 'type'>,
): ButtonMenuEntry {
  return { type: 'button', ...args };
}

export interface HyperlinkMenuEntry {
  type: 'hyperlink';
  label: string | ComponentAndProps;
  icon?: IconProps;
  disabled?: boolean;
  href: string;
}

export function hyperlinkMenuEntry(
  args: Omit<HyperlinkMenuEntry, 'type'>,
): HyperlinkMenuEntry {
  return { type: 'hyperlink', ...args };
}

export interface HeadingMenuEntry {
  type: 'heading';
  label: string | ComponentAndProps;
}

export function headingMenuEntry(
  args: Omit<HeadingMenuEntry, 'type'>,
): HeadingMenuEntry {
  return { type: 'heading', ...args };
}

export interface MenuSection {
  type: 'section';
  entries: MenuEntry[];
}

export function menuSection(...entries: MenuEntry[]): MenuSection {
  return { type: 'section', entries };
}

export interface SubMenuEntry {
  type: 'submenu';
  label: string | ComponentAndProps;
  icon?: IconProps;
  entries: MenuEntry[];
}

export function subMenu(args: Omit<SubMenuEntry, 'type'>): SubMenuEntry {
  return { type: 'submenu', ...args };
}

export type MenuEntry =
  | ButtonMenuEntry
  | HyperlinkMenuEntry
  | HeadingMenuEntry
  | MenuSection
  | SubMenuEntry;

interface DividerMenuEntry {
  type: 'divider';
}

export type FlattenedMenuEntry =
  | Exclude<MenuEntry, MenuSection>
  | DividerMenuEntry;

export function* flattenMenuSections(
  entries: Iterable<MenuEntry>,
): Generator<FlattenedMenuEntry, void, undefined> {
  let lastEntryType: 'section' | 'primitive' | undefined;

  for (const entry of entries) {
    if (entry.type === 'section') {
      const sectionEntries = [...flattenMenuSections(entry.entries)];
      if (!sectionEntries.length) continue;

      if (lastEntryType !== undefined) {
        yield { type: 'divider' };
      }
      yield* sectionEntries;
      lastEntryType = 'section';
    } else {
      if (lastEntryType === 'section') {
        yield { type: 'divider' };
      }
      yield entry;
      lastEntryType = 'primitive';
    }
  }
}
