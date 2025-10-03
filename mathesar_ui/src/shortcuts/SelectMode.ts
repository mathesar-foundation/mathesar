import type { ShortcutsMode } from '@mathesar/stores/shortcuts';
import { setNull, type SetNullContext } from '@mathesar/shortcuts/setNull';
import type { Writable } from 'svelte/store';
import type SheetSelection from '@mathesar/components/sheet/selection/SheetSelection';

interface Dependencies {
  selection: Writable<SheetSelection>;
  setNullContext: SetNullContext;
}

export class SelectMode implements ShortcutsMode {
  private readonly deps: Dependencies;

  constructor(deps: Dependencies) {
    this.deps = deps;
  }

  async handleKeyDown(e: KeyboardEvent): Promise<void> {
    if (e.shiftKey) {
      switch (e.key) {
        case 'Delete':
          await setNull(this.deps.selection, this.deps.setNullContext);
          break;
      }
    }
  }
}
