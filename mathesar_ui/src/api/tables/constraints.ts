export type ConstraintType =
  | 'foreignkey'
  | 'primary'
  | 'unique'
  | 'check'
  | 'exclude';

export interface Constraint {
  id: number;
  name: string;
  type: ConstraintType;
  /**
   * Each number is a column id.
   */
  columns: number[];
}
