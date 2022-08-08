import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { CancellablePromise } from '@mathesar-component-library/types';
import type {
  TableEntry,
  JpPath,
  JoinableTableResult,
} from '@mathesar/api/tables/tableList';
import CacheManager from '@mathesar/utils/CacheManager';
import { getAPI } from '@mathesar/utils/api';
import type { RequestStatus } from '@mathesar/utils/api';
import type { Column } from '@mathesar/api/tables/columns';

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

interface InputColumnsStoreSubstance {
  requestStatus: RequestStatus;
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

export default class InputColumnsManager {
  fetchPromise: CancellablePromise<JoinableTableResult> | undefined;

  cacheManager: CacheManager<
    number,
    Omit<InputColumnsStoreSubstance, 'requestStatus'>
  > = new CacheManager(5);

  baseTable: TableEntry | undefined;

  inputColumns: Writable<InputColumnsStoreSubstance> = writable({
    requestStatus: { state: 'success' },
    baseTableColumns: new Map(),
    tablesThatReferenceBaseTable: new Map(),
    columnInformationMap: new Map(),
  });

  async generateTreeForBaseTable(): Promise<void> {
    this.fetchPromise?.cancel();
    this.inputColumns.update((columnInfo) => ({
      ...columnInfo,
      requestStatus: { state: 'processing' },
    }));

    if (!this.baseTable) {
      this.inputColumns.set({
        baseTableColumns: new Map(),
        tablesThatReferenceBaseTable: new Map(),
        columnInformationMap: new Map(),
        requestStatus: { state: 'success' },
      });
      return;
    }

    const cachedResult = this.cacheManager.get(this.baseTable.id);
    if (cachedResult) {
      this.inputColumns.set({
        ...cachedResult,
        requestStatus: { state: 'success' },
      });
      return;
    }

    try {
      this.fetchPromise = getAPI<JoinableTableResult>(
        `/api/db/v0/tables/${this.baseTable.id}/joinable_tables/`,
      );
      const result = await this.fetchPromise;
      const baseTableColumns = getBaseTableColumnsWithLinks(
        result,
        this.baseTable,
      );
      const tablesThatReferenceBaseTable = getTablesThatReferenceBaseTable(
        result,
        this.baseTable,
      );
      const columnInformationMap = getColumnInformationMap(
        result,
        this.baseTable,
      );
      this.cacheManager.set(this.baseTable.id, {
        baseTableColumns,
        tablesThatReferenceBaseTable,
        columnInformationMap,
      });
      this.inputColumns.set({
        baseTableColumns,
        tablesThatReferenceBaseTable,
        columnInformationMap,
        requestStatus: { state: 'success' },
      });
    } catch (err: unknown) {
      const error =
        err instanceof Error
          ? err.message
          : 'There was an error fetching joinable links';
      this.inputColumns.update((columnInfo) => ({
        ...columnInfo,
        requestStatus: { state: 'failure', errors: [error] },
      }));
    }
  }

  async setBaseTable(_baseTable?: TableEntry): Promise<void> {
    this.baseTable = _baseTable;
    await this.generateTreeForBaseTable();
  }
}
