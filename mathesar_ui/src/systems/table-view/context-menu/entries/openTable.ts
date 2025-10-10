import { get } from 'svelte/store';

import { iconTable } from '@mathesar/icons';
import type { Table } from '@mathesar/models/Table';
import { storeToGetTablePageUrl } from '@mathesar/stores/storeBasedUrls';
import type { ProcessedColumn } from '@mathesar/stores/table-data';
import { currentTablesData } from '@mathesar/stores/tables';
import { component, hyperlinkMenuEntry } from '@mathesar-component-library';

import OpenNamedTable from '../labels/OpenNamedTable.svelte';

/**
 * This method returns information about a table linked through a FK to a
 * selected column, if it exists.
 */
function getLinkedTableDetail(
  column: ProcessedColumn,
): { table: Table; href: string } | undefined {
  const { linkFk } = column;
  if (!linkFk) return undefined;
  const linkedTable = get(currentTablesData).tablesMap.get(
    linkFk.referent_table_oid,
  );
  if (!linkedTable) return undefined;
  const getTablePageUrl = get(storeToGetTablePageUrl);
  const linkedTableHref = getTablePageUrl({ tableId: linkedTable.oid });
  if (!linkedTableHref) return undefined;
  return {
    table: linkedTable,
    href: linkedTableHref,
  };
}

export function* openTable(p: { column: ProcessedColumn }) {
  const linkedTable = getLinkedTableDetail(p.column);
  if (linkedTable) {
    yield hyperlinkMenuEntry({
      label: component(OpenNamedTable, { name: linkedTable.table.name }),
      href: linkedTable.href,
      icon: iconTable,
    });
  }
}
