import { writable } from 'svelte/store';

import type { SummarizedRecordReference } from '@mathesar/api/rpc/_common/commonTypes';
import { makeContext } from '@mathesar/contexts/utils';

import RowSeekerController from './RowSeekerController';

export class AttachableRowSeekerController {
  triggerElement = writable<HTMLElement | undefined>(undefined);

  rowSeeker = writable<RowSeekerController | undefined>(undefined);

  async acquireUserSelection({
    triggerElement,
    formToken,
    fieldKey,
    previousValue,
  }: {
    triggerElement: HTMLElement;
    formToken: string;
    fieldKey: string;
    previousValue?: SummarizedRecordReference;
  }) {
    this.triggerElement.set(triggerElement);
    const rowSeeker = new RowSeekerController({
      previousValue,
      formToken,
      fieldKey,
    });
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
