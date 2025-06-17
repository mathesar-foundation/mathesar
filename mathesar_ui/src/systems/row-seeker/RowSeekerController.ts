import { tick } from 'svelte';
import { type Writable, get, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type {
  Result as ApiRecord,
  SqlColumn,
  SqlComparison,
  SqlExpr,
  SqlLiteral,
} from '@mathesar/api/rpc/records';
import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
import { ImmutableMap, getGloballyUniqueId } from '@mathesar-component-library';

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

export type RowSeekerFilterMap = ImmutableMap<
  SqlColumn['value'],
  Set<SqlLiteral['value']>
>;

export default class RowSeekerController {
  elementId = getGloballyUniqueId();

  targetTable: RowSeekerProps['targetTable'];

  onFocusCallback = () => {};

  // targetColumn: number;

  // value: FkCellValue;

  tableWithMetadata = new AsyncRpcApiStore(api.tables.get_with_metadata);

  columns = new AsyncRpcApiStore(api.columns.list_with_metadata);

  records = new AsyncRpcApiStore(api.records.list_by_summaries);

  select: (v: RowSeekerResult) => void = () => {};

  filters: Writable<RowSeekerFilterMap> = writable(new ImmutableMap());

  searchValue: Writable<string> = writable('');

  constructor(props: RowSeekerProps) {
    this.targetTable = props.targetTable;
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

  getFilterSqlExpr(): SqlExpr {
    const filters = get(this.filters);

    const getLiteral = (val: SqlLiteral['value']) => ({
      type: 'literal' as const,
      value: val,
    });

    const getEqualsComparison: (
      c: SqlColumn,
      l: SqlLiteral,
    ) => SqlComparison = (c, l) => ({
      type: 'equal' as const,
      args: [c, l],
    });

    const sameColumnComparisons = [...filters.entries()].map(
      ([columnId, literalValues]) => {
        const column: SqlColumn = { type: 'attnum', value: columnId };
        const [firstComparison, ...rest] = [...literalValues]
          .map(getLiteral)
          .map((literal) => getEqualsComparison(column, literal));

        return rest.reduce(
          (accumulator: SqlComparison, currComparison: SqlComparison) => {
            const orComparison: SqlComparison = {
              type: 'or' as const,
              args: [currComparison, accumulator],
            };
            return orComparison;
          },
          firstComparison,
        );
      },
    );

    const [firstComparison, ...rest] = sameColumnComparisons;
    return rest.reduce(
      (accumulator: SqlComparison, currComparison: SqlComparison) => {
        const andComparison: SqlComparison = {
          type: 'and' as const,
          args: [currComparison, accumulator],
        };
        return andComparison;
      },
      firstComparison,
    );
  }

  async getRecords() {
    await this.records.run({
      database_id: this.targetTable.databaseId,
      table_oid: this.targetTable.tableOid,
      limit: 500,
      offset: 0,
      search: get(this.searchValue) || null,
      filter: this.getFilterSqlExpr(),
      return_linked_record_summaries: true,
    });
    await this.focusSearch();
  }

  async addToFilter(
    columnId: SqlColumn['value'],
    literal: SqlLiteral['value'],
  ) {
    this.filters.update((map) => {
      const literals = [...(map.get(columnId) ?? []), literal];
      return map.with(columnId, new Set(literals));
    });
    await this.getRecords();
  }

  async removeFromFilter(
    columnId: SqlColumn['value'],
    literal: SqlLiteral['value'],
  ) {
    this.filters.update((map) => {
      const literalSet = map.get(columnId);
      literalSet?.delete(literal);
      const literals = [...(literalSet ?? [])];
      return map.with(columnId, new Set(literals));
    });
    await this.getRecords();
  }

  async removeColumnFromFilter(columnId: SqlColumn['value']) {
    this.filters.update((map) => map.without(columnId));
    await this.getRecords();
  }

  async getReady() {
    await this.focusSearch();
    await Promise.all([this.getStructure(), this.getRecords()]);
  }

  clearRecords() {
    this.records.reset();
    this.searchValue.set('');
    this.filters.update((filter) => filter.drained());
  }

  async acquireUserSelection(): Promise<RowSeekerResult> {
    return new Promise((resolve) => {
      this.select = (v) => {
        resolve(v);
      };
    });
  }
}
