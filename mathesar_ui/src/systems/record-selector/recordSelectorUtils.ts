import type { Column } from '@mathesar/api/rpc/columns';
import type { Table } from '@mathesar/api/rpc/tables';

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
  table: Table | undefined;
  columns: Column[];
}): number | undefined {
  function getFromRecordSummaryTemplate() {
    if (!table) {
      return undefined;
    }
    const template = table?.metadata?.record_summary_template;
    if (!template) {
      throw new Error('TODO_RS_TEMPLATE');
      // TODO_RS_TEMPLATE
      //
      // We need to change the logic here to account for the fact that sometimes
      // the record summary template actually _will_ be missing. We need to
      // handle this on the client.
    }
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
