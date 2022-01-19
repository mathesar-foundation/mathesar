import type { Subscriber, Unsubscriber, Updater, Writable } from 'svelte/store';
import { writable } from 'svelte/store';

type ModalId = number | string;

/**
 * Stores the ID of the currently opened modal
 */
export default class ActiveModalStore implements Writable<ModalId | undefined> {
  private openModalId = writable<ModalId | undefined>(undefined);

  subscribe(subscriber: Subscriber<ModalId | undefined>): Unsubscriber {
    return this.openModalId.subscribe(subscriber);
  }

  set(value: ModalId | undefined): void {
    this.openModalId.set(value);
  }

  update(updater: Updater<ModalId | undefined>): void {
    this.openModalId.update(updater);
  }

  open(modalId: ModalId): void {
    this.set(modalId);
  }

  close(): void {
    this.set(undefined);
  }
}
