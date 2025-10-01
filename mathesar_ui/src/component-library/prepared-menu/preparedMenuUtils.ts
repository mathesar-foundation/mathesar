import type { ComponentAndProps, IconProps } from '../types';

export interface ButtonMenuEntry {
  type: 'button';
  label: string | ComponentAndProps;
  icon?: IconProps;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}

export interface HyperlinkMenuEntry {
  type: 'hyperlink';
  label: string | ComponentAndProps;
  icon?: IconProps;
  disabled?: boolean;
  href: string;
}

export interface DividerMenuEntry {
  type: 'divider';
}

export interface HeadingMenuEntry {
  type: 'heading';
  label: string | ComponentAndProps;
}

export function buttonMenuEntry(
  args: Omit<ButtonMenuEntry, 'type'>,
): ButtonMenuEntry {
  return { type: 'button', ...args };
}

export function hyperlinkMenuEntry(
  args: Omit<HyperlinkMenuEntry, 'type'>,
): HyperlinkMenuEntry {
  return { type: 'hyperlink', ...args };
}

export function dividerMenuEntry(): DividerMenuEntry {
  return { type: 'divider' };
}

export function headingMenuEntry(
  args: Omit<HeadingMenuEntry, 'type'>,
): HeadingMenuEntry {
  return { type: 'heading', ...args };
}

export type BasicMenuEntry =
  | ButtonMenuEntry
  | HyperlinkMenuEntry
  | HeadingMenuEntry;

export type PrimitiveMenuEntry = BasicMenuEntry | DividerMenuEntry;

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
