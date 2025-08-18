import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
import type { RawDataFormSource } from '@mathesar/api/rpc/forms';

export class FormSource {
  rawSource: RawDataFormSource;

  constructor(rawSource: RawDataFormSource) {
    this.rawSource = rawSource;
  }

  getColumnInfo(
    tableOid: number,
    columnAttnum: number,
  ): RawColumnWithMetadata | undefined {
    const tableContainer = this.rawSource[tableOid];
    if (!tableContainer) {
      return undefined;
    }
    return tableContainer.columns[columnAttnum];
  }
}
