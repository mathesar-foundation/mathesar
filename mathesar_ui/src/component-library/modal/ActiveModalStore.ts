import type {
  Subscriber, Unsubscriber, Updater, Writable,
} from 'svelte/store';
import { writable } from 'svelte/store';

/**
 * Stores the ID of the currently opened modal
 */
export default class ActiveModalStore implements Writable<number | undefined> {
  private openModalId = writable<number | undefined>(undefined);

  subscribe(subscriber: Subscriber<number | undefined>): Unsubscriber {
    return this.openModalId.subscribe(subscriber);
  }

  set(value: number | undefined): void {
    this.openModalId.set(value);
  }

  update(updater: Updater<number | undefined>): void {
    this.openModalId.update(updater);
  }

  open(modalId: number): void {
    this.set(modalId);
  }

  close(): void {
    this.set(undefined);
  }
}
