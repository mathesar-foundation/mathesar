import { getContext, setContext } from 'svelte';
import type { Readable } from 'svelte/store';
import { get, derived, writable } from 'svelte/store';
import type { ModalController } from '@mathesar-component-library';
import type { DBObjectEntry } from '@mathesar/AppTypes';
import { TabularData } from '@mathesar/stores/table-data/tabularData';
import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
import { Meta } from '@mathesar/stores/table-data';
import Pagination from '@mathesar/utils/Pagination';

interface RecordSelectorControllerProps {
  modal: ModalController;
  getTableName: (id: DBObjectEntry['id']) => string | undefined;
}

type FkCellValue = string | number;

export class RecordSelectorController {
  modal: ModalController;

  submit: (v: FkCellValue) => void = () => {};

  cancel: () => void = () => {};

  tableId = writable<DBObjectEntry['id'] | undefined>(undefined);

  tabularData: Readable<TabularData | undefined>;

  tableName: Readable<string | undefined>;

  constructor(props: RecordSelectorControllerProps) {
    this.modal = props.modal;

    this.tabularData = derived(this.tableId, (tableId) => {
      if (!tableId) {
        return undefined;
      }
      return new TabularData({
        id: tableId,
        abstractTypesMap: get(currentDbAbstractTypes).data,
        meta: new Meta({ pagination: new Pagination({ size: 10 }) }),
      });
    });

    this.tableName = derived(this.tableId, (id) =>
      id === undefined ? undefined : props.getTableName(id),
    );
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
