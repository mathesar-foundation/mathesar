export type ConstraintType =
  | 'foreignkey'
  | 'primary'
  | 'unique'
  | 'check'
  | 'exclude';

export interface BasicConstraint {
  id: number;
  name: string;
  type: ConstraintType;
  /**
   * Each number is a column id.
   */
  columns: number[];
}

export interface FkConstraint extends BasicConstraint {
  type: 'foreignkey';
  /** The ids of the columns in the table which this FK references */
  referent_columns: number[];
  /** The id of the table which this FK references */
  referent_table: number;
  onupdate:
    | 'RESTRICT'
    | 'CASCADE'
    | 'SET NULL'
    | 'NO ACTION'
    | 'SET DEFAULT'
    | null;
  ondelete:
    | 'RESTRICT'
    | 'CASCADE'
    | 'SET NULL'
    | 'NO ACTION'
    | 'SET DEFAULT'
    | null;
  deferrable: boolean | null;
  match: 'SIMPLE' | 'PARTIAL' | 'FULL' | null;
}

export type Constraint = BasicConstraint | FkConstraint;
