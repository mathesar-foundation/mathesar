import { hasMethod } from './typeUtils';

const ID_PREFIX = '_id';

export function getGloballyUniqueId(customPrefix?: string): string {
  const prefix = customPrefix ?? ID_PREFIX;

  // randomUUID is only present in secure contexts such as https or localhost
  if (crypto && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  // Does not _definitively_ ensure uniqueness but should suffice for our cases
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .substring(2)}`;
}

export function focusAndSelectAll(element: HTMLInputElement): void {
  element.focus();
  element.setSelectionRange(0, element.value.length);
}

export function focusElement(element: unknown): void {
  if (hasMethod(element, 'focus')) {
    element.focus();
  }
}

export function blurElement(element: unknown): void {
  if (hasMethod(element, 'blur')) {
    element.blur();
  }
}
