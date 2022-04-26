import type { Column } from '@mathesar/stores/table-data/types';
import type { ComponentAndProps } from '@mathesar-component-library/types';

// The types here are frontend types and are
// different from db types.
// One frontend type can map to multiple db types
// Yet to add: 'uri' | 'money' | 'date' | 'time' | 'datetime'
export type CellDataType = 'string' | 'boolean' | 'number';

export interface CellComponentFactory {
  get(
    column: Column,
    config?: Record<string, unknown>,
  ): ComponentAndProps<unknown>;
}
