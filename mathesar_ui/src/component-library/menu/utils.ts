import { setContext, getContext } from 'svelte';
import { type Writable, writable, get } from 'svelte/store';

const contextKey = Symbol('menu alignment stores context');

interface MenuAlignmentStores {
  hasControl: Writable<boolean>;
  hasIcon: Writable<boolean>;
  dataPerItem: Map<string, { hasControl: boolean; hasIcon: boolean }>;
}

export function getMenuAlignmentStoresFromContext():
  | MenuAlignmentStores
  | undefined {
  return getContext<MenuAlignmentStores>(contextKey);
}

export function setMenuAlignmentStoresInContext(): MenuAlignmentStores {
  if (getMenuAlignmentStoresFromContext() !== undefined) {
    throw Error('Menu alignment stores context has already been set');
  }
  const menuAlignmentStores = {
    hasControl: writable(false),
    hasIcon: writable(false),
    dataPerItem: new Map(),
  };
  setContext(contextKey, menuAlignmentStores);
  return menuAlignmentStores;
}

export function registerMenuItem(
  uniqueId: string,
  getIconAndControlPresence: () => { hasIcon: boolean; hasControl: boolean },
): void {
  const { hasIcon, hasControl } = getIconAndControlPresence();
  const menuAlignmentStores = getMenuAlignmentStoresFromContext();
  if (!menuAlignmentStores) {
    return;
  }
  menuAlignmentStores.dataPerItem.set(uniqueId, { hasIcon, hasControl });
  if (hasControl && !get(menuAlignmentStores.hasControl)) {
    menuAlignmentStores.hasControl.set(true);
  }
  if (hasIcon && !get(menuAlignmentStores.hasIcon)) {
    menuAlignmentStores.hasIcon.set(true);
  }
}

export function deregisterMenuItem(uniqueId: string) {
  const menuAlignmentStores = getMenuAlignmentStoresFromContext();
  if (!menuAlignmentStores) {
    return;
  }
  menuAlignmentStores.dataPerItem.delete(uniqueId);
  const values = [...menuAlignmentStores.dataPerItem.values()];
  const hasControl = values.some((value) => value.hasControl);
  const hasIcon = values.some((value) => value.hasIcon);
  if (hasControl && !get(menuAlignmentStores.hasControl)) {
    menuAlignmentStores.hasControl.set(true);
  }
  if (hasIcon && !get(menuAlignmentStores.hasIcon)) {
    menuAlignmentStores.hasIcon.set(true);
  }
}
