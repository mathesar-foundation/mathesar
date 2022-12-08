import type { TableEntry } from '@mathesar/api/types/tables';
import type { FkConstraint } from '@mathesar/api/types/tables/constraints';
import type { ProcessedColumn } from '@mathesar/stores/table-data';

export type ColumnExtractionTargetType = 'newTable' | 'existingTable';

export interface ExtractColumnsImperativeProps {
  targetType: ColumnExtractionTargetType;
}

export interface LinkedTable {
  /** The foreign key constraint which links the two tables */
  constraint: FkConstraint;
  /** The columns specified in the FK constraint. */
  columns: ProcessedColumn[];
  /** The table to which the FK constraint points. */
  table: TableEntry;
}
