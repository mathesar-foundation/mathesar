import type { Column } from '@mathesar/api/tables/columns';
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
  | 'money'
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
  ): ComponentAndProps;
  getInput(
    column: CellColumnLike,
    config?: Record<string, unknown>,
  ): ComponentAndProps;
}
