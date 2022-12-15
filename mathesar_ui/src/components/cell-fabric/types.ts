import type { ComponentAndProps } from '@mathesar-component-library/types';
import type { CellColumnLike } from './data-types/typeDefinitions';

export interface CellColumnFabric {
  id: string | number;
  column: CellColumnLike;
  cellComponentAndProps: ComponentAndProps;
}

export type { CellValueFormatter } from './data-types/components/typeDefinitions';
