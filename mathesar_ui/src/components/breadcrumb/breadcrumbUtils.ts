import { getContext, setContext } from 'svelte';
import { type Writable, writable } from 'svelte/store';

import type { BreadcrumbItem, BreadcrumbItemDatabase } from './breadcrumbTypes';

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
