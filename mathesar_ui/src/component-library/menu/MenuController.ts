import { getContext, setContext } from 'svelte';

import ReductionStore from '@mathesar-component-library-dir/common/utils/ReductionStore';

const contextKey = Symbol('menu alignment stores context');

/**
 * When at least one cell within the column is present, then the column is
 * present.
 */
function makeColumnStore() {
  return new ReductionStore<boolean, boolean>((cells) => cells.some((c) => c));
}

function makeMenuController() {
  return {
    hasControlColumn: makeColumnStore(),
    hasIconColumn: makeColumnStore(),
  };
}

type MenuController = ReturnType<typeof makeMenuController>;

export function getMenuControllerFromContext(): MenuController | undefined {
  return getContext(contextKey);
}

export function setNewMenuControllerInContext(): MenuController {
  if (getMenuControllerFromContext() !== undefined) {
    throw Error('MenuController context has already been set');
  }
  const menuController = makeMenuController();
  setContext(contextKey, menuController);
  return menuController;
}
