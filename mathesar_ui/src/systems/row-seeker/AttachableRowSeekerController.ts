import { writable } from 'svelte/store';

import { makeContext } from '@mathesar/contexts/utils';

import RowSeekerController from './RowSeekerController';

export class AttachableRowSeekerController {
  triggerElement = writable<HTMLElement | undefined>(undefined);

  rowSeeker = writable<RowSeekerController | undefined>(undefined);

  async acquireUserSelection({
    triggerElement,
    formToken,
    fieldKey,
  }: {
    triggerElement: HTMLElement;
    formToken: string;
    fieldKey: string;
  }) {
    this.triggerElement.set(triggerElement);
    const rowSeeker = new RowSeekerController({ formToken, fieldKey });
    this.rowSeeker.set(rowSeeker);
    await rowSeeker.getReady();
    const selection = await rowSeeker.acquireUserSelection();
    this.close();
    return selection;
  }

  close() {
    this.rowSeeker.set(undefined);
  }
}

export const rowSeekerContext = makeContext<AttachableRowSeekerController>();
