import { makeContext } from '@mathesar-component-library-dir/common/utils/contextUtils';
import ReductionStore from '@mathesar-component-library-dir/common/utils/ReductionStore';

/**
 * When at least one cell within the column is present, then the column is
 * present.
 */
function makeColumnStore() {
  return new ReductionStore<boolean, boolean>((cells) => cells.some((c) => c));
}

/** Options which control the behavior of modal menus */
export interface ModalMenuOptions {
  /** Closes the modal menu */
  close: () => void;
  /** With nested menus, this closes all */
  closeRoot: () => void;
  /**
   * When true, the user's focus will automatically be restored to the last
   * focused element when the menu closes. True by default.
   */
  restoreFocusOnClose?: boolean;
}

export interface SubMenuController {
  openActively: () => void;
  openPassively: () => void;
  closeActively: () => void;
  closePassively: () => void;
}

export function makeMenuController() {
  return {
    hasControlColumn: makeColumnStore(),
    hasIconColumn: makeColumnStore(),
    hasSubMenu: makeColumnStore(),
    hasSubMenuOpen: makeColumnStore(),
    subMenuControllers: new WeakMap<WeakKey, SubMenuController>(),
  };
}

type MenuController = ReturnType<typeof makeMenuController>;

export const menuControllerContext = makeContext<MenuController>();
