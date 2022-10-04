import type { Readable, Writable } from 'svelte/store';
import { writable, derived } from 'svelte/store';
import ModalStack from './ModalStack';
import ModalController from './ModalController';

/**
 * Controls all the modals in the system.
 */
export default class ModalMultiplexer {
  private stack = writable(new ModalStack());

  isModalOpen: Readable<boolean>;

  private maxId = 0;

  constructor() {
    this.isModalOpen = derived(this.stack, (stack) => stack.size > 0);
  }

  private getId(): number {
    this.maxId += 1;
    return this.maxId;
  }

  getPropsForNewModal(): {
    modalId: number;
    modalStackStore: Writable<ModalStack>;
  } {
    const modalId = this.getId();
    return {
      modalId,
      modalStackStore: this.stack,
    };
  }

  spawnModalController(): ModalController {
    return new ModalController(this.getPropsForNewModal());
  }
}
