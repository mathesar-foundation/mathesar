import { tick } from 'svelte';
import { type Writable, get, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type { RecordsSummaryListResponse } from '@mathesar/api/rpc/_common/commonTypes';
import type { ResultValue } from '@mathesar/api/rpc/records';
import type { Database } from '@mathesar/models/Database';
import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
import type AsyncStore from '@mathesar/stores/AsyncStore';
import Pagination from '@mathesar/utils/Pagination';
import { getGloballyUniqueId } from '@mathesar-component-library';

const PAGE_SIZE = 200;

export type MultiTaggerRecordStore = AsyncStore<
  {
    limit?: number | null;
    offset?: number | null;
    search?: string | null;
  },
  RecordsSummaryListResponse,
  unknown
>;

export type MultiTaggerProps = {
  database: Pick<Database, 'id'>;
  currentTable: {
    oid: number;
    pkColumnAttnum: number;
  };
  currentRecordPk: ResultValue;
  intermediateTable: {
    oid: number;
    attnumOfFkToCurrentTable: number;
    attnumOfFkToTargetTable: number;
  };
  targetTable: {
    oid: number;
    pkColumnAttnum: number;
  };
  onMappingChange: () => unknown;
};

export default class MultiTaggerController {
  readonly elementId = getGloballyUniqueId();

  readonly props: MultiTaggerProps;

  readonly onMappingChange: () => unknown;

  records: MultiTaggerRecordStore;

  searchValue: Writable<string> = writable('');

  pagination: Writable<Pagination> = writable(
    new Pagination({ size: PAGE_SIZE }),
  );

  constructor(p: MultiTaggerProps) {
    this.props = p;
    this.onMappingChange = p.onMappingChange;
    this.records = new AsyncRpcApiStore(api.records.list_summaries, {
      staticProps: {
        database_id: p.database.id,
        table_oid: p.targetTable.oid,
        linked_record_path: {
          join_path: [
            [
              [p.currentTable.oid, p.currentTable.pkColumnAttnum],
              [
                p.intermediateTable.oid,
                p.intermediateTable.attnumOfFkToCurrentTable,
              ],
            ],
            [
              [
                p.intermediateTable.oid,
                p.intermediateTable.attnumOfFkToTargetTable,
              ],
              [p.targetTable.oid, p.targetTable.pkColumnAttnum],
            ],
          ],
          record_pkey: p.currentRecordPk,
        },
      },
    });
  }

  async focusSearch() {
    await tick();
    const componentElement = document.getElementById(this.elementId);
    const searchBox = componentElement?.querySelector<HTMLElement>(
      "[data-multi-tagger-search] input[type='text'][data-multi-tagger-search-box]",
    );
    searchBox?.focus?.();
  }

  async getRecords() {
    const pagination = get(this.pagination);
    await this.records.run({
      ...pagination.recordsRequestParams(),
      search: get(this.searchValue) || null,
    });
    await this.focusSearch();
  }

  async resetPaginationAndGetRecords() {
    this.pagination.set(new Pagination({ size: PAGE_SIZE, page: 1 }));
    await this.getRecords();
  }

  clearRecords() {
    this.records.reset();
    this.searchValue.set('');
  }

  async addNewRecord() {
    throw new Error('Not implemented');
  }
}
