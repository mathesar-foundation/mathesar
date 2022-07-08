import type { Column } from './columns';

type SimpleColumn = Pick<
  Column,
  'id' | 'name' | 'type' | 'type_options' | 'display_options'
>;

export interface TableEntry {
  id: number;
  name: string;
  schema: number;
  import_verified: boolean;
  data_files?: number[];
  columns: SimpleColumn[];
}
