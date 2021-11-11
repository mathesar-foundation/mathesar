import type { Database, SchemaEntry } from '@mathesar/App';
import { TabList } from './tabList';

const schemaTabsMap: Map<SchemaEntry['id'], TabList> = new Map();

export function getTabsForSchema(db: Database['name'], schemaId: SchemaEntry['id']): TabList {
  let tabs = schemaTabsMap.get(schemaId);
  if (!tabs) {
    tabs = new TabList(db, schemaId);
    schemaTabsMap.set(schemaId, tabs);
  }
  return tabs;
}

export function clearTabsForSchema(schemaId: SchemaEntry['id']): void {
  schemaTabsMap.delete(schemaId);
}
