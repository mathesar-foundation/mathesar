import type { CellColumnFabric } from '@mathesar/components/cell-fabric/types';
import type { AbstractTypePreprocFunctionDefinition } from '@mathesar/stores/abstract-types/types';

export interface ReadableMapLike<Key, Value> {
  size: number;
  get: (key: Key) => Value | undefined;
  keys(): IterableIterator<Key>;
  values(): IterableIterator<Value>;
}

export interface GroupEntryColumnLike
  extends Pick<CellColumnFabric, 'id' | 'column'> {
  preprocFunctions: AbstractTypePreprocFunctionDefinition[];
}
