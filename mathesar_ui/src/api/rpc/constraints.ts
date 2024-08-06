import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

interface BaseConstraint {
  oid: number;
  name: string;
  /** Each number is a column attnum */
  columns: number[];
}

export interface PkConstraint extends BaseConstraint {
  type: 'primary';
}

export interface UniqueConstraint extends BaseConstraint {
  type: 'unique';
}

export interface FkConstraint extends BaseConstraint {
  type: 'foreignkey';
  /** The ids of the columns in the table which this FK references */
  referent_columns: number[];
  /** The id of the table which this FK references */
  referent_table_oid: number;
}

export interface CheckConstraint extends BaseConstraint {
  type: 'check';
}

export interface ExcludeConstraint extends BaseConstraint {
  type: 'exclude';
}

export type Constraint =
  | PkConstraint
  | UniqueConstraint
  | FkConstraint
  | CheckConstraint
  | ExcludeConstraint;

export type ConstraintType = Constraint['type'];

export interface UniqueConstraintRecipe {
  type: 'u';
  name?: string | null;
  /** Values are column attnums */
  columns: number[];
}

export interface FkConstraintRecipe {
  type: 'f';
  name?: string | null;
  columns: number[];
  fkey_relation_id: number;
  fkey_columns: number[];
}

export type ConstraintRecipe = UniqueConstraintRecipe | FkConstraintRecipe;

export const constraints = {
  list: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
    },
    Constraint[]
  >(),

  add: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
      constraint_def_list: ConstraintRecipe[];
    },
    void
  >(),

  delete: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
      constraint_oid: number;
    },
    void
  >(),
};
