import { setContext, getContext } from 'svelte';
import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';
import type {
  BreadcrumbItem,
  BreadcrumbSelectorData,
  BreadcrumbSelectorEntry,
} from './breadcrumbTypes';

const contextKey = Symbol('breadcrumb items store');

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
  const mainString = entry.label.toLowerCase();
  const subString = filterString.toLowerCase();
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
    .filter(([_category, entries]) => entries.length > 0);
  return new Map(arr);
}
