import { type Readable, derived } from 'svelte/store';

import {
  type MessageSender,
  WritableMap,
  oneWayMessageChannel,
} from '@mathesar-component-library-dir/common/utils';
import { makeContext } from '@mathesar-component-library-dir/common/utils/contextUtils';
import { DelayedStore } from '@mathesar-component-library-dir/common/utils/DelayedStore';
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
  isOpen: Readable<boolean>;
  open: () => void;
  close: () => void;
  handleMouseEnterContent: MessageSender<void>;
}

function isSubMenuTrigger(element: unknown): element is HTMLButtonElement {
  if (!(element instanceof HTMLButtonElement)) return false;
  return element.getAttribute('data-menu-item-sub-menu') !== null;
}

export class MenuController {
  // The "delay" logic implemented within this class helps with usability. For
  // example:
  //
  // 1. Open a parent menu with 4 entries, the first of which is a sub-menu.
  // 2. Open the sub-menu via hover. The sub-menu contains several entries.
  // 3. You move your mouse _diagonally_ down toward the lower entries in the
  //    sub-menu. In doing so, your mouse crosses over the lower entries in the
  //    parent menu. You want the sub-menu to remain open even though you're
  //    moving your mouse over other entries in the parent (which would normally
  //    close the sub-menu). As long as you move quickly, the sub-menu should
  //    stay open.

  private subMenus = new WritableMap<object, SubMenuController>();

  private openedSubMenu = new DelayedStore<HTMLButtonElement | undefined>(
    undefined,
    70,
  );

  hasControlColumn = makeColumnStore();

  hasIconColumn = makeColumnStore();

  hasSubMenu: Readable<boolean>;

  hasSubMenuOpen: Readable<boolean>;

  openedSubMenuTimeoutId: number | undefined;

  constructor() {
    this.hasSubMenu = derived(this.subMenus, (subMenus) => subMenus.size > 0);
    this.hasSubMenuOpen = derived(this.openedSubMenu, Boolean);
  }

  openSubMenuImmediately(trigger: unknown) {
    if (!isSubMenuTrigger(trigger)) {
      this.closeSubMenuImmediately();
      return;
    }
    this.openedSubMenu.setImmediately(trigger);
  }

  openSubMenuAfterDelay(trigger: unknown) {
    if (!isSubMenuTrigger(trigger)) {
      this.closeSubMenuAfterDelay();
      return;
    }

    this.openedSubMenu.setAfterDelay(trigger);
  }

  closeSubMenuImmediately() {
    this.openedSubMenu.setImmediately(undefined);
  }

  closeSubMenuAfterDelay() {
    this.openedSubMenu.setAfterDelay(undefined);
  }

  registerSubMenu(trigger: HTMLButtonElement): SubMenuController {
    const [handleMouseEnterContent, onMouseEnterContent] =
      oneWayMessageChannel();

    const controller: SubMenuController = {
      isOpen: derived(this.openedSubMenu, (m) => m === trigger),
      open: () => {
        this.openSubMenuImmediately(trigger);
      },
      close: () => {
        this.closeSubMenuImmediately();
        trigger.focus();
      },
      handleMouseEnterContent,
    };
    this.subMenus.set(trigger, controller);

    // This cancels any pending operation to close the menu or open a different
    // one, thereby ensuring that the menu remains open.
    onMouseEnterContent(() => this.openSubMenuImmediately(trigger));

    return controller;
  }

  unRegisterSubMenu(trigger: HTMLButtonElement): void {
    this.subMenus.delete(trigger);
  }
}

export const menuControllerContext = makeContext<MenuController>();
