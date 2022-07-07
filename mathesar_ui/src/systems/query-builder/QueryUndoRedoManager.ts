import QueryListEntry from './QueryListEntry';
import QueryModel from './QueryModel';

export default class QueryUndoRedoManager {
  current: QueryListEntry;

  constructor(query: QueryModel) {
    this.current = new QueryListEntry(query.serialize());
  }

  pushState(query: QueryModel): QueryListEntry {
    if (this.current.next) {
      this.current.next.prev = null;
    }
    const newNext = new QueryListEntry(query.serialize());
    newNext.prev = this.current;
    this.current.next = newNext;
    this.current = newNext;
    return newNext;
  }

  undo(): QueryModel | undefined {
    if (this.current.prev !== null) {
      this.current = this.current.prev;
      return QueryModel.deserialize(this.current.serializedQuery);
    }
    return undefined;
  }

  redo(): QueryModel | undefined {
    if (this.current.next !== null) {
      this.current = this.current.next;
      return QueryModel.deserialize(this.current.serializedQuery);
    }
    return undefined;
  }
}
