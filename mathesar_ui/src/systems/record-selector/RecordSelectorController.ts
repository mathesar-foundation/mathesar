import { getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';
import type { ModalController } from '@mathesar-component-library';
import type { DBObjectEntry } from '@mathesar/AppTypes';

interface RecordSelectorControllerProps {
  modal: ModalController;
}

type FkCellValue = string | number;

export class RecordSelectorController {
  modal: ModalController;

  submit: (v: FkCellValue) => void = () => {};

  cancel: () => void = () => {};

  tableId = writable<DBObjectEntry['id'] | undefined>(undefined);

  constructor(props: RecordSelectorControllerProps) {
    this.modal = props.modal;
  }

  acquireUserInput({
    tableId,
  }: {
    tableId: DBObjectEntry['id'];
  }): Promise<FkCellValue | undefined> {
    this.tableId.set(tableId);
    this.modal.open();
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

  close(): void {
    this.tableId.set(undefined);
    this.submit = () => {};
    this.cancel = () => {};
    this.modal.close();
  }
}

const contextKey = {};

export function setNewRecordSelectorControllerInContext(
  props: RecordSelectorControllerProps,
): RecordSelectorController {
  const recordSelectorController = new RecordSelectorController(props);
  setContext(contextKey, recordSelectorController);
  return recordSelectorController;
}

export function getRecordSelectorFromContext(): RecordSelectorController {
  return getContext(contextKey);
}
