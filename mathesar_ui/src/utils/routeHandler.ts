import { router } from 'tinro';

// Structure of url t=[[id,limit,offset],[i,l,o]], a=id
// t -> tables, a -> active

export function getTableQuery(id: string) : string {
  const t = encodeURIComponent(`${JSON.stringify([[id]])}`);
  const a = encodeURIComponent(id);
  return `?t=${t}&a=${a}`;
}

export function isInTableContentView(db: string): boolean {
  const dbInURL = window.location.pathname.split('/')[1];
  return db === dbInURL;
}

export function openTableQuery(db: string, id: string): void {
  if (isInTableContentView(db)) {
    const tableQuery = router.location.query.get('t') as string;
    const tables: string[][] = tableQuery ? JSON.parse(decodeURIComponent(tableQuery)) as [] : [];
    const existingTable = tables.find((table) => table[0] === id);
    if (!existingTable) {
      tables.push([id]);
      router.location.query.set('t', encodeURIComponent(JSON.stringify(tables)));
    }
    router.location.query.set('a', encodeURIComponent(id));
  }
}

export function removeTableQuery(db: string, id: string, activeTabId?: string): void {
  if (isInTableContentView(db)) {
    const tableQuery = router.location.query.get('t') as string;
    const tables: string[][] = tableQuery ? JSON.parse(decodeURIComponent(tableQuery)) as [] : [];
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

export function removeActiveTableQuery(db: string): void {
  if (isInTableContentView(db)) {
    router.location.query.delete('a');
  }
}

export function getTablesFromQuery(tableQuery: string): string[][] {
  return tableQuery ? JSON.parse(decodeURIComponent(tableQuery)) as [] : [];
}
