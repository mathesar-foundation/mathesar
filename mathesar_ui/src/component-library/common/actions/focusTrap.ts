import { tick } from 'svelte';
import type { ActionReturn } from 'svelte/action';

import { focusElement, hasProperty } from '../utils';

function getTabIndex(element: unknown): number | undefined {
  return hasProperty(element, 'tabIndex') &&
    typeof element.tabIndex === 'number'
    ? element.tabIndex
    : undefined;
}

/**
 * Yields focusable elements within a container. The elements are yielded in DOM
 * order (depth first, pre-order).
 */
function* getFocusableElementsInDomOrder(
  container: Element,
): Generator<{ element: Element; tabIndex: number }> {
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

  for (const element of potentiallyFocusable) {
    // Narrow the net by checking additional properties of each element...

    const tabIndex = getTabIndex(element);

    // Filter out elements which don't have a tabIndex property at all
    if (tabIndex === undefined) continue;

    // Filter out elements with negative tabIndex, e.g. div
    if (tabIndex < 0) continue;

    // Filter out disabled elements
    if (hasProperty(element, 'disabled') && element.disabled) continue;

    // Filter out elements that are not visible
    const { display, visibility } = getComputedStyle(element);
    if (display === 'none' || visibility === 'hidden') continue;

    // Filter out hidden input elements
    if (hasProperty(element, 'type') && element.type === 'hidden') continue;

    // Yield most elements with a valid tabIndex
    yield { element, tabIndex };
  }
}

/**
 * Returns the focusable elements within a container. The elements are returned
 * sorted in tab order (i.e. the order of their tabIndex values primarily, and
 * then in DOM when their tabIndex values are equal).
 */
function getFocusableElements(container: Element): Element[] {
  const elements = Array.from(getFocusableElementsInDomOrder(container));

  // Sort elements by tabIndex only, assuming stable sort keeps DOM order
  elements.sort((a, b) => a.tabIndex - b.tabIndex);

  return elements.map(({ element }) => element);
}

export default function focusTrap(container: HTMLElement): ActionReturn<any> {
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    // We are re-computing the list of focusable elements any time Tab or
    // Shift+Tab is pressed. This is a somewhat expensive operation. But it's
    // necessary because the list of focusable elements can change as state
    // changes (e.g. elements being added/removed from the DOM or state like
    // "disabled" being toggled).
    const elements = getFocusableElements(container);

    function wrap(index: number): number {
      return ((index % elements.length) + elements.length) % elements.length;
    }

    const currentIndex = elements.findIndex((e) => e === event.target);
    const increment = event.shiftKey ? -1 : 1;
    const targetIndex = wrap(currentIndex + increment);
    const targetElement = elements.at(targetIndex);
    if (!targetElement) return;

    event.preventDefault();
    focusElement(targetElement);
  }

  async function autoFocusFirstElement() {
    await tick(); // Wait, in case Svelte has more to render (e.g. children)
    const firstElement = getFocusableElements(container).at(0);
    if (firstElement) {
      focusElement(firstElement);
    }
  }

  container.addEventListener('keydown', handleKeyDown);
  void autoFocusFirstElement();

  return {
    destroy() {
      container.removeEventListener('keydown', handleKeyDown);
    },
  };
}
