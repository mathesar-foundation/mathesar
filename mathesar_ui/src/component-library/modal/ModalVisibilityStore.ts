import type {
  Subscriber, Unsubscriber, Writable, Updater,
} from 'svelte/store';
import type { ModalMultiplexer } from './ModalMultiplexer';

/**
 * This store acts somewhat like a radio button interface to the
 * ModalMultiplexer. You can read from this store to determine whether a
 * specific modal is open. And when you write to this store, that write will get
 * passed up to the ModalMultiplexer which ultimately sets the value, ensuring
 * that only one modal is open at a time.
 */
export class ModalVisibilityStore implements Writable<boolean> {
  id: number;

  multiplexer: ModalMultiplexer;

  constructor({
    id,
    multiplexer,
  }: {
    id: number,
    multiplexer: ModalMultiplexer,
  }) {
    this.id = id;
    this.multiplexer = multiplexer;
  }

  subscribe(subscription: Subscriber<boolean>): Unsubscriber {
    return this.multiplexer.openModalId.subscribe((openModalId) => {
      subscription(openModalId === this.id);
    });
  }

  update(updater: Updater<boolean>): void {
    this.multiplexer.openModalId.update((openModalId) => {
      const isCurrentlyVisible = this.id === openModalId;
      const shouldBecomeVisible = updater(isCurrentlyVisible);
      if (shouldBecomeVisible) {
        return this.id;
      }
      return undefined;
    });
  }

  set(isVisible: boolean): void {
    if (isVisible) {
      this.multiplexer.open(this.id);
    } else {
      this.multiplexer.close();
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
