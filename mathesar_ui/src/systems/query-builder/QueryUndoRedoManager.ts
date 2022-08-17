import QueryListEntry from './QueryListEntry';
import QueryModel from './QueryModel';

export default class QueryUndoRedoManager {
  current: QueryListEntry | undefined;

  constructor(query?: QueryModel) {
    if (query) {
      this.current = new QueryListEntry(query.toJSON());
    }
  }

  pushState(query: QueryModel): QueryListEntry {
    if (this.current && this.current.next) {
      this.current.next.prev = undefined;
    }
    const newNext = new QueryListEntry(query.toJSON());
    newNext.prev = this.current;
    if (this.current) {
      this.current.next = newNext;
    }
    this.current = newNext;
    return newNext;
  }

  isUndoPossible(): boolean {
    return !!this.current?.prev;
  }

  isRedoPossible(): boolean {
    return !!this.current?.next;
  }

  undo(): QueryModel | undefined {
    if (this.current && this.current.prev) {
      this.current = this.current.prev;
      return new QueryModel(this.current.queryJSON);
    }
    return undefined;
  }

  redo(): QueryModel | undefined {
    if (this.current && this.current.next) {
      this.current = this.current.next;
      return new QueryModel(this.current.queryJSON);
    }
    return undefined;
  }
}
