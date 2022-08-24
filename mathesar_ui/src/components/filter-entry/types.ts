import type { CellColumnFabric } from '@mathesar/components/cell-fabric/types';
import type { getFiltersForAbstractType } from '@mathesar/stores/abstract-types';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import type { AbstractType } from '@mathesar/stores/abstract-types/types';

export interface FilterEntryColumnLike
  extends Pick<CellColumnFabric, 'id' | 'column'> {
  abstractType: AbstractType;
  allowedFiltersMap: ReturnType<typeof getFiltersForAbstractType>;
  inputComponentAndProps: ComponentAndProps;
}
