import { getContext, setContext } from 'svelte';
import { type Writable, writable } from 'svelte/store';

import { toAsciiLowerCase } from '@mathesar/component-library';

import type {
  BreadcrumbItem,
  BreadcrumbItemDatabase,
  BreadcrumbSelectorData,
  BreadcrumbSelectorEntry,
} from './breadcrumbTypes';

const contextKey = Symbol('breadcrumb items store');

export function breadcrumbItemIsDatabase(
  item: BreadcrumbItem,
): item is BreadcrumbItemDatabase {
  return item.type === 'database';
}

export function setBreadcrumbItemsInContext(items: BreadcrumbItem[]): void {
  setContext(contextKey, writable(items));
}

export function getBreadcrumbItemsFromContext(): Writable<BreadcrumbItem[]> {
  return getContext(contextKey);
}

function breadcrumbSelectorEntryMatches(
  entry: BreadcrumbSelectorEntry,
  filterString: string,
): boolean {
  const mainString = toAsciiLowerCase(entry.label);
  const subString = toAsciiLowerCase(filterString);
  return mainString.includes(subString);
}

/**
 * Filters entities contained in a BreadcrumbSelectorData, depending on whether or not their names
 * match the filterString.
 */
export function filterBreadcrumbSelectorData(
  data: BreadcrumbSelectorData,
  filterString: string,
): BreadcrumbSelectorData {
  let arr = Array.from(data);
  arr = arr
    .map(([category, entries]): [string, BreadcrumbSelectorEntry[]] => [
      category,
      Array.from(entries).filter((entry) =>
        breadcrumbSelectorEntryMatches(entry, filterString),
      ),
    ])
    .filter(([, entries]) => entries.length > 0);
  return new Map(arr);
}
