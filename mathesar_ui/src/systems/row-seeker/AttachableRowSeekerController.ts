import { writable } from 'svelte/store';

import type { SummarizedRecordReference } from '@mathesar/api/rpc/_common/commonTypes';
import { makeContext } from '@mathesar/component-library/common/utils/contextUtils';

import RowSeekerController, {
  type RowSeekerProps,
} from './RowSeekerController';

interface AttachableRowSeekerControllerProps extends RowSeekerProps {
  triggerElement: HTMLElement;
}

export class AttachableRowSeekerController {
  triggerElement = writable<HTMLElement | undefined>(undefined);

  rowSeeker = writable<RowSeekerController | undefined>(undefined);

  async acquireUserSelection(
    props: AttachableRowSeekerControllerProps,
  ): Promise<SummarizedRecordReference | SummarizedRecordReference[] | null> {
    this.triggerElement.set(props.triggerElement);
    const rowSeeker = new RowSeekerController(props);
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
