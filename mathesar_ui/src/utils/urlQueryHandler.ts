import { router } from 'tinro';

// Structure of url t=[[id,limit,page,filters]], a=id
// t -> tables, a -> active
// Null value represented for numbers as -1, strings as empty string

interface TableOptions {
  pageSize?: number,
  page?: number
}
interface TableConfig extends TableOptions {
  id: number,
}

function isInDBPath(db: string): boolean {
  const dbInURL = window.location.pathname.split('/')[1];
  return db === dbInURL;
}

function getRawTables(db: string): (string|number|string[])[][] {
  if (isInDBPath(db)) {
    const tableQuery = router.location.query.get('t') as string;
    return tableQuery ? JSON.parse(decodeURIComponent(tableQuery)) as [] : [];
  }
  return [];
}

function parseTableConfig(config: (string|number|string[])[]): TableConfig {
  const tableConfig: TableConfig = {
    id: parseInt(config[0] as string, 10),
  };

  if (config[1]) {
    const pageSize = parseInt(config[1] as string, 10);
    if (pageSize > -1) {
      tableConfig.pageSize = pageSize;
    }
  }

  if (config[2]) {
    const page = parseInt(config[2] as string, 10);
    if (page > -1) {
      tableConfig.page = page;
    }
  }

  return tableConfig;
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

function constructTableQuery(id: number, options?: TableOptions) : string {
  const table = [id];
  if (options) {
    table.push(options.pageSize || -1);
    table.push(options.page || -1);
  }
  const t = encodeURIComponent(`${JSON.stringify([table])}`);
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
      const tableConfig: (string|number|string[])[] = [id];
      if (options) {
        tableConfig.push(options.pageSize || -1);
        tableConfig.push(options.page || -1);
      }
      tables.push(tableConfig);
      router.location.query.set('t', encodeURIComponent(JSON.stringify(tables)));
    }
    router.location.query.set('a', encodeURIComponent(id));
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
  const table = allTables.find((entry) => entry[0] === id);
  if (table) {
    table[1] = options.pageSize || -1;
    table[2] = options.page || -1;
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
  constructTableQuery,
  addTable,
  removeTable,
  removeActiveTable,
};
