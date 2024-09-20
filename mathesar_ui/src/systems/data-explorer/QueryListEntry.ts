import type { UnsavedExploration } from '@mathesar/api/rpc/explorations';

export default class QueryListEntry {
  queryJSON: UnsavedExploration;

  isValid: boolean;

  next: QueryListEntry | undefined = undefined;

  prev: QueryListEntry | undefined = undefined;

  constructor(queryJSON: UnsavedExploration, isValid: boolean) {
    this.queryJSON = queryJSON;
    this.isValid = isValid;
  }
}
