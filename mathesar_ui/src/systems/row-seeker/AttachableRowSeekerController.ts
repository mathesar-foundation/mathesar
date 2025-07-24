import { writable } from 'svelte/store';

import { makeContext } from '@mathesar/contexts/utils';

import RowSeekerController from './RowSeekerController';

export class AttachableRowSeekerController {
  readonly isOpen = writable(false);

  triggerElement?: HTMLElement;

  rowSeeker?: RowSeekerController;

  async acquireUserSelection({
    triggerElement,
    formToken,
    fieldKey,
  }: {
    triggerElement: HTMLElement;
    formToken: string;
    fieldKey: string;
  }) {
    this.triggerElement = triggerElement;
    this.rowSeeker = new RowSeekerController({ formToken, fieldKey });
    this.isOpen.set(true);
    await this.rowSeeker.getReady();
    const selection = await this.rowSeeker.acquireUserSelection();
    this.close();
    return selection;
  }

  close() {
    this.isOpen.set(false);
    this.rowSeeker?.clearRecords();
  }
}

export const rowSeekerContext = makeContext<AttachableRowSeekerController>();
