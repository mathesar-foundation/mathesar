import {
  type Readable,
  type Subscriber,
  type Unsubscriber,
  type Updater,
  type Writable,
  derived,
  writable,
} from 'svelte/store';

import type ModalStack from './ModalStack';

/**
 * This function generates a new writable store for the `isOpen` property of
 * `ModalController`. Changes to each `isOpen` store will get passed up to the
 * centralized `Writable<ModalStack>` which is the single source of truth for
 * the state of all modals.
 */
function makeProxyForIsOpen({
  modalId,
  modalStackStore,
}: {
  modalId: number;
  modalStackStore: Writable<ModalStack>;
}): Writable<boolean> {
  return {
    subscribe(subscription: Subscriber<boolean>): Unsubscriber {
      return modalStackStore.subscribe((stack) => {
        subscription(stack.has(modalId));
      });
    },

    update(updater: Updater<boolean>): void {
      modalStackStore.update((stack) => {
        const isCurrentlyVisible = stack.has(modalId);
        const shouldBecomeVisible = updater(isCurrentlyVisible);
        if (shouldBecomeVisible) {
          return stack.withModalOnTop(modalId);
        }
        if (isCurrentlyVisible) {
          return stack.without(modalId);
        }
        return stack;
      });
    },

    set(isVisible: boolean): void {
      if (isVisible) {
        modalStackStore.update((stack) => stack.withModalOnTop(modalId));
      } else {
        modalStackStore.update((stack) => stack.without(modalId));
      }
    },
  };
}

/**
 * Controls one modal.
 */
export default class ModalController<Options = void> {
  readonly modalId: number;

  private modalStackStore: Writable<ModalStack>;

  isOpen: Writable<boolean>;

  isOnTop: Readable<boolean>;

  options: Writable<Options | undefined> = writable(undefined);

  constructor({
    modalId,
    modalStackStore,
  }: {
    modalId: number;
    modalStackStore: Writable<ModalStack>;
  }) {
    this.modalId = modalId;
    this.modalStackStore = modalStackStore;

    this.isOpen = makeProxyForIsOpen({ modalId, modalStackStore });
    this.isOnTop = derived(this.modalStackStore, (s) =>
      s.isOnTop(this.modalId),
    );
  }

  open(...args: Options extends void ? [] : [Options]): void {
    this.options.set(args[0]);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.options.set(undefined);
  }
}
