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
  get(
    column: CellColumnLike,
    config?: Record<string, unknown>,
  ): ComponentAndProps;
  getInput(
    column: CellColumnLike,
    config?: Record<string, unknown>,
  ): ComponentAndProps;
  getDisplayFormatter(
    column: CellColumnLike,
    config?: Record<string, unknown>,
  ): CellValueFormatter<unknown>;
}
