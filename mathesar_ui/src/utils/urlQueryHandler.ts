import { router } from 'tinro';
import type {
  GroupOption,
  SortOption,
  TableOptionsData,
} from '@mathesar/stores/tableData';

/**
 * Structure of url t=[
 *  [
 *    id,
 *    [sortcolumn1, sortorder, sortc2, sortorder2],
 *    [groupcolumn1, groupcolumn2],
 *    [filtercolumn, condition, value, op2, condition2]
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
  }
  return table;
}

function getAllTableConfigs(db: string): TableConfig[] {
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
