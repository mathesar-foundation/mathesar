import type { TableEntry } from '@mathesar/api/types/tables';
import type { Column } from '@mathesar/api/types/tables/columns';

/**
 * - 'dataEntry' - each row is a button that submits the recordId via a Promise.
 * - 'navigation' - each row is a hyperlink to a Record Page.
 */
export type RecordSelectorPurpose = 'dataEntry' | 'navigation';

/** What kind of row are we in? */
export type CellLayoutRowType = 'columnHeaderRow' | 'dataRow';
/** What kind of column are we in? */
export type CellLayoutColumnType = 'dataColumn' | 'rowHeaderColumn';

export type CellState = 'focused' | 'acquiringFkValue';

export function getColumnIdToFocusInitially({
  table,
  columns,
}: {
  table: TableEntry | undefined;
  columns: Column[];
}): number | undefined {
  function getFromRecordSummaryTemplate() {
    if (!table) {
      return undefined;
    }
    const { template } = table.settings.preview_settings;
    const match = template.match(/\{\d+\}/)?.[0] ?? undefined;
    if (!match) {
      return undefined;
    }
    const id = parseInt(match.slice(1, -1), 10);
    if (Number.isNaN(id)) {
      return undefined;
    }
    return id;
  }

  function getFromColumns() {
    const column = columns.find((c) => !c.primary_key);
    if (!column) {
      return undefined;
    }
    return column.id;
  }

  return getFromRecordSummaryTemplate() ?? getFromColumns();
}
