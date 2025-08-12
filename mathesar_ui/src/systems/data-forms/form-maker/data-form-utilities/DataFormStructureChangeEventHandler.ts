import type { DataFormPropChangeEvent } from './DataFormStructure';
import type {
  DataFormField,
  FkFieldPropChangeEvent,
  FormFieldContainerChangeEvent,
  ScalarFieldPropChangeEvent,
} from './fields';

type DataFormStructureChangeEvent =
  | DataFormPropChangeEvent
  | ScalarFieldPropChangeEvent
  | FkFieldPropChangeEvent
  | FormFieldContainerChangeEvent;

interface Callbacks {
  fieldAdded?: (f: DataFormField) => unknown;
  fieldDeleted?: (f: DataFormField) => unknown;
  allChanges?: () => unknown;
}

export class DataFormStructureChangeEventHandler {
  private callbacks?: Callbacks;

  constructor(callbacks?: Callbacks) {
    this.callbacks = callbacks;
  }

  trigger(e: DataFormStructureChangeEvent) {
    switch (e.type) {
      case 'fields/add':
        this.callbacks?.fieldAdded?.(e.field);
        break;
      case 'fields/delete':
        this.callbacks?.fieldDeleted?.(e.field);
        break;
      default:
        this.callbacks?.allChanges?.();
        break;
    }
  }
}
