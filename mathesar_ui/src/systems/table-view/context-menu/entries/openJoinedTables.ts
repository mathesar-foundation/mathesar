import { get } from 'svelte/store';

import type { Table } from '@mathesar/models/Table';
import { getTablePageUrlByTable } from '@mathesar/routes/urls';
import type { JoinedColumn } from '@mathesar/stores/table-data';
import { currentTablesData } from '@mathesar/stores/tables';
import {
  component,
  hyperlinkMenuEntry,
  iconExternalLink,
} from '@mathesar-component-library';

import OpenNamedTable from '../labels/OpenNamedTable.svelte';

function getTableDetail(
  tableOid: number,
): { table: Table; href: string } | undefined {
  const table = get(currentTablesData).tablesMap.get(tableOid);
  if (!table) return undefined;
  const href = getTablePageUrlByTable(table);
  if (!href) return undefined;
  return {
    table,
    href,
  };
}

export function* openJoinedTables(p: { joinedColumn: JoinedColumn }) {
  const { targetTableOid, intermediateTableOid } = p.joinedColumn;

  const targetTable = getTableDetail(targetTableOid);
  if (targetTable) {
    yield hyperlinkMenuEntry({
      label: component(OpenNamedTable, { table: targetTable.table }),
      href: targetTable.href,
      icon: iconExternalLink,
    });
  }

  const intermediateTable = getTableDetail(intermediateTableOid);
  if (intermediateTable) {
    yield hyperlinkMenuEntry({
      label: component(OpenNamedTable, { table: intermediateTable.table }),
      href: intermediateTable.href,
      icon: iconExternalLink,
    });
  }
}
