import { getContext, setContext, tick } from 'svelte';

import { EventHandler } from '@mathesar-component-library';

export default class ImperativeFilterController extends EventHandler<{
  openDropdown: void;
  addFilter: number;
  activateLastFilterInput: void;
}> {
  async beginAddingNewFilteringEntry(columnId: number) {
    await this.dispatch('openDropdown');
    await tick();
    await this.dispatch('addFilter', columnId);
    await tick();
    await this.dispatch('activateLastFilterInput');
  }

  onOpenDropdown(fn: () => void): () => void {
    return this.on('openDropdown', fn);
  }

  onAddFilter(fn: (columnId: number) => void): () => void {
    return this.on('addFilter', fn);
  }

  onActivateLastFilterInput(fn: () => void): () => void {
    return this.on('activateLastFilterInput', fn);
  }
}

const key = Symbol('ImperativeFilterController');

export function setNewImperativeFilterControllerInContext(): ImperativeFilterController {
  const bus = new ImperativeFilterController();
  setContext(key, bus);
  return bus;
}

export function getImperativeFilterControllerFromContext():
  | ImperativeFilterController
  | undefined {
  return getContext(key);
}
