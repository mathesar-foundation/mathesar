import type { Column } from '@mathesar/stores/table-data/types';
import type { ComponentAndProps } from '@mathesar-component-library/types';

// The types here are frontend types and are
// different from db types.
// One frontend type can map to multiple db types
export type CellDataType =
  | 'string'
  | 'boolean'
  | 'number'
  | 'uri'
  | 'duration'
  | 'date'
  | 'time'
  | 'datetime';

export type CellColumnLike = Pick<
  Column,
  'type' | 'type_options' | 'display_options'
>;

export interface CellComponentFactory {
  get(
    column: CellColumnLike,
    config?: Record<string, unknown>,
  ): ComponentAndProps<unknown>;
  getInput(
    column: CellColumnLike,
    config?: Record<string, unknown>,
  ): ComponentAndProps<unknown>;
}
