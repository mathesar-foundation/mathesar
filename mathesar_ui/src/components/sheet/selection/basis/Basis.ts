import type { ImmutableSet } from '@mathesar-component-library';

import type { Direction } from '../Direction';
import type Plane from '../Plane';

/**
 * This is the common polymorphic type implemented by other basis types which
 * store information about "which cells are selected" in various scenarios.
 *
 * Its properties have some redundancy for efficient and consistent lookup
 * across different kinds of selections.
 *
 * Due to the redundant nature of these properties you should be sure to only
 * instantiate a Basis using the utility functions in this directory. This will
 * ensure that the data is always valid.
 */
export default interface Basis {
  readonly activeCellId: string | undefined;
  readonly cellIds: ImmutableSet<string>;
  readonly rowIds: ImmutableSet<string>;
  readonly columnIds: ImmutableSet<string>;

  /** Ids of columns in which _all_ data cells are selected */
  getFullySelectedColumnIds(plane: Plane): ImmutableSet<string>;

  /**
   * Generate a new Basis instance that we should use after the plan has
   * changed.
   */
  adaptToModifiedPlane(p: { oldPlane: Plane; newPlane: Plane }): Basis;

  /**
   * Optionally, allows a basis to override the default "collapse and move"
   * behavior at the sheet level.
   */
  collapsedAndMoved?(direction: Direction, plane: Plane): Basis;
}
