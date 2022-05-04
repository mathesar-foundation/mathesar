import type { Column } from '@mathesar/stores/table-data/types';
import type { AbstractType } from '@mathesar/stores/abstract-types/types';
import type { getCellCap } from '@mathesar/components/cell/utils';

export interface SheetColumn {
  column: Column;
  abstractTypeOfColumn: AbstractType;
  cellCap: ReturnType<typeof getCellCap>; // CAP refers to ComponentAndProps
}
