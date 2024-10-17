import type { Readable, Writable } from 'svelte/store';

import { EventHandler } from '@mathesar/component-library';
import PreventableEffectsStore from '@mathesar/stores/PreventableEffectsStore';

import type Plane from './Plane';
import SheetSelection from './SheetSelection';

export default class SheetSelectionStore
  extends EventHandler<{
    focus: void;
  }>
  implements Writable<SheetSelection>
{
  private selection: PreventableEffectsStore<SheetSelection, 'focus'>;

  private cleanupFunctions: (() => void)[] = [];

  constructor(plane: Readable<Plane>) {
    super();
    this.selection = new PreventableEffectsStore(new SheetSelection(), {
      focus: () => this.focus(),
    });
    this.cleanupFunctions.push(
      plane.subscribe((p) =>
        // Prevent auto-focusing the new active cell when the plane changes.
        // Originally I had allowed the auto-focus to happen, but it was causing
        // a [bug][1] in the Data Explorer. I think it makes sense to err on the
        // side of caution here and prevent the auto-focus. There might be some
        // cases where we want to auto-focus the new active cell, but we can
        // handle those cases imperatively as needed.
        //
        // [1]: https://github.com/mathesar-foundation/mathesar/issues/3955
        this.selection.update((s) => s.forNewPlane(p), { prevent: ['focus'] }),
      ),
    );
  }

  private focus(): void {
    void this.dispatch('focus');
  }

  subscribe(run: (value: SheetSelection) => void): () => void {
    return this.selection.subscribe(run);
  }

  update(getNewValue: (oldValue: SheetSelection) => SheetSelection): void {
    this.selection.update(getNewValue);
  }

  /**
   * Updates the selection while skipping the side effect of focusing the active
   * cell.
   */
  updateWithoutFocus(
    getNewValue: (oldValue: SheetSelection) => SheetSelection,
  ): void {
    this.selection.update(getNewValue, { prevent: ['focus'] });
  }

  set(value: SheetSelection): void {
    this.selection.set(value);
  }

  /**
   * Sets the selection while skipping the side effect of focusing the active
   * cell.
   */
  setWithoutFocus(value: SheetSelection): void {
    this.selection.update(() => value, { prevent: ['focus'] });
  }

  destroy(): void {
    super.destroy();
    this.cleanupFunctions.forEach((f) => f());
  }
}
