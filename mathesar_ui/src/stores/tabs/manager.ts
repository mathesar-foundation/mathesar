import type { Database, SchemaEntry } from '@mathesar/App.d';
import { TabList } from './tabList';

const schemaTabsMap: Map<SchemaEntry['id'], TabList> = new Map();

export function getTabsForSchema(
  db: Database['name'],
  schemaId: SchemaEntry['id'],
): TabList {
  let tabList = schemaTabsMap.get(schemaId);
  if (!tabList) {
    tabList = new TabList(db, schemaId);
    schemaTabsMap.set(schemaId, tabList);
  }
  return tabList;
}

/**
 * Currently all open tabs are retained and do not get cleared when schema switches.
 * TODO:
 *  - Seriable tabList and persist in localstorage when schema switches
 *  - Only keep tabList object of current schema in memory
 *  - When schema switches back, get from localstorage, de-serialize, and load tabList
 */
export function clearTabsForSchema(schemaId: SchemaEntry['id']): void {
  const tabList = schemaTabsMap.get(schemaId);
  if (tabList) {
    tabList.destroy();
    schemaTabsMap.delete(schemaId);
  }
}
