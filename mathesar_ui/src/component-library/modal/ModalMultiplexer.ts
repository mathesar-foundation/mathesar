import { type Readable, type Writable, derived, writable } from 'svelte/store';

import ModalController from './ModalController';
import ModalStack from './ModalStack';

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

  spawnModalController<Options = void>(): ModalController<Options> {
    return new ModalController(this.getPropsForNewModal());
  }
}
