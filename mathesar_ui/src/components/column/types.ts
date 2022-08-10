import type {
  CellColumnLike,
  ConstraintType,
} from '../cell-fabric/data-types/typeDefinitions';

// Since the ColumnName component is being used
// in Tables, Queries & DataImport and many more in the future
// this type ensures that only the data required for displaying column name
// is being passed
export type DisplayColumn = CellColumnLike & {
  name: string;
  constraintsType?: ConstraintType[];
};
