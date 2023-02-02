import type { TableEntry } from '@mathesar/api/types/tables';
import {
  getImportPreviewPageUrl,
  getTablePageUrl,
} from '@mathesar/routes/urls';

export function isTableImportConfirmationRequired(
  table: Partial<Pick<TableEntry, 'import_verified' | 'data_files'>>,
): boolean {
  /**
   * table.import_verified can be null when tables have been
   * manually added to the db/already present in db in which
   * case we should not ask for re-confirmation.
   */
  return (
    table.import_verified === false &&
    table.data_files !== undefined &&
    table.data_files.length > 0
  );
}

export function getLinkForTableItem(
  databaseName: string,
  schemaId: number,
  table: Pick<TableEntry, 'import_verified' | 'data_files' | 'id'>,
) {
  if (isTableImportConfirmationRequired(table)) {
    return getImportPreviewPageUrl(databaseName, schemaId, table.id);
  }
  return getTablePageUrl(databaseName, schemaId, table.id);
}
