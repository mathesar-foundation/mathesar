import { getContext, setContext } from 'svelte';

export interface FilterControls<T> {
  open: () => void;
  close: () => void;
  beginAddingFilter: (columnId: T) => Promise<void>;
}

export class FilterDropdownController<T> {
  filterDropdownControls: FilterControls<T> | undefined;

  setControls(controls: FilterControls<T>) {
    this.filterDropdownControls = controls;
  }

  async beginAddingFilter(columnId: T) {
    if (this.filterDropdownControls) {
      this.filterDropdownControls.open();
      await this.filterDropdownControls.beginAddingFilter(columnId);
    }
  }
}

const key = Symbol('FilterDropdownController');

export function setFilterDropdownControllerInContext(
  controller: FilterDropdownController<unknown>,
): FilterDropdownController<unknown> {
  setContext(key, controller);
  return controller;
}

export function getFilterDropdownControllerFromContext():
  | FilterDropdownController<unknown>
  | undefined {
  return getContext(key);
}
