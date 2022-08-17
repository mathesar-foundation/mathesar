import type { UnsavedQueryInstance } from '@mathesar/stores/queries';

export default class QueryListEntry {
  queryJSON: UnsavedQueryInstance;

  next: QueryListEntry | undefined = undefined;

  prev: QueryListEntry | undefined = undefined;

  constructor(queryJSON: UnsavedQueryInstance) {
    this.queryJSON = queryJSON;
  }
}
