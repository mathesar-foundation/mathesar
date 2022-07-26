export default class QueryListEntry {
  serializedQuery: string;

  next: QueryListEntry | undefined = undefined;

  prev: QueryListEntry | undefined = undefined;

  constructor(serializedQuery: string) {
    this.serializedQuery = serializedQuery;
  }
}
