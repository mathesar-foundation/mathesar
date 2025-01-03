import type { ComponentAndProps } from '@mathesar-component-library/types';

import type {
  CellColumnLike as CellColumnLikeInner,
  CellValueFormatter,
} from './components/typeDefinitions';

export type CellColumnLike = CellColumnLikeInner;

// The types here are frontend types and are
// different from db types.
// One frontend type can map to multiple db types
export type SimpleCellDataTypes =
  | 'string'
  | 'boolean'
  | 'number'
  | 'uri'
  | 'duration'
  | 'date'
  | 'money'
  | 'time'
  | 'datetime';

export type CompoundCellDataTypes = 'array';

export type CellDataType = SimpleCellDataTypes | CompoundCellDataTypes;

export interface CellComponentFactory {
  initialInputValue?: unknown;

  /**
   * Get the component used to render the cell
   */
  get(
    column: CellColumnLike,
    config?: Record<string, unknown>,
  ): ComponentAndProps;

  /** Get the component used to render an input when the user is adding or
   * editing a value of this type. This is used on the record page, and default
   * value, for example.
   */
  getInput(
    column: CellColumnLike,
    config?: Record<string, unknown>,
  ): ComponentAndProps;

  /**
   * Implement this method in order to customize the input used within filter
   * conditions. If not implemented, then we fall back to using the `getInput`
   * method. Custom filter input components are useful when we want slightly
   * different behavior for searching vs data entry. See [issue #4052][4052] for
   * an example.
   *
   * [4052]: https://github.com/mathesar-foundation/mathesar/issues/4052
   */
  getFilterInput?(
    column: CellColumnLike,
    config?: Record<string, unknown>,
  ): ComponentAndProps;

  getDisplayFormatter(
    column: CellColumnLike,
    config?: Record<string, unknown>,
  ): CellValueFormatter<unknown>;
}
