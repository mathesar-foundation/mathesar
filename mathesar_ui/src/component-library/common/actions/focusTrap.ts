import { tick } from 'svelte';
import type { ActionReturn } from 'svelte/action';

import { focusElement, getFocusableDescendants, hasMethod } from '../utils';

interface FocusTrapOptions {
  /**
   * Automatically focus the first focusable element when opening. True by
   * default.
   */
  autoFocus?: boolean;
  /**
   * Automatically re-focus the last-focused element when closing. True by
   * default.
   */
  autoRestore?: boolean;
}

export default function focusTrap(
  container: HTMLElement,
  options: FocusTrapOptions = {},
): ActionReturn {
  let previouslyFocusedElement: Element | null;

  const fullOptions = {
    autoFocus: true,
    autoRestore: true,
    ...options,
  };

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    event.preventDefault();

    // We are re-computing the list of focusable elements any time Tab or
    // Shift+Tab is pressed. This is a somewhat expensive operation. But it's
    // necessary because the list of focusable elements can change as state
    // changes (e.g. elements being added/removed from the DOM or state like
    // "disabled" being toggled).
    const elements = getFocusableDescendants(container);
    if (!elements.length) return;

    function wrap(index: number): number {
      return ((index % elements.length) + elements.length) % elements.length;
    }

    const currentIndex = elements.findIndex((e) => e === event.target);
    const increment = event.shiftKey ? -1 : 1;
    const targetIndex = wrap(currentIndex + increment);
    const targetElement = elements.at(targetIndex);
    if (!targetElement) return;

    focusElement(targetElement);
  }

  async function initializeFocus() {
    // Wait, in case Svelte has more to render (e.g. children) or in case custom
    // imperative focus logic has been applied (e.g. focusing the first cell
    // when clicking on a column header)
    await tick();

    previouslyFocusedElement = document.activeElement;

    if (fullOptions.autoFocus) {
      const firstElement = getFocusableDescendants(container).at(0);
      if (firstElement) {
        /*
         * When the element is immediately focused, keydown events seem to get
         * triggered on the element. This results in cases like the lightbox
         * closing immediately after being opened when opened via an 'enter'
         * keydown event.
         *
         * My hunch is that this bug has to do something with the way
         * transitions/animations are executed by svelte/transition.
         *
         * Moving the focus task to a macrotask such as setTimeout seems to
         * prevent this bug from occurring.
         *
         * The exact root cause / race condition is not entirely figured out.
         */
        setTimeout(() => {
          focusElement(firstElement);
        }, 10);
      }
    } else if (
      previouslyFocusedElement &&
      hasMethod(previouslyFocusedElement, 'blur')
    ) {
      previouslyFocusedElement.blur();
    }
  }

  void initializeFocus();

  window.addEventListener('keydown', handleKeyDown);

  return {
    destroy() {
      window.removeEventListener('keydown', handleKeyDown);
      if (fullOptions.autoRestore) {
        focusElement(previouslyFocusedElement);
      }
    },
  };
}
