import MessageBus from '@mathesar/utils/MessageBus';
import { getContext, setContext, tick } from 'svelte';

export default class ImperativeFilterController {
  private openDropdown: MessageBus<void>;

  private addFilter: MessageBus<number>;

  private activateLastFilterInput: MessageBus<void>;

  constructor() {
    this.openDropdown = new MessageBus();
    this.addFilter = new MessageBus();
    this.activateLastFilterInput = new MessageBus();
  }

  async beginAddingNewFilteringEntry(columnId: number) {
    this.openDropdown.send();
    await tick();
    this.addFilter.send(columnId);
    await tick();
    this.activateLastFilterInput.send();
  }

  onOpenDropdown(fn: () => void): () => void {
    return this.openDropdown.listen(fn);
  }

  onAddFilter(fn: (columnId: number) => void): () => void {
    return this.addFilter.listen(fn);
  }

  onActivateLastFilterInput(fn: () => void): () => void {
    return this.activateLastFilterInput.listen(fn);
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
