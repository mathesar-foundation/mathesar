import { getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';

import type { Column } from '@mathesar/api/tables/columns';
import type { DBObjectEntry } from '@mathesar/AppTypes';
import type { RecordSelectorRowType } from './recordSelectorTypes';

interface RecordSelectorControllerProps {
  onOpen?: () => void;
  onClose?: () => void;
}

type FkCellValue = string | number;

export class RecordSelectorController {
  private onOpen: () => void;

  private onClose: () => void;

  rowType = writable<RecordSelectorRowType>('button');

  isOpen = writable(false);

  submit: (v: FkCellValue) => void = () => {};

  cancel: () => void = () => {};

  tableId = writable<DBObjectEntry['id'] | undefined>(undefined);

  columnWithNestedSelectorOpen = writable<Column | undefined>(undefined);

  constructor(props: RecordSelectorControllerProps = {}) {
    this.onOpen = props.onOpen ?? (() => {});
    this.onClose = props.onClose ?? (() => {});
  }

  private open(): void {
    this.isOpen.set(true);
    this.onOpen();
  }

  private close(): void {
    this.submit = () => {};
    this.cancel = () => {};
    this.isOpen.set(false);
    this.onClose();
  }

  acquireUserInput({
    tableId,
  }: {
    tableId: DBObjectEntry['id'];
  }): Promise<FkCellValue | undefined> {
    this.tableId.set(tableId);
    this.rowType.set('button');
    this.open();
    return new Promise((resolve) => {
      this.submit = (v) => {
        resolve(v);
        this.close();
      };
      this.cancel = () => {
        resolve(undefined);
        this.close();
      };
    });
  }

  navigateToRecordPage({ tableId }: { tableId: DBObjectEntry['id'] }): void {
    this.tableId.set(tableId);
    this.rowType.set('hyperlink');
    this.open();
    this.cancel = () => {
      this.close();
    };
  }
}

const contextKey = {};

export function setNewRecordSelectorControllerInContext(
  props: RecordSelectorControllerProps = {},
): RecordSelectorController {
  const recordSelectorController = new RecordSelectorController(props);
  setContext(contextKey, recordSelectorController);
  return recordSelectorController;
}

export function getRecordSelectorFromContext(): RecordSelectorController {
  return getContext(contextKey);
}
