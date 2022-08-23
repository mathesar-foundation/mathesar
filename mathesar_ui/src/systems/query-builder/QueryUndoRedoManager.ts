import type { UnsavedQueryInstance } from '@mathesar/stores/queries';
import QueryListEntry from './QueryListEntry';
import QueryModel from './QueryModel';

export default class QueryUndoRedoManager {
  current: QueryListEntry | undefined;

  constructor(queryInfo?: { query: QueryModel; isValid: boolean }) {
    if (queryInfo) {
      const { query, isValid } = queryInfo;
      const json = JSON.parse(
        JSON.stringify(query.toJSON()),
      ) as UnsavedQueryInstance;
      this.current = new QueryListEntry(json, isValid);
    }
  }

  pushState(query: QueryModel, isValid: boolean): QueryListEntry {
    if (this.current && this.current.next) {
      this.current.next.prev = undefined;
    }
    const json = JSON.parse(
      JSON.stringify(query.toJSON()),
    ) as UnsavedQueryInstance;
    const newNode = new QueryListEntry(json, isValid);
    if (this.current && !this.current.isValid) {
      newNode.prev = this.current.prev;
    } else {
      newNode.prev = this.current;
      if (this.current) {
        this.current.next = newNode;
      }
    }
    this.current = newNode;
    return newNode;
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
