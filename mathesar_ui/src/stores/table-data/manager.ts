import { TabularType } from '@mathesar/App.d';
import type { DBObjectEntry, TableEntry, ViewEntry } from '@mathesar/App.d';
import { TabularData } from './tabularData';
import type { TabularDataParams } from './tabularData';

const tableMap: Map<TableEntry['id'], TabularData> = new Map();
const viewMap: Map<ViewEntry['id'], TabularData> = new Map();

export function getTabularContent(
  type: TabularType,
  id: DBObjectEntry['id'],
  params?: TabularDataParams,
): TabularData {
  const tabularMap = type === TabularType.View ? viewMap : tableMap;
  let entry = tabularMap.get(id);
  if (!entry) {
    entry = new TabularData(type, id, params);
    tabularMap.set(id, entry);
  }
  return entry;
}

export function removeTabularContent(type: TabularType, id: DBObjectEntry['id']): void {
  const tabularMap = type === TabularType.View ? viewMap : tableMap;
  // destroy all objects in table
  const entry = tabularMap.get(id);
  if (entry) {
    entry.destroy();
    tabularMap.delete(id);
  }
}
