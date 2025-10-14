import { hasProperty } from './typeUtils';

function getTabIndex(element: unknown): number | undefined {
  return hasProperty(element, 'tabIndex') &&
    typeof element.tabIndex === 'number'
    ? element.tabIndex
    : undefined;
}

const potentiallyFocusableElementsSelector = [
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
].join(', ');

type Focusable = { focusable: true; tabIndex: number };
type NotFocusable = { focusable: false };
type FocusCapability = Focusable | NotFocusable;

function getElementFocusCapability(element: Element): FocusCapability {
  const no: NotFocusable = { focusable: false };

  const tabIndex = getTabIndex(element);
  if (tabIndex === undefined) return no;
  if (tabIndex < 0) return no; // e.g. div
  if (hasProperty(element, 'disabled') && element.disabled) return no;

  const { display, visibility } = getComputedStyle(element);
  if (display === 'none' || visibility === 'hidden') return no;

  if (hasProperty(element, 'type') && element.type === 'hidden') return no;

  return { focusable: true, tabIndex };
}

/**
 * Yields focusable elements within a container. The elements are yielded in DOM
 * order (depth first, pre-order).
 */
function* getFocusableDescendantsInDomOrder(
  container: Element,
): Generator<{ element: Element; tabIndex: number }> {
  // Cast a wide net with selector for potentially focusable elements

  const potentiallyFocusable = container.querySelectorAll(
    potentiallyFocusableElementsSelector,
  );

  for (const element of potentiallyFocusable) {
    // Narrow the net by checking additional properties of each element...
    const focusCapability = getElementFocusCapability(element);
    if (!focusCapability.focusable) continue;
    yield { element, tabIndex: focusCapability.tabIndex };
  }
}

/**
 * Returns the focusable elements within a container. The elements are returned
 * sorted in tab order (i.e. the order of their tabIndex values primarily, and
 * then in DOM when their tabIndex values are equal).
 */
export function getFocusableDescendants(container: Element): Element[] {
  const elements = Array.from(getFocusableDescendantsInDomOrder(container));

  // Sort elements by tabIndex only, assuming stable sort keeps DOM order
  elements.sort((a, b) => a.tabIndex - b.tabIndex);

  return elements.map(({ element }) => element);
}

export function getFirstFocusableAncestor(
  element: Element,
): Element | undefined {
  if (getElementFocusCapability(element).focusable) return element;
  if (!element.parentElement) return undefined;
  const ancestor = element.parentElement.closest(
    potentiallyFocusableElementsSelector,
  );
  if (!ancestor) return undefined;
  return getFirstFocusableAncestor(ancestor);
}
