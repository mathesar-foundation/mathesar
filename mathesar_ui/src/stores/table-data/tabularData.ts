import type { Writable } from 'svelte/store';
import type { DBObjectEntry, TabularType } from '@mathesar/App.d';
import { Meta } from './meta';
import type { TableRecordsData } from './records';
import type { ColumnsData } from './columns';
import { ColumnsDataStore } from './columns';
import { RecordsData } from './records';
import { Display } from './display';
import type { ConstraintsData } from './constraints';
import { ConstraintsDataStore } from './constraints';

export class TabularData {
  private type: TabularType;

  id: DBObjectEntry['id'];

  meta: Meta;

  columnsDataStore: ColumnsDataStore;

  constraintsDataStore: ConstraintsDataStore;

  recordsData: RecordsData;

  display: Display;

  constructor(type: TabularType, id: DBObjectEntry['id']) {
    this.type = type;
    this.id = id;
    this.meta = new Meta(type, id);
    this.columnsDataStore = new ColumnsDataStore(type, id, this.meta);
    this.constraintsDataStore = new ConstraintsDataStore(id);
    this.recordsData = new RecordsData(type, id, this.meta, this.columnsDataStore);
    this.display = new Display(type, id, this.meta, this.columnsDataStore, this.recordsData);
  }

  refresh(): Promise<[ColumnsData, TableRecordsData, ConstraintsData]> {
    return Promise.all([
      this.columnsDataStore.fetch(),
      this.recordsData.fetch(),
      this.constraintsDataStore.fetch(),
    ]);
  }

  destroy(): void {
    // Destroy in reverse order of creation
    this.display.destroy();
    this.recordsData.destroy();
    this.constraintsDataStore.destroy();
    this.columnsDataStore.destroy();
  }
}

export type TabularDataStore = Writable<TabularData>;
