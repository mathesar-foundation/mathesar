import type { Readable } from 'svelte/store';
import { derived } from 'svelte/store';
import ActiveModalStore from './ActiveModalStore';
import ModalVisibilityStore from './ModalVisibilityStore';

/**
 * Opens/closes modals, ensuring that only one modal is open at a time.
 */
export default class ModalMultiplexer {
  private activeModal = new ActiveModalStore();

  isModalOpen: Readable<boolean>;

  private maxId = 0;

  constructor() {
    this.isModalOpen = derived(this.activeModal, (a) => !!a);
  }

  private getId(): number {
    this.maxId += 1;
    return this.maxId;
  }

  open(modalId: number): void {
    this.activeModal.set(modalId);
  }

  close(): void {
    this.activeModal.set(undefined);
  }

  createVisibilityStore(): ModalVisibilityStore {
    return new ModalVisibilityStore({
      id: this.getId(),
      activeModalStore: this.activeModal,
    });
  }
}
