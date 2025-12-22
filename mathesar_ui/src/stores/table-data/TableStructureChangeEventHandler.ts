import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';

export type TableStructureChangeEvent =
  | { type: 'column/renamed' }
  | { type: 'column/added' }
  | { type: 'column/deleted'; columnId: RawColumnWithMetadata['id'] }
  | { type: 'column/patched' }
  | { type: 'constraint/added' }
  | { type: 'constraint/removed' };

interface Callbacks {
  onColumnRenamed?: () => unknown;
  onColumnAdded?: () => unknown;
  onColumnDeleted?: (columnId: RawColumnWithMetadata['id']) => unknown;
  onColumnPatched?: () => unknown;
  onConstraintAdded?: () => unknown;
  onConstraintRemoved?: () => unknown;
  onAllChanges?: () => unknown;
}

export class TableStructureChangeEventHandler {
  private callbacks?: Callbacks;

  constructor(callbacks?: Callbacks) {
    this.callbacks = callbacks;
  }

  trigger(e: TableStructureChangeEvent) {
    this.callbacks?.onAllChanges?.();
    switch (e.type) {
      case 'column/renamed':
        this.callbacks?.onColumnRenamed?.();
        break;
      case 'column/added':
        this.callbacks?.onColumnAdded?.();
        break;
      case 'column/deleted':
        this.callbacks?.onColumnDeleted?.(e.columnId);
        break;
      case 'column/patched':
        this.callbacks?.onColumnPatched?.();
        break;
      case 'constraint/added':
        this.callbacks?.onConstraintAdded?.();
        break;
      case 'constraint/removed':
        this.callbacks?.onConstraintRemoved?.();
        break;
      default:
        break;
    }
  }
}
