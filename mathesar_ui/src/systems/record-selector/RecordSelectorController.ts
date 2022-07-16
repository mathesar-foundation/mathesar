import { getContext, setContext } from 'svelte';
import type { Readable } from 'svelte/store';
import { get, derived, writable } from 'svelte/store';
import type { DBObjectEntry } from '@mathesar/AppTypes';
import { TabularData } from '@mathesar/stores/table-data/tabularData';
import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
import {
  Filtering,
  Grouping,
  Sorting,
  TabularType,
} from '@mathesar/stores/table-data';
import Pagination from '@mathesar/utils/Pagination';

interface RecordSelectorControllerProps {
  onOpen?: () => void;
  onClose?: () => void;
}

type FkCellValue = string | number;

export class RecordSelectorController {
  private onOpen: () => void;

  private onClose: () => void;

  isOpen = writable(false);

  submit: (v: FkCellValue) => void = () => {};

  cancel: () => void = () => {};

  tableId = writable<DBObjectEntry['id'] | undefined>(undefined);

  tabularData: Readable<TabularData | undefined>;

  constructor(props: RecordSelectorControllerProps = {}) {
    this.onOpen = props.onOpen ?? (() => {});
    this.onClose = props.onClose ?? (() => {});

    this.tabularData = derived(this.tableId, (tableId) => {
      if (!tableId) {
        return undefined;
      }
      const abstractTypesMap = get(currentDbAbstractTypes).data;
      return new TabularData(
        {
          type: TabularType.Table,
          id: tableId,
          metaProps: {
            pagination: new Pagination({ size: 10 }),
            sorting: new Sorting(),
            grouping: new Grouping(),
            filtering: new Filtering(),
          },
        },
        abstractTypesMap,
      );
    });
  }

  acquireUserInput({
    tableId,
  }: {
    tableId: DBObjectEntry['id'];
  }): Promise<FkCellValue | undefined> {
    this.tableId.set(tableId);
    this.isOpen.set(true);
    this.onOpen();
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

  private close(): void {
    this.submit = () => {};
    this.cancel = () => {};
    this.isOpen.set(false);
    this.onClose();
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
