import { get } from 'svelte/store';
import type { Writable, Unsubscriber } from 'svelte/store';
import type { DBObjectEntry, TabularType } from '@mathesar/App.d';
import { EventHandler } from '@mathesar-component-library';
import type { MetaParams } from './meta';
import { Meta } from './meta';
import type { ColumnsData } from './columns';
import { ColumnsDataStore } from './columns';
import type { TableRecordsData } from './records';
import { RecordsData } from './records';
import { Display } from './display';
import type { ConstraintsData } from './constraints';
import { ConstraintsDataStore } from './constraints';

export type TabularDataParams = [
  TabularType,
  DBObjectEntry['id'],
  ...MetaParams
];

export class TabularData {
  type: TabularType;

  id: DBObjectEntry['id'];

  meta: Meta;

  columnsDataStore: ColumnsDataStore;

  constraintsDataStore: ConstraintsDataStore;

  recordsData: RecordsData;

  display: Display;

  eventHandler = new EventHandler();

  private metaParametersUnsubscriber: Unsubscriber;

  constructor(
    type: TabularType,
    id: DBObjectEntry['id'],
    params?: TabularDataParams,
  ) {
    this.type = type;
    this.id = id;
    this.meta = new Meta(type, id, params?.slice(2) as MetaParams);
    this.columnsDataStore = new ColumnsDataStore(type, id, this.meta);
    this.constraintsDataStore = new ConstraintsDataStore(id);
    this.recordsData = new RecordsData(
      type,
      id,
      this.meta,
      this.columnsDataStore,
    );
    this.display = new Display(
      type,
      id,
      this.meta,
      this.columnsDataStore,
      this.recordsData,
    );

    this.metaParametersUnsubscriber = this.meta.metaParameters.subscribe(() => {
      this.eventHandler.dispatch('paramsUpdated', this.parameterize());
    });
  }

  parameterize(): TabularDataParams {
    const metaParams = get(this.meta.metaParameters);
    return [this.type, this.id, ...metaParams];
  }

  refresh(): Promise<
    [
      ColumnsData | undefined,
      TableRecordsData | undefined,
      ConstraintsData | undefined,
    ]
  > {
    return Promise.all([
      this.columnsDataStore.fetch(),
      this.recordsData.fetch(),
      this.constraintsDataStore.fetch(),
    ]);
  }

  destroy(): void {
    // Destroy in reverse order of creation
    this.metaParametersUnsubscriber();
    this.display.destroy();
    this.recordsData.destroy();
    this.constraintsDataStore.destroy();
    this.columnsDataStore.destroy();
    this.eventHandler.destroy();
  }
}

export type TabularDataStore = Writable<TabularData>;
