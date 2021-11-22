import type {
  Subscriber, Unsubscriber, Writable, Updater,
} from 'svelte/store';
import type ActiveModalStore from './ActiveModalStore';

/**
 * This store acts somewhat like a radio button interface to the
 * ActiveModalStore. You can read from this store to determine whether a
 * specific modal is open. And when you write to this store, that write will get
 * passed up to the ActiveModalStore which ultimately sets the value, ensuring
 * that only one modal is open at a time.
 */
export default class ModalVisibilityStore implements Writable<boolean> {
  id: number;

  private activeModalStore: ActiveModalStore;

  constructor({
    id,
    activeModalStore,
  }: {
    id: number,
    activeModalStore: ActiveModalStore,
  }) {
    this.id = id;
    this.activeModalStore = activeModalStore;
  }

  subscribe(subscription: Subscriber<boolean>): Unsubscriber {
    return this.activeModalStore.subscribe((openModalId) => {
      subscription(openModalId === this.id);
    });
  }

  update(updater: Updater<boolean>): void {
    this.activeModalStore.update((openModalId) => {
      const isCurrentlyVisible = this.id === openModalId;
      const shouldBecomeVisible = updater(isCurrentlyVisible);
      if (shouldBecomeVisible) {
        return this.id;
      }
      if (isCurrentlyVisible) {
        return undefined;
      }
      return openModalId;
    });
  }

  set(isVisible: boolean): void {
    if (isVisible) {
      this.activeModalStore.open(this.id);
    } else {
      this.activeModalStore.close();
    }
  }

  open(): void {
    this.set(true);
  }

  close(): void {
    this.set(false);
  }

  toggle(): void {
    this.update((isVisible) => !isVisible);
  }
}
