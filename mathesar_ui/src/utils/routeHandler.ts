import { router } from 'tinro';

interface TableQuery {
  i: string,
  l?: number,
  o?: number
}

interface OpenTables {
  tables: TableQuery[],
  activeTable: string
}

export function getTableQuery(id: string) : string {
  return encodeURIComponent(`t=${JSON.stringify([{ i: id }])}&a=${id}`);
}

export function isInTableContentView(db: string): boolean {
  return window.location.pathname.indexOf(`${db}/content`) > -1;
}

export function openTable(db: string, id: string): void {
  if (isInTableContentView(db)) {
    const tableQuery = router.location.query.get('t') as string;
    const tables: TableQuery[] = tableQuery ? JSON.parse(decodeURIComponent(tableQuery)) as [] : [];
    const existingTable = tables.find((table) => table.i === id);
    if (!existingTable) {
      tables.push({
        i: id,
      });
      router.location.query.set('t', encodeURIComponent(JSON.stringify(tables)));
    }
    router.location.query.set('a', encodeURIComponent(id));
  }
}

export function getOpenTables(): OpenTables {
  const tableQuery = router.location.query.get('t') as string;
  const tables: TableQuery[] = tableQuery ? JSON.parse(decodeURIComponent(tableQuery)) as [] : [];
  const activeTable = router.location.query.get('a') as string;
  return {
    tables,
    activeTable,
  };
}
