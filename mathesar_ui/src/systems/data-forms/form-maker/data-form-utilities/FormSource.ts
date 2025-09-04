import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
import type { RawDataFormSource } from '@mathesar/api/rpc/forms';
import { ClientSideError } from '@mathesar/components/errors/errorUtils';

import { dataFormErrorCodes, dataFormErrors } from './fields';

export class FormSource {
  rawSource: RawDataFormSource;

  constructor(rawSource: RawDataFormSource) {
    this.rawSource = rawSource;
  }

  getColumnInfo(tableOid: number, columnAttnum: number): RawColumnWithMetadata {
    const column = this.rawSource[tableOid]?.columns?.[columnAttnum];
    if (!column) {
      throw dataFormErrors.columnNotFoundError({
        tableOid,
        columnAttnum,
      });
    }
    if ('error' in column) {
      if (column.error.code === dataFormErrorCodes.COLUMN_NOT_FOUND) {
        throw dataFormErrors.columnNotFoundError({
          tableOid,
          columnAttnum,
        });
      }
      throw ClientSideError.fromAnything(column.error);
    }
    return column;
  }
}
