import type { CellColumnFabric } from '@mathesar/components/cell-fabric/types';
import type { AbstractTypePreprocFunctionDefinition } from '@mathesar/stores/abstract-types/types';

export interface GroupEntryColumnLike
  extends Pick<CellColumnFabric, 'id' | 'column'> {
  preprocFunctions: AbstractTypePreprocFunctionDefinition[];
}
