import { tick } from 'svelte';

import { api } from '@mathesar/api/rpc';
import type { Result as ApiRecord } from '@mathesar/api/rpc/records';
import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
import { getGloballyUniqueId } from '@mathesar-component-library';

export interface RowSeekerProps {
  targetTable: {
    databaseId: number;
    tableOid: number;
  };
}

interface RowSeekerResult {
  recordSummary: string;
  record: ApiRecord;
}

export default class RowSeekerController {
  elementId = getGloballyUniqueId();

  targetTable: RowSeekerProps['targetTable'];

  onFocusCallback = () => {};

  // targetColumn: number;

  // value: FkCellValue;

  tableWithMetadata = new AsyncRpcApiStore(api.tables.get_with_metadata);

  columns = new AsyncRpcApiStore(api.columns.list_with_metadata);

  records = new AsyncRpcApiStore(api.records.list);

  select: (v: RowSeekerResult) => void = () => {};

  constructor(props: RowSeekerProps) {
    this.targetTable = props.targetTable;
    // this.targetColumn = props.targetColumn;
    // this.value = props.value;
  }

  async fetchRows() {
    //
  }

  async focusSearch() {
    await tick();
    const rowSeekerComponentElement = document.getElementById(this.elementId);
    const searchBox = rowSeekerComponentElement?.querySelector<HTMLElement>(
      "[data-row-seeker-search] input[type='text']",
    );
    searchBox?.focus?.();
  }

  async getStructure() {
    await AsyncRpcApiStore.runBatchConservatively([
      this.tableWithMetadata.batchRunner({
        database_id: this.targetTable.databaseId,
        table_oid: this.targetTable.tableOid,
      }),
      this.columns.batchRunner({
        database_id: this.targetTable.databaseId,
        table_oid: this.targetTable.tableOid,
      }),
    ]);
  }

  async getRecords() {
    await this.records.run({
      database_id: this.targetTable.databaseId,
      table_oid: this.targetTable.tableOid,
      limit: 1000,
      offset: 0,
      // order?: SortingEntry[];
      // filter?: SqlExpr;
      return_record_summaries: true,
    });
  }

  async getReady() {
    await this.focusSearch();
    await Promise.all([this.getStructure(), this.getRecords()]);
  }

  async acquireUserSelection(): Promise<RowSeekerResult> {
    return new Promise((resolve) => {
      this.select = (v) => {
        resolve(v);
      };
    });
  }
}
