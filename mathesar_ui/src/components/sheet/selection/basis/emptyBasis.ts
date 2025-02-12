import { ImmutableSet } from '@mathesar-component-library';

import type Basis from './Basis';

/**
 * This is used when no cells are selected. We try to avoid this state, but we
 * also allow for it because it makes it easier to construct selection instances
 * if we don't already have the full plane data.
 */
export function emptyBasis(): Basis {
  return {
    activeCellId: undefined,
    cellIds: new ImmutableSet(),
    columnIds: new ImmutableSet(),
    rowIds: new ImmutableSet(),
    getFullySelectedColumnIds: () => new ImmutableSet(),

    // If the selection is empty, we keep it empty.
    adaptToModifiedPlane: () => emptyBasis(),
  };
}
