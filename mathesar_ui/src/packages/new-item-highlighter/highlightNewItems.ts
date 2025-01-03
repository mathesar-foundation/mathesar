import type { ActionReturn } from 'svelte/action';

import { setupHighlighter } from './highlight';
import { getNewlyAddedItemsFromMutations } from './utils';

export function highlightNewItems(
  container: HTMLElement,
  options: {
    /**
     * The number of milliseconds to wait before setting up highlighting.
     *
     * This defaults to 2000 (i.e. 2 seconds) to give children time for the
     * initial load if necessary, and because in most of the contexts where we
     * want to use this, we don't expect the user to be able to perform data
     * entry in under 2 seconds.
     *
     * Set this to 0 to start highlighting immediately. If the children are
     * rendered synchronously, then highlighting will still be deferred to new
     * items.
     */
    wait?: number;
    /**
     * Pass a string to display a hint to the user when the new item is
     * scrolled out of view.
     */
    scrollHint?: string;
  } = {},
): ActionReturn {
  const wait = options.wait ?? 2000;

  const cleanupFns: (() => void)[] = [];

  function init() {
    // Use a MutationObserver to watch for new items added to the container
    const mutationObserver = new MutationObserver((mutations) => {
      // Don't highlight the first item added to the container since it will
      // already be easy for the user to identify.
      if (container.children.length < 2) return;

      for (const item of getNewlyAddedItemsFromMutations(mutations)) {
        cleanupFns.push(setupHighlighter(item, options));
      }
    });
    cleanupFns.push(() => mutationObserver.disconnect());
    mutationObserver.observe(container, { childList: true });
  }

  if (wait) {
    setTimeout(init, wait);
  } else {
    init();
  }

  return {
    destroy() {
      cleanupFns.forEach((fn) => fn());
    },
  };
}
