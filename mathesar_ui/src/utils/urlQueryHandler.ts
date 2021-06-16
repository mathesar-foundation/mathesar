import { router } from 'tinro';

// Structure of url t=[[id,limit,page,filters]], a=id
// t -> tables, a -> active
// Null value represented for numbers as -1, strings as empty string

interface TableConfig {
  id: number,
  pageSize?: number,
  page?: number
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
  return {
    id: parseInt(config[0] as string, 10),
    pageSize: config[1] ? parseInt(config[1] as string, 10) : null,
    page: config[2] ? parseInt(config[2] as string, 10) : null,
  };
}

function getTables(db: string): TableConfig[] {
  return getRawTables(db).map((table) => parseTableConfig(table));
}

function getActiveTable(db: string): number {
  if (isInDBPath(db)) {
    return parseInt(router.location.query.get('a') as string, 10) || null;
  }
  return null;
}

function constructTableQuery(id: number) : string {
  const t = encodeURIComponent(`${JSON.stringify([[id]])}`);
  const a = encodeURIComponent(id);
  return `?t=${t}&a=${a}`;
}

function addTable(
  db: string,
  id: number,
  options?: { pageSize?: number, page?: number },
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

function getTableConfig(db: string, id: number): { pageSize?: number, page?: number } {
  if (isInDBPath(db)) {
    const tables = getRawTables(db);
    const existingTable = tables.find((table) => table[0] === id);
    return existingTable ? {
      pageSize: existingTable[1] as number,
      page: existingTable[2] as number,
    } : null;
  }
  return null;
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

function removeActiveTable(db: string): void {
  if (isInDBPath(db)) {
    router.location.query.delete('a');
  }
}

export default {
  getTables,
  getActiveTable,
  constructTableQuery,
  addTable,
  getTableConfig,
  removeTable,
  removeActiveTable,
};
