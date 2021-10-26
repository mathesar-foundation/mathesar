import type { Writable } from 'svelte/store';
import { TabularType } from '@mathesar/App.d';
import type { DBObjectEntry, TableEntry, ViewEntry } from '@mathesar/App.d';
import { Meta } from './meta';
import { ColumnsDataStore } from './columns';
import { RecordsData } from './records';
import { Display } from './display';

export interface TabularData {
  id: number,
  meta: Meta,
  columnsDataStore: ColumnsDataStore,
  recordsData: RecordsData,
  display: Display,
}
export type TabularDataStore = Writable<TabularData>;
export interface TabularDataEntry extends TabularData {
  destroy: () => void
}

const tableMap: Map<TableEntry['id'], TabularDataEntry> = new Map();
const viewMap: Map<ViewEntry['id'], TabularDataEntry> = new Map();

function get(type: TabularType, id: DBObjectEntry['id']): TabularData {
  const tabularMap = type === TabularType.View ? viewMap : tableMap;
  let entry = tabularMap.get(id);
  if (!entry) {
    const meta = new Meta(type, id);
    const columnsDataStore = new ColumnsDataStore(type, id, meta);
    const recordsData = new RecordsData(type, id, meta, columnsDataStore);
    const display = new Display(type, id, meta, columnsDataStore, recordsData);

    entry = {
      id,
      meta,
      columnsDataStore,
      recordsData,
      display,

      destroy(): void {
        columnsDataStore.destroy();
        recordsData.destroy();
        display.destroy();
      },
    };
    tabularMap.set(id, entry);
  }
  return entry;
}

export function remove(type: TabularType, id: DBObjectEntry['id']): void {
  const tabularMap = type === TabularType.View ? viewMap : tableMap;
  // destroy all objects in table
  const entry = tabularMap.get(id);
  if (entry) {
    entry.recordsData.destroy();
    tabularMap.delete(id);
  }
}

export function getTableContent(id: TableEntry['id']): TabularData {
  return get(TabularType.Table, id);
}

export function getViewContent(id: ViewEntry['id']): TabularData {
  return get(TabularType.View, id);
}

export function removeTableContent(id: TableEntry['id']): void {
  remove(TabularType.Table, id);
}

export function removeViewContent(id: ViewEntry['id']): void {
  remove(TabularType.View, id);
}
