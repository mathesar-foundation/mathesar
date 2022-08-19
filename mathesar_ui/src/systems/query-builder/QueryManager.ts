import { get, writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import {
  EventHandler,
  ImmutableMap,
  isDefinedNonNullable,
} from '@mathesar-component-library';
import type { CancellablePromise } from '@mathesar-component-library/types';
import { getAPI } from '@mathesar/utils/api';
import type { RequestStatus } from '@mathesar/utils/api';
import CacheManager from '@mathesar/utils/CacheManager';
import type {
  QueryInstance,
  QueryResultColumn,
  QueryResultColumns,
  QueryResultRecords,
} from '@mathesar/api/queries/queryList';
import type {
  TableEntry,
  JpPath,
  JoinableTableResult,
} from '@mathesar/api/tables/tableList';
import type { Column } from '@mathesar/api/tables/columns';
import { createQuery, putQuery } from '@mathesar/stores/queries';
import { getTable } from '@mathesar/stores/tables';
import Pagination from '@mathesar/utils/Pagination';
import { toast } from '@mathesar/stores/toast';
import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
import type QueryModel from './QueryModel';
import type { QueryModelUpdateDiff } from './QueryModel';
import QueryUndoRedoManager from './QueryUndoRedoManager';
import { processColumn } from './utils';
import type { ProcessedQueryResultColumnMap } from './utils';

export interface InputColumn {
  id: Column['id'];
  name: Column['name'];
  tableName: TableEntry['name'];
  jpPath?: JpPath;
  type: Column['type'];
  tableId: TableEntry['id'];
}

export interface ColumnWithLink extends Omit<InputColumn, 'tableId'> {
  type: Column['type'];
  linksTo?: LinkedTable;
}

export interface LinkedTable {
  id: TableEntry['id'];
  name: TableEntry['name'];
  linkedToColumn: {
    id: Column['id'];
    name: Column['name'];
  };
  columns: Map<ColumnWithLink['id'], ColumnWithLink>;
}

export interface ReferencedByTable extends LinkedTable {
  referencedViaColumn: {
    id: Column['id'];
    name: Column['name'];
    type: Column['type'];
  };
}

export interface InputColumnsStoreSubstance {
  baseTableColumns: Map<ColumnWithLink['id'], ColumnWithLink>;
  tablesThatReferenceBaseTable: Map<ReferencedByTable['id'], ReferencedByTable>;
  columnInformationMap: Map<InputColumn['id'], InputColumn>;
}

// Inorder to place all columns with links at the end while sorting
const compareColumnByLinks = (
  a: [ColumnWithLink['id'], ColumnWithLink],
  b: [ColumnWithLink['id'], ColumnWithLink],
) => {
  if (a[1].linksTo && !b[1].linksTo) {
    return 1;
  }
  if (!a[1].linksTo && b[1].linksTo) {
    return -1;
  }
  return 0;
};

export function getLinkFromColumn(
  result: JoinableTableResult,
  columnId: Column['id'],
  depth: number,
): LinkedTable | undefined {
  const validLinks = result.joinable_tables.filter(
    (entry) =>
      entry.depth === depth &&
      entry.fk_path[depth - 1][1] === false &&
      entry.jp_path[depth - 1][0] === columnId,
  );
  if (validLinks.length === 0) {
    return undefined;
  }
  if (validLinks.length > 1) {
    // This scenario should never occur
    throw new Error(`Multiple links present for the same column: ${columnId}`);
  }
  const link = validLinks[0];
  const toTableInfo = result.tables[link.target];
  const toTable = {
    id: link.target,
    name: toTableInfo.name,
  };
  const toColumnId = link.jp_path[depth - 1][1];
  const toColumn = {
    id: toColumnId,
    name: result.columns[toColumnId].name,
  };
  const columnMapEntries: [ColumnWithLink['id'], ColumnWithLink][] =
    toTableInfo.columns.map((columnIdInLinkedTable) => {
      const columnInLinkedTable = result.columns[columnIdInLinkedTable];
      return [
        columnIdInLinkedTable,
        {
          id: columnIdInLinkedTable,
          name: columnInLinkedTable.name,
          tableName: toTableInfo.name,
          type: columnInLinkedTable.type,
          linksTo: getLinkFromColumn(result, columnIdInLinkedTable, depth + 1),
          jpPath: link.jp_path,
        },
      ];
    });
  return {
    ...toTable,
    linkedToColumn: toColumn,
    columns: new Map(columnMapEntries.sort(compareColumnByLinks)),
  };
}

export function getColumnInformationMap(
  result: JoinableTableResult,
  baseTable: TableEntry,
): InputColumnsStoreSubstance['columnInformationMap'] {
  const map: InputColumnsStoreSubstance['columnInformationMap'] = new Map();
  baseTable.columns.forEach((column) => {
    map.set(column.id, {
      id: column.id,
      name: column.name,
      type: column.type,
      tableId: baseTable.id,
      tableName: baseTable.name,
    });
  });
  Object.keys(result.tables).forEach((tableIdKey) => {
    const tableId = parseInt(tableIdKey, 10);
    const table = result.tables[tableId];
    table.columns.forEach((columnId) => {
      const column = result.columns[columnId];
      map.set(columnId, {
        id: columnId,
        name: column.name,
        type: column.type,
        tableId,
        tableName: table.name,
      });
    });
  });
  return map;
}

export function getBaseTableColumnsWithLinks(
  result: JoinableTableResult,
  baseTable: TableEntry,
): Map<ColumnWithLink['id'], ColumnWithLink> {
  const columnMapEntries: [ColumnWithLink['id'], ColumnWithLink][] =
    baseTable.columns.map((column) => [
      column.id,
      {
        id: column.id,
        name: column.name,
        type: column.type,
        tableName: baseTable.name,
        linksTo: getLinkFromColumn(result, column.id, 1),
      },
    ]);
  return new Map(columnMapEntries.sort(compareColumnByLinks));
}

export function getTablesThatReferenceBaseTable(
  result: JoinableTableResult,
  baseTable: TableEntry,
): Map<ReferencedByTable['id'], ReferencedByTable> {
  const referenceLinks = result.joinable_tables.filter(
    (entry) => entry.depth === 1 && entry.fk_path[0][1] === true,
  );
  const references: Map<ReferencedByTable['id'], ReferencedByTable> = new Map();

  referenceLinks.forEach((reference) => {
    const tableId = reference.target;
    const table = result.tables[tableId];
    const baseTableColumnId = reference.jp_path[0][0];
    const baseTableColumn = baseTable.columns.find(
      (column) => column.id === baseTableColumnId,
    );
    const referenceTableColumnId = reference.jp_path[0][1];
    if (!baseTableColumn) {
      return;
    }
    const columnMapEntries: [ColumnWithLink['id'], ColumnWithLink][] =
      result.tables[reference.target].columns
        .filter((columnId) => columnId !== referenceTableColumnId)
        .map((columnIdInTable) => {
          const columnInTable = result.columns[columnIdInTable];
          return [
            columnIdInTable,
            {
              id: columnIdInTable,
              name: columnInTable.name,
              type: columnInTable.type,
              tableName: table.name,
              linksTo: getLinkFromColumn(result, columnIdInTable, 2),
              jpPath: reference.jp_path,
            },
          ];
        });

    references.set(tableId, {
      id: tableId,
      name: table.name,
      referencedViaColumn: {
        id: referenceTableColumnId,
        ...result.columns[referenceTableColumnId],
      },
      linkedToColumn: baseTableColumn,
      columns: new Map(columnMapEntries.sort(compareColumnByLinks)),
    });
  });

  return references;
}

function calcProcessedColumnsBasedOnInitialColumns(
  initialColumns: QueryModel['initial_columns'],
  existingProcessedColumns: ProcessedQueryResultColumnMap,
  abstractTypeMap: AbstractTypesMap,
): ProcessedQueryResultColumnMap {
  let isChangeRequired =
    initialColumns.length !== existingProcessedColumns.size;
  const newProcessedColumns: ProcessedQueryResultColumnMap = new ImmutableMap(
    initialColumns.map((column) => {
      const existingProcessedColumn = existingProcessedColumns.get(
        column.alias,
      );
      if (existingProcessedColumn) {
        if (
          existingProcessedColumn.column.display_name !== column.display_name
        ) {
          isChangeRequired = true;
          return [
            column.alias,
            {
              ...existingProcessedColumn,
              column: {
                ...existingProcessedColumn.column,
                display_name: column.display_name,
              },
            },
          ];
        }

        return [column.alias, existingProcessedColumn];
      }

      isChangeRequired = true;
      return [
        column.alias,
        processColumn(
          {
            alias: column.alias,
            display_name: column.display_name,
            type: 'unknown',
            type_options: null,
            display_options: null,
          },
          abstractTypeMap,
        ),
      ];
    }),
  );

  return isChangeRequired ? newProcessedColumns : existingProcessedColumns;
}

function validateQuery(queryModel: QueryModel): boolean {
  const general =
    isDefinedNonNullable(queryModel.base_table) &&
    isDefinedNonNullable(queryModel.name) &&
    queryModel.name.trim() !== '';
  if (!general) {
    return false;
  }
  const transformations = true;
  return true;
}

export default class QueryManager extends EventHandler<{
  save: QueryInstance;
}> {
  query: Writable<QueryModel>;

  undoRedoManager: QueryUndoRedoManager;

  cacheManagers: {
    inputColumns: CacheManager<number, InputColumnsStoreSubstance>;
  } = {
    inputColumns: new CacheManager(5),
  };

  state: Writable<{
    inputColumnsFetchState?: RequestStatus;
    saveState?: RequestStatus;
    columnsFetchState?: RequestStatus;
    recordsFetchState?: RequestStatus;
    isUndoPossible: boolean;
    isRedoPossible: boolean;
    lastFetchType: 'columns' | 'records' | 'both';
  }> = writable({
    isUndoPossible: false,
    isRedoPossible: false,
    lastFetchType: 'both',
  });

  pagination: Writable<Pagination> = writable(new Pagination({ size: 100 }));

  processedQueryColumns: Writable<ProcessedQueryResultColumnMap> = writable(
    new ImmutableMap(),
  );

  records: Writable<QueryResultRecords> = writable({ count: 0, results: [] });

  abstractTypeMap: AbstractTypesMap;

  inputColumns: Writable<InputColumnsStoreSubstance> = writable({
    baseTableColumns: new Map(),
    tablesThatReferenceBaseTable: new Map(),
    columnInformationMap: new Map(),
  });

  // Display stores

  selectedColumnAlias: Writable<QueryResultColumn['alias'] | undefined> =
    writable(undefined);

  // Promises

  baseTableFetchPromise: CancellablePromise<TableEntry> | undefined;

  joinableColumnsfetchPromise:
    | CancellablePromise<JoinableTableResult>
    | undefined;

  querySavePromise: CancellablePromise<QueryInstance> | undefined;

  queryColumnsFetchPromise: CancellablePromise<QueryResultColumns> | undefined;

  queryRecordsFetchPromise: CancellablePromise<QueryResultRecords> | undefined;

  constructor(query: QueryModel, abstractTypeMap: AbstractTypesMap) {
    super();
    this.abstractTypeMap = abstractTypeMap;
    this.query = writable(query);
    this.undoRedoManager = new QueryUndoRedoManager();
    const inputColumnTreePromise = this.calculateInputColumnTree();
    void inputColumnTreePromise.then(() => {
      const isQueryValid = validateQuery(query);
      this.undoRedoManager.pushState(query, isQueryValid);
      return query;
    });
    void this.fetchColumnsAndRecords();
  }

  async calculateInputColumnTree(): Promise<void> {
    const baseTableId = get(this.query).base_table;
    if (!baseTableId) {
      this.inputColumns.set({
        baseTableColumns: new Map(),
        tablesThatReferenceBaseTable: new Map(),
        columnInformationMap: new Map(),
      });
      this.state.update((state) => ({
        ...state,
        inputColumnsFetchState: { state: 'success' },
      }));
      return;
    }

    const cachedResult = this.cacheManagers.inputColumns.get(baseTableId);
    if (cachedResult) {
      this.inputColumns.set({
        ...cachedResult,
      });
      this.state.update((state) => ({
        ...state,
        inputColumnsFetchState: { state: 'success' },
      }));
      return;
    }

    try {
      this.baseTableFetchPromise?.cancel();
      this.joinableColumnsfetchPromise?.cancel();

      this.state.update((state) => ({
        ...state,
        inputColumnsFetchState: { state: 'processing' },
      }));

      // TODO: Refactor our stores to mimic our db
      this.baseTableFetchPromise = getTable(baseTableId);
      this.joinableColumnsfetchPromise = getAPI<JoinableTableResult>(
        `/api/db/v0/tables/${baseTableId}/joinable_tables/`,
      );
      const [baseTableResult, joinableColumnsResult] = await Promise.all([
        this.baseTableFetchPromise,
        this.joinableColumnsfetchPromise,
      ]);
      const baseTableColumns = getBaseTableColumnsWithLinks(
        joinableColumnsResult,
        baseTableResult,
      );
      const tablesThatReferenceBaseTable = getTablesThatReferenceBaseTable(
        joinableColumnsResult,
        baseTableResult,
      );
      const columnInformationMap = getColumnInformationMap(
        joinableColumnsResult,
        baseTableResult,
      );
      const inputColumns = {
        baseTableColumns,
        tablesThatReferenceBaseTable,
        columnInformationMap,
      };
      this.cacheManagers.inputColumns.set(baseTableId, inputColumns);
      this.inputColumns.set(inputColumns);
      this.state.update((state) => ({
        ...state,
        inputColumnsFetchState: { state: 'success' },
      }));
    } catch (err: unknown) {
      const error =
        err instanceof Error
          ? err.message
          : 'There was an error fetching joinable links';
      this.state.update((state) => ({
        ...state,
        inputColumnsFetchState: { state: 'failure', errors: [error] },
      }));
    }
  }

  async fetchColumnsAndRecords(): Promise<
    [QueryResultColumns | undefined, QueryResultRecords | undefined]
  > {
    this.state.update((state) => ({
      ...state,
      lastFetchType: 'both',
    }));
    return Promise.all([this.fetchColumns(), this.fetchResults()]);
  }

  recalculateProcessedColumnsUsingInitialColumns(): void {
    const initialColumns = get(this.query).initial_columns;
    /**
     * We are not creating a derived store so that we calculate
     * processed columns only in required scenarios and not everytime
     * query store changes.
     * TODO: Include summarization transform to identify virtual columns
     */
    this.processedQueryColumns.update((existing) =>
      calcProcessedColumnsBasedOnInitialColumns(
        initialColumns,
        existing,
        this.abstractTypeMap,
      ),
    );
  }

  resetProcessedColumns(): void {
    this.processedQueryColumns.set(new ImmutableMap());
  }

  setProcessedColumnsFromResults(resultColumns: QueryResultColumn[]): void {
    const newColumns = new ImmutableMap(
      resultColumns.map((column) => [
        column.alias,
        processColumn(column, this.abstractTypeMap),
      ]),
    );
    this.processedQueryColumns.set(newColumns);
  }

  async updateQuery(queryModel: QueryModel): Promise<{
    clientValidationState: RequestStatus;
    query?: QueryInstance;
  }> {
    this.query.set(queryModel);
    this.state.update((_state) => ({
      ..._state,
      saveState: { state: 'processing' },
    }));

    try {
      this.querySavePromise?.cancel();
      await this.calculateInputColumnTree();

      const isQueryValid = validateQuery(queryModel);

      if (!isQueryValid) {
        this.state.update((_state) => ({
          ..._state,
          saveState: {
            state: 'failure',
            errors: ['Query validation failed'],
          },
        }));
        return {
          clientValidationState: {
            state: 'failure',
            errors: ['TODO: Place validation errors here '],
          },
        };
      }

      const queryJSON = queryModel.toJSON();
      if (typeof queryJSON.id !== 'undefined') {
        // TODO: Figure out a better way to help TS identify this as a saved instance
        this.querySavePromise = putQuery(queryJSON as QueryInstance);
      } else {
        this.querySavePromise = createQuery(queryJSON);
      }
      const result = await this.querySavePromise;
      this.query.update((qr) => qr.withId(result.id).model);
      this.state.update((_state) => ({
        ..._state,
        saveState: { state: 'success' },
      }));
      await this.dispatch('save', result);
      return {
        clientValidationState: { state: 'success' },
        query: result,
      };
    } catch (err) {
      const errors =
        err instanceof Error
          ? [err.message]
          : ['An error occurred while trying to save the query'];
      this.state.update((_state) => ({
        ..._state,
        saveState: {
          state: 'failure',
          errors,
        },
      }));
      toast.error(`Unable to save query: ${errors.join(',')}`);
    }
    return {
      clientValidationState: { state: 'success' },
      query: undefined,
    };
  }

  setUndoRedoStates(): void {
    this.state.update((_state) => ({
      ..._state,
      isUndoPossible: this.undoRedoManager.isUndoPossible(),
      isRedoPossible: this.undoRedoManager.isRedoPossible(),
    }));
  }

  async fetchColumns(): Promise<QueryResultColumns | undefined> {
    const q = this.getQueryModel();

    if (typeof q.id === 'undefined') {
      this.state.update((_state) => ({
        ..._state,
        columnsFetchState: { state: 'success' },
      }));
      this.resetProcessedColumns();
      return undefined;
    }

    try {
      this.state.update((_state) => ({
        ..._state,
        columnsFetchState: { state: 'processing' },
      }));
      this.queryColumnsFetchPromise?.cancel();
      this.queryColumnsFetchPromise = getAPI(
        `/api/db/v0/queries/${q.id}/columns/`,
      );
      const result = await this.queryColumnsFetchPromise;
      this.setProcessedColumnsFromResults(result);
      this.state.update((_state) => ({
        ..._state,
        columnsFetchState: { state: 'success' },
      }));
      return result;
    } catch (err) {
      this.state.update((_state) => ({
        ..._state,
        columnsFetchState: {
          state: 'failure',
          errors:
            err instanceof Error
              ? [err.message]
              : ['An error occurred while trying to fetch query columns'],
        },
      }));
    }
    return undefined;
  }

  async fetchResults(): Promise<QueryResultRecords | undefined> {
    const q = this.getQueryModel();

    if (typeof q.id === 'undefined') {
      this.state.update((_state) => ({
        ..._state,
        recordsFetchState: { state: 'success' },
      }));
      this.records.set({ count: 0, results: [] });
      return undefined;
    }

    try {
      this.state.update((_state) => ({
        ..._state,
        recordsFetchState: { state: 'processing' },
      }));
      this.queryRecordsFetchPromise?.cancel();
      const { limit, offset } = get(this.pagination).recordsRequestParams();
      this.queryRecordsFetchPromise = getAPI(
        `/api/db/v0/queries/${q.id}/records/?limit=${limit}&offset=${offset}`,
      );
      const result = await this.queryRecordsFetchPromise;
      this.records.set({
        count: result.count,
        results: result.results ?? [],
      });
      this.state.update((_state) => ({
        ..._state,
        recordsFetchState: { state: 'success' },
      }));
      return result;
    } catch (err) {
      this.state.update((_state) => ({
        ..._state,
        recordsFetchState: {
          state: 'failure',
          errors:
            err instanceof Error
              ? [err.message]
              : ['An error occurred while trying to fetch query records'],
        },
      }));
    }
    return undefined;
  }

  async setPagination(
    pagination: Pagination,
  ): Promise<QueryResultRecords | undefined> {
    this.pagination.set(pagination);
    this.state.update((state) => ({
      ...state,
      lastFetchType: 'records',
    }));
    const result = await this.fetchResults();
    return result;
  }

  resetPaginationPane(): void {
    this.pagination.update(
      (pagination) =>
        new Pagination({
          ...pagination,
          page: 1,
        }),
    );
  }

  resetResults(): void {
    this.queryColumnsFetchPromise?.cancel();
    this.queryRecordsFetchPromise?.cancel();
    this.records.set({ count: 0, results: [] });
    this.resetProcessedColumns();
    this.selectedColumnAlias.set(undefined);
    this.state.update((state) => ({
      ...state,
      columnsFetchState: undefined,
      recordsFetchState: undefined,
    }));
    this.resetPaginationPane();
  }

  async update(
    callback: (queryModel: QueryModel) => QueryModelUpdateDiff,
  ): Promise<void> {
    const updateDiff = callback(this.getQueryModel());
    const { clientValidationState } = await this.updateQuery(updateDiff.model);
    const isValid = clientValidationState.state === 'success';
    this.undoRedoManager.pushState(updateDiff.model, isValid);
    this.setUndoRedoStates();
    if (isValid) {
      switch (updateDiff.type) {
        case 'baseTable':
          this.resetResults();
          break;
        case 'initialColumnName':
          this.recalculateProcessedColumnsUsingInitialColumns();
          break;
        case 'initialColumnsArray':
          if (!updateDiff.diff.initial_columns?.length) {
            // All columns have been deleted
            this.resetResults();
          } else {
            this.recalculateProcessedColumnsUsingInitialColumns();
            await this.fetchColumnsAndRecords();
          }
          break;
        case 'transformations':
          this.resetPaginationPane();
          await this.fetchColumnsAndRecords();
          break;
        default:
          break;
      }
    }
  }

  async performUndoRedoSync(query?: QueryModel): Promise<void> {
    if (query) {
      const currentQueryModelData = this.getQueryModel();
      let queryToSet = query;
      if (currentQueryModelData?.id) {
        queryToSet = query.withId(currentQueryModelData.id).model;
      }
      this.query.set(queryToSet);
      this.recalculateProcessedColumnsUsingInitialColumns();
      const { clientValidationState } = await this.updateQuery(queryToSet);
      const isValid = clientValidationState.state === 'success';
      this.undoRedoManager.pushState(queryToSet, isValid);
      this.setUndoRedoStates();
      await this.fetchColumnsAndRecords();
    } else {
      this.setUndoRedoStates();
    }
  }

  async undo(): Promise<void> {
    const query = this.undoRedoManager.undo();
    await this.performUndoRedoSync(query);
  }

  async redo(): Promise<void> {
    const query = this.undoRedoManager.redo();
    await this.performUndoRedoSync(query);
  }

  getQueryModel(): QueryModel {
    return get(this.query);
  }

  selectColumn(alias: QueryResultColumn['alias']): void {
    if (
      get(this.query).initial_columns.some((column) => column.alias === alias)
    ) {
      this.selectedColumnAlias.set(alias);
    } else {
      this.selectedColumnAlias.set(undefined);
    }
  }

  clearSelectedColumn(): void {
    this.selectedColumnAlias.set(undefined);
  }

  destroy(): void {
    super.destroy();
    this.queryColumnsFetchPromise?.cancel();
    this.queryColumnsFetchPromise?.cancel();
    this.queryRecordsFetchPromise?.cancel();
  }
}
