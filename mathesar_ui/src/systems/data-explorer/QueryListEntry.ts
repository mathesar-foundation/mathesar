import type { UnsavedQueryInstance } from '@mathesar/stores/queries';

export default class QueryListEntry {
  queryJSON: UnsavedQueryInstance;

  isValid: boolean;

  next: QueryListEntry | undefined = undefined;

  prev: QueryListEntry | undefined = undefined;

  constructor(queryJSON: UnsavedQueryInstance, isValid: boolean) {
    this.queryJSON = queryJSON;
    this.isValid = isValid;
  }
}
