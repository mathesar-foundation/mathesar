import { tick } from 'svelte';

import { makeContext } from '@mathesar/component-library/common/utils/contextUtils';
import { EventHandler } from '@mathesar-component-library';

export class ImperativeFilterController extends EventHandler<{
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

export const imperativeFilterControllerContext =
  makeContext<ImperativeFilterController>();
