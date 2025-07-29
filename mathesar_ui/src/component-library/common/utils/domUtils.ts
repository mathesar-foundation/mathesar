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
  if (
    typeof element === 'object' &&
    element !== null &&
    'focus' in element &&
    typeof element.focus === 'function'
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    element.focus();
  }
}

export function* getFocusableElements(container: Element): Generator<Element> {
  // Cast a wide net with selector for potentially focusable elements
  const selectors = [
    'input',
    'button',
    'select',
    'textarea',
    'a[href]',
    'area[href]',
    'iframe',
    'object',
    'embed',
    '[tabindex]',
    '[contenteditable="true"]',
    '[contenteditable=""]',
    'audio[controls]',
    'video[controls]',
    'details',
    'summary',
  ];
  const potentiallyFocusable = container.querySelectorAll(selectors.join(', '));

  /** Narrow the net by checking additional properties of each element */
  function canFocus(element: Element): boolean {
    if ('tabIndex' in element && typeof element.tabIndex === 'number') {
      if (element.tabIndex < 0) {
        // Filter out elements with negative tabIndex, e.g. div
        return false;
      }
      if ('disabled' in element && element.disabled) {
        // Filter out disabled elements
        return false;
      }
      const { display, visibility } = getComputedStyle(element);
      if (display === 'none' || visibility === 'hidden') {
        // Filter out elements that are not visible
        return false;
      }
      if ('type' in element && element.type === 'hidden') {
        // Filter out hidden input elements
        return false;
      }
      // Return most elements with a valid tabIndex
      return true;
    }
    // Assume false otherwise
    return false;
  }

  for (const element of potentiallyFocusable) {
    if (canFocus(element)) yield element;
  }
}
