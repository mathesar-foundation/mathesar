import { tick } from 'svelte';
import { type Writable, get, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type {
  Result as ApiRecord,
  ResultValue,
} from '@mathesar/api/rpc/records';
import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
import Pagination from '@mathesar/utils/Pagination';
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
  recordPk?: ResultValue;
}

export default class RowSeekerController {
  private readonly targetTable: RowSeekerProps['targetTable'];

  private table = new AsyncRpcApiStore(api.tables.get_with_metadata);

  readonly elementId = getGloballyUniqueId();

  columns = new AsyncRpcApiStore(api.columns.list_with_metadata);

  records = new AsyncRpcApiStore(api.records.list_by_summaries);

  searchValue: Writable<string> = writable('');

  pagination: Writable<Pagination> = writable(new Pagination({ size: 200 }));

  select: (v: RowSeekerResult) => void = () => {};

  constructor(props: RowSeekerProps) {
    this.targetTable = props.targetTable;
  }

  private async focusSearch() {
    await tick();
    const rowSeekerComponentElement = document.getElementById(this.elementId);
    const searchBox = rowSeekerComponentElement?.querySelector<HTMLElement>(
      "[data-row-seeker-search] input[type='text'][data-row-seeker-search-box]",
    );
    searchBox?.focus?.();
  }

  private async getStructure() {
    await AsyncRpcApiStore.runBatchConservatively([
      this.table.batchRunner({
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
    const pagination = get(this.pagination);
    await this.records.run({
      database_id: this.targetTable.databaseId,
      table_oid: this.targetTable.tableOid,
      ...pagination.recordsRequestParams(),
      search: get(this.searchValue) || null,
      return_linked_record_summaries: true,
    });
    await this.focusSearch();
  }

  async resetPaginationAndGetRecords() {
    this.pagination.set(new Pagination({ size: 200, page: 1 }));
    await this.getRecords();
  }

  async getReady() {
    await this.focusSearch();
    await Promise.all([this.getStructure(), this.getRecords()]);
  }

  clearRecords() {
    this.records.reset();
    this.searchValue.set('');
  }

  async acquireUserSelection(): Promise<RowSeekerResult> {
    return new Promise((resolve) => {
      this.select = (v) => {
        resolve(v);
      };
    });
  }
}
