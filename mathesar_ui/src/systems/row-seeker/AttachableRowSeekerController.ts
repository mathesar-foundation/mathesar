import { writable } from 'svelte/store';

import RowSeekerController, {
  type RowSeekerProps,
} from './RowSeekerController';

export default class AttachableRowSeekerController {
  private readonly onClose?: () => unknown;

  readonly node: HTMLElement | undefined;

  readonly isOpen = writable(false);

  rowSeeker: RowSeekerController;

  constructor(
    node: HTMLElement,
    props: { onClose?: () => unknown; rowSeekerProps: RowSeekerProps },
  ) {
    this.node = node;
    this.rowSeeker = new RowSeekerController(props.rowSeekerProps);
    this.onClose = props.onClose;
  }

  private async open() {
    this.isOpen.set(true);
    await this.rowSeeker.getReady();
  }

  async acquireUserSelection() {
    await this.open();
    const selection = await this.rowSeeker.acquireUserSelection();
    this.close();
    return selection;
  }

  close() {
    this.isOpen.set(false);
    this.rowSeeker.clearRecords();
    this.onClose?.();
  }
}
