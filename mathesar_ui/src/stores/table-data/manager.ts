import type { DBObjectEntry } from '@mathesar/AppTypes';
import type { TableEntry } from '@mathesar/api/tables/tableList';
import type { TabularDataProps } from './tabularData';
import { TabularData } from './tabularData';

const tableMap: Map<TableEntry['id'], TabularData> = new Map();

export function getTabularData(
  props: TabularDataProps,
): TabularData | undefined {
  return tableMap.get(props.id);
}

export function initTabularData(props: TabularDataProps): TabularData {
  let entry = tableMap.get(props.id);
  if (!entry) {
    entry = new TabularData(props);
    tableMap.set(props.id, entry);
  }
  return entry;
}

export function removeTabularData(id: DBObjectEntry['id']): void {
  // destroy all objects in table
  const entry = tableMap.get(id);
  if (entry) {
    entry.destroy();
    tableMap.delete(id);
  }
}
