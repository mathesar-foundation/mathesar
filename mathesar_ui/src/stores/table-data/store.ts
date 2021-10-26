import type { Writable } from 'svelte/store';
import { TabularType } from '@mathesar/App.d';
import type { DBObjectEntry, TableEntry, ViewEntry } from '@mathesar/App.d';
import { Meta } from './meta';
import type { TableColumnData } from './columns';
import { Columns } from './columns';
import { Records } from './records';
import type { TableRecordData } from './records';
import { Display } from './display';
import type { ConstraintsData } from './constraints';
import { ConstraintsDataStore } from './constraints';

export interface TabularData {
  id: number,
  meta: Meta,
  columns: Columns,
  constraintsDataStore: ConstraintsDataStore,
  records: Records,
  display: Display,
}
export type TabularDataStore = Writable<TabularData>;
export interface TabularDataEntry extends TabularData {
  refresh: () => Promise<[TableColumnData, TableRecordData, ConstraintsData]>,
  destroy: () => void,
}

const tableMap: Map<TableEntry['id'], TabularDataEntry> = new Map();
const viewMap: Map<ViewEntry['id'], TabularDataEntry> = new Map();

function get(type: TabularType, id: DBObjectEntry['id']): TabularDataEntry {
  const tabularMap = type === TabularType.View ? viewMap : tableMap;
  let entry = tabularMap.get(id);
  if (!entry) {
    const meta = new Meta(type, id);
    const columns = new Columns(type, id, meta);
    const constraintsDataStore = new ConstraintsDataStore(id);
    const records = new Records(type, id, meta, columns);
    const display = new Display(type, id, meta, columns, records);

    entry = {
      id,
      meta,
      columns,
      constraintsDataStore,
      records,
      display,

      refresh() {
        return Promise.all([
          columns.fetch(),
          records.fetch(),
          constraintsDataStore.fetch(),
        ]);
      },

      destroy(): void {
        columns.destroy();
        constraintsDataStore.destroy();
        records.destroy();
        display.destroy();
      },
    };
    tabularMap.set(id, entry);
  }
  return entry;
}

function refresh(
  type: TabularType,
  id: DBObjectEntry['id'],
): ReturnType<TabularDataEntry['refresh']> {
  const tabularMap = type === TabularType.View ? viewMap : tableMap;
  const entry = tabularMap.get(id);
  if (!entry) {
    return Promise.reject(new Error('Unable to to find entry within tabularMap'));
  }
  return entry.refresh();
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

export function refreshTableContent(
  id: TableEntry['id'],
): ReturnType<TabularDataEntry['refresh']> {
  return refresh(TabularType.Table, id);
}

export function refreshViewContent(
  id: TableEntry['id'],
): ReturnType<TabularDataEntry['refresh']> {
  return refresh(TabularType.View, id);
}
