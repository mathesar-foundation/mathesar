import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { TabularType, DBObjectEntry } from '@mathesar/App.d';

export interface ColumnPosition {
  width: number,
  left: number
}
export type ColumnPositionMap = Map<string, ColumnPosition>;

export class Display {
  _type: TabularType;

  _parentId: DBObjectEntry['id'];

  showDisplayOptions: Writable<boolean>;

  horizontalScrollOffset: Writable<number>;

  columnPositionMap: Writable<ColumnPositionMap>;

  constructor(
    type: TabularType,
    parentId: number,
  ) {
    this._type = type;
    this._parentId = parentId;
    this.showDisplayOptions = writable(false);
    this.horizontalScrollOffset = writable(0);
    this.columnPositionMap = writable(new Map() as ColumnPositionMap);
  }
}
