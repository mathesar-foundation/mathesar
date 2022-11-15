import type { TableEntry } from '@mathesar/api/tables';

export function isTableImportConfirmationRequired(table: TableEntry): boolean {
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
