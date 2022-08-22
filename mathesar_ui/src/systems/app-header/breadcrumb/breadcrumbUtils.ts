import { setContext, getContext } from 'svelte';
import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';
import type { BreadcrumbItem } from './breadcrumbTypes';

const contextKey = Symbol('breadcrumb items store');

export function setBreadcrumbItemsInContext(items: BreadcrumbItem[]): void {
  setContext(contextKey, writable(items));
}

export function getBreadcrumbItemsFromContext(): Writable<BreadcrumbItem[]> {
  return getContext(contextKey);
}
