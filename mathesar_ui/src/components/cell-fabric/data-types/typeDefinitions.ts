import type { Column } from '@mathesar/api/types/tables/columns';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import type { CellValueFormatter } from './components/typeDefinitions';

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
  | 'datetime'
  | 'array';

export type CellColumnLike = Pick<
  Column,
  'type' | 'type_options' | 'display_options'
>;

export interface CellComponentFactory<T = never> {
  get(
    column: CellColumnLike,
    config?: Record<string, unknown>,
  ): ComponentAndProps;
  getInput(
    column: CellColumnLike,
    config?: Record<string, unknown>,
  ): ComponentAndProps;
  getDisplayFormatter?(
    column: CellColumnLike,
    config?: Record<string, unknown>,
  ): CellValueFormatter<T>;
}
