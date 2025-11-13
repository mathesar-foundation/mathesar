import type { JoinableTable } from '@mathesar/api/rpc/tables';

export interface TableNode {
  tableOid: number;
  tableName: string;
  joinableTable: JoinableTable;
  columns: Array<{
    columnId: number;
    columnName: string;
    columnType: string;
  }>;
  children: TableNode[];
}
