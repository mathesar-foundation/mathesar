import { writable } from 'svelte/store';
import { ModalVisibilityStore } from './ModalVisibilityStore';

/**
 * Opens/closes modals, ensuring that only one modal is open at a time.
 */
export class ModalMultiplexer {
  openModalId = writable<number | undefined>(undefined);

  private maxId = 0;

  private getId(): number {
    this.maxId += 1;
    return this.maxId;
  }

  open(modalId: number): void {
    this.openModalId.set(modalId);
  }

  close(): void {
    this.openModalId.set(undefined);
  }

  createVisibilityStore(): ModalVisibilityStore {
    return new ModalVisibilityStore({ id: this.getId(), multiplexer: this });
  }
}
