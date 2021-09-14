import type { Writable } from 'svelte/store';
import { TabularType } from '@mathesar/App.d';
import type { DBObjectEntry, TableEntry, ViewEntry } from '@mathesar/App.d';
import { Meta } from './meta';
import { Columns } from './columns';
import { Records } from './records';
import { Display } from './display';

export interface TabularData {
  id: number,
  meta: Meta,
  columns: Columns,
  records: Records,
  display: Display,
}
export type TabularDataStore = Writable<TabularData>;
export interface TabularDataEntry extends TabularData {
  destroy: () => void
}

const tableMap: Map<TableEntry['id'], TabularDataEntry> = new Map();
const viewMap: Map<ViewEntry['id'], TabularDataEntry> = new Map();

function get(type: TabularType, id: DBObjectEntry['id'], metaInfo?: Meta): TabularData {
  const tabularMap = type === TabularType.View ? viewMap : tableMap;
  let entry = tabularMap.get(id);
  if (!entry) {
    const meta = new Meta(type, id);
    const columns = new Columns(type, id, meta);
    const records = new Records(type, id, meta, columns);
    const display = new Display(type, id);

    entry = {
      id,
      meta,
      columns,
      records,
      display,

      destroy(): void {
        columns.destroy();
        records.destroy();
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
    entry.records.destroy();
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
