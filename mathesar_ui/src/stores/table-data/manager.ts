import { get } from 'svelte/store';
import type { DBObjectEntry } from '@mathesar/AppTypes';
import type { TableEntry } from '@mathesar/api/tables/tableList';
import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
import type { TabularDataProps } from './tabularData';
import { TabularData } from './tabularData';

const tableMap: Map<TableEntry['id'], TabularData> = new Map();

export function getTabularData(
  props: TabularDataProps,
): TabularData | undefined {
  return tableMap.get(props.id);
}

export function initTabularData(props: TabularDataProps): TabularData {
  const abstractTypesMap = get(currentDbAbstractTypes).data;
  let entry = tableMap.get(props.id);
  if (!entry) {
    entry = new TabularData(props, abstractTypesMap);
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
