import type { RawDataFormSource } from '@mathesar/api/rpc/forms';

export class FormSource {
  rawSource: RawDataFormSource;

  constructor(rawSource: RawDataFormSource) {
    this.rawSource = rawSource;
  }

  getColumnInfo(tableOid: number, columnAttnum: number) {
    // TODO_FORMS: Do not let these errors break UI.

    const tableContainer = this.rawSource[tableOid];
    if (!tableContainer) {
      throw new Error(
        `Form source does not include table information for oid: ${tableOid}`,
      );
    }

    const columnInfo = tableContainer.columns[columnAttnum];
    if (!columnInfo) {
      throw new Error(
        `Form source does not include column information for table: ${tableOid}, column attnum: ${columnAttnum}`,
      );
    }

    return columnInfo;
  }
}
