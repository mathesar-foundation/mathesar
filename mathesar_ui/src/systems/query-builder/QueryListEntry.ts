export default class QueryListEntry {
  serializedQuery: string;

  next: QueryListEntry | null = null;

  prev: QueryListEntry | null = null;

  constructor(serializedQuery: string) {
    this.serializedQuery = serializedQuery;
  }
}
