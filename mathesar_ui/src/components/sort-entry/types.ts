import type { AbstractType } from '@mathesar/stores/abstract-types/types';
import type { CellColumnFabric } from '../cell-fabric/types';

export interface SortEntryColumnLike
  extends Pick<CellColumnFabric, 'id' | 'column'> {
  abstractType: AbstractType;
}
