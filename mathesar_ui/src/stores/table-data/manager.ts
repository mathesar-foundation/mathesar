import type { DBObjectEntry, ViewEntry } from '@mathesar/AppTypes';
import type { TableEntry } from '@mathesar/api/tables/tableList';
import type { TabularDataProps } from './tabularData';
import { TabularData } from './tabularData';
import { TabularType } from './TabularType';

const tableMap: Map<TableEntry['id'], TabularData> = new Map();
const viewMap: Map<ViewEntry['id'], TabularData> = new Map();

export function getTabularContent(props: TabularDataProps): TabularData {
  const tabularMap = props.type === TabularType.View ? viewMap : tableMap;
  let entry = tabularMap.get(props.id);
  if (!entry) {
    entry = new TabularData(props);
    tabularMap.set(props.id, entry);
  }
  return entry;
}

export function removeTabularContent(
  type: TabularType,
  id: DBObjectEntry['id'],
): void {
  const tabularMap = type === TabularType.View ? viewMap : tableMap;
  // destroy all objects in table
  const entry = tabularMap.get(id);
  if (entry) {
    entry.destroy();
    tabularMap.delete(id);
  }
}
