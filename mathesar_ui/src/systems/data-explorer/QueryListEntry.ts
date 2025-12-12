import type { MaybeSavedExploration } from '@mathesar/api/rpc/explorations';

export default class QueryListEntry {
  queryJSON: MaybeSavedExploration;

  isValid: boolean;

  next: QueryListEntry | undefined = undefined;

  prev: QueryListEntry | undefined = undefined;

  constructor(queryJSON: MaybeSavedExploration, isValid: boolean) {
    this.queryJSON = queryJSON;
    this.isValid = isValid;
  }
}
