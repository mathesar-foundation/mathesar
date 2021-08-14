import { router } from 'tinro';
import type {
  GroupOption,
  SortOption,
  TableOptionsData,
  FilterEntry,
} from '@mathesar/stores/tableData';

/**
 * Structure of url t=[
 *  [
 *    id,
 *    [sortcolumn1, sortorder, sortc2, sortorder2],
 *    [groupcolumn1, groupcolumn2],
 *    [combination, filtercolumn, condition, value, filterc2, condition2]
 *  ]
 * ], a=id
 * t -> tables, a -> active
 */

interface TableOptions extends Partial<TableOptionsData> {
  position?: number,
  status?: 'active' | 'inactive',
}

interface TableConfig extends TableOptions {
  id: number,
}

type RawTableConfig = (string | number | string[])[];

function isInDBPath(db: string): boolean {
  const dbInURL = window.location.pathname.split('/')[1];
  return db === dbInURL;
}

function getRawTables(db: string): RawTableConfig[] {
  if (isInDBPath(db)) {
    const tableQuery = router.location.query.get('t') as string;
    return tableQuery ? JSON.parse(decodeURIComponent(tableQuery)) as [] : [];
  }
  return [];
}

function parseTableConfig(config: RawTableConfig): TableConfig {
  const tableConfig: TableConfig = {
    id: parseInt(config[0] as string, 10),
  };

  if (config[1]) {
    const sortOptionMap: SortOption = new Map();
    const sortList = config[1] as string[];
    for (let i = 0; i < sortList.length; i += 2) {
      const sortOrder = sortList[i + 1] === 'd' ? 'desc' : 'asc';
      sortOptionMap.set(sortList[i], sortOrder);
    }
    if (sortList.length > 0) {
      tableConfig.sort = sortOptionMap;
    }
  }

  if (config[2]) {
    const groupOptionSet: GroupOption = new Set(config[2] as string[]);
    if (groupOptionSet.size > 0) {
      tableConfig.group = groupOptionSet;
    }
  }

  if ((config[3] as string[])?.length > 0) {
    const filterList = config[3] as string[];
    const combination = filterList[0];
    const filters: FilterEntry[] = [];
    for (let i = 1; i < filterList.length;) {
      const column = filterList[i];
      const condition = filterList[i + 1];

      if (column && condition) {
        const value = filterList[i + 2] || '';
        filters.push({
          column: {
            id: column,
            label: column,
          },
          condition: {
            id: condition,
            label: condition,
          },
          value,
        });
      }
      i += 3;
    }
    if (filters.length > 0) {
      tableConfig.filter = {
        combination: {
          id: combination,
          label: combination,
        },
        filters,
      };
    }
  }

  return tableConfig;
}

function prepareRawTableConfig(id: number, options?: TableOptions): RawTableConfig {
  const table: RawTableConfig = [id];
  if (options) {
    const sortOption: string[] = [];
    options.sort?.forEach((value, key) => {
      sortOption.push(key);
      const sortOrder = value === 'desc' ? 'd' : 'a';
      sortOption.push(sortOrder);
    });
    table.push(sortOption);

    const groupOption: string[] = [...(options.group ?? [])];
    table.push(groupOption);

    const filterOptions: string[] = [];
    if (options.filter?.filters?.length > 0) {
      filterOptions.push(options.filter.combination.id as string || 'and');
      options.filter.filters.forEach((filter) => {
        filterOptions.push(filter.column.id as string);
        filterOptions.push(filter.condition.id as string);
        filterOptions.push(filter.value);
      });
      table.push(filterOptions);
    }
  }
  return table;
}

function getAllTableConfigs(db: string, schemaId: number): TableConfig[] {
  return getRawTables(db).map((table) => parseTableConfig(table));
}

function getTableConfig(db: string, id: number): TableConfig {
  const table = getRawTables(db).find((entry) => entry[0] === id);
  if (table) {
    return parseTableConfig(table);
  }
  return null;
}

function getActiveTable(db: string): number {
  if (isInDBPath(db)) {
    return parseInt(router.location.query.get('a') as string, 10) || null;
  }
  return null;
}

function constructTableLink(id: number, options?: TableOptions) : string {
  const t = encodeURIComponent(`${JSON.stringify(prepareRawTableConfig(id, options))}`);
  const a = encodeURIComponent(id);
  return `?t=${t}&a=${a}`;
}

function addTable(
  db: string,
  id: number,
  options?: TableOptions,
): void {
  if (isInDBPath(db)) {
    const tables = getRawTables(db);
    const existingTable = tables.find((table) => table[0] === id);
    if (!existingTable) {
      const tableConfig = prepareRawTableConfig(id, options);
      if (
        typeof options?.position === 'number'
        && options?.position < tables.length
        && options?.position > -1
      ) {
        tables.splice(options.position, 0, tableConfig);
      } else {
        tables.push(tableConfig);
      }
      router.location.query.set('t', encodeURIComponent(JSON.stringify(tables)));
    }
    if (options?.status !== 'inactive') {
      router.location.query.set('a', encodeURIComponent(id));
    }
  }
}

function removeTable(db: string, id: number, activeTabId?: number): void {
  if (isInDBPath(db)) {
    const tables = getRawTables(db);
    const newTables = tables.filter((table) => table[0] !== id);
    if (newTables.length !== tables.length) {
      if (newTables.length > 0) {
        router.location.query.set('t', encodeURIComponent(JSON.stringify(newTables)));
      } else {
        router.location.query.delete('t');
      }
    }
    if (activeTabId && tables.find((table) => table[0] === activeTabId)) {
      router.location.query.set('a', encodeURIComponent(activeTabId));
    } else {
      router.location.query.delete('a');
    }
  }
}

function setTableOptions(db: string, id: number, options: TableOptions): void {
  const allTables = getRawTables(db);
  const tableIndex = allTables.findIndex((entry) => entry[0] === id);
  if (tableIndex > -1) {
    allTables[tableIndex] = prepareRawTableConfig(id, options);
    router.location.query.set('t', encodeURIComponent(JSON.stringify(allTables)));
  }
}

function removeActiveTable(db: string): void {
  if (isInDBPath(db)) {
    router.location.query.delete('a');
  }
}

export default {
  getTableConfig,
  getAllTableConfigs,
  setTableOptions,
  getActiveTable,
  constructTableLink,
  addTable,
  removeTable,
  removeActiveTable,
};
