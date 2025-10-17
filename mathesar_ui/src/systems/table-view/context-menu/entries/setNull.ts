import { execPipe, filter, map, some } from 'iter-tools';
import { get } from 'svelte/store';

import { iconSetToNull } from '@mathesar/icons';
import { confirm } from '@mathesar/stores/confirmation';
import type { TabularData } from '@mathesar/stores/table-data';
import type { RowModificationRecipe } from '@mathesar/stores/table-data/records';
import { buttonMenuEntry, component } from '@mathesar-component-library';

import SetToNull from '../labels/SetToNull.svelte';

export function* setNull(p: { tabularData: TabularData; cellIds: string[] }) {
  const icon = iconSetToNull;

  const fallback = buttonMenuEntry({
    icon,
    label: component(SetToNull, { cellCount: 1 }),
    disabled: true,
    onClick: () => {},
  });

  const canUpdateRecords = get(p.tabularData.canUpdateRecords);
  if (!canUpdateRecords) {
    yield fallback;
    return;
  }

  const cellCount = p.cellIds.length;

  const { rowIds, columnIds } = get(p.tabularData.selection);
  const selectedRows = get(p.tabularData.recordsData.selectableRowsMap);
  const columnsInTable = get(p.tabularData.processedColumns);

  const someColumnRefuses = execPipe(
    columnIds,
    map((columnId) => columnsInTable.get(parseInt(columnId, 10))),
    filter((column) => !!column),
    some((column) => !column?.isEditable || !column?.column.nullable),
  );
  if (someColumnRefuses) {
    yield fallback;
    return;
  }

  function* getRecipes(): Generator<RowModificationRecipe> {
    for (const rowId of rowIds) {
      const row = selectedRows.get(rowId);
      if (!row) continue;
      yield {
        row,
        cells: [...columnIds].map((columnId) => ({ columnId, value: null })),
      };
    }
  }

  const selectionContainsSomeValue = execPipe(
    getRecipes(),
    some(({ row, cells }) =>
      execPipe(
        cells,
        some(({ columnId }) => row.record[columnId] !== null),
      ),
    ),
  );
  if (!selectionContainsSomeValue) {
    yield fallback;
    return;
  }

  async function handleClick() {
    if (cellCount > 1) {
      const confirmed = await confirm({
        title: component(SetToNull, { cellCount }),
      });
      if (!confirmed) return;
    }
    await p.tabularData.recordsData.bulkUpdate([...getRecipes()]);
  }

  yield buttonMenuEntry({
    icon: iconSetToNull,
    label: component(SetToNull, { cellCount }),
    onClick: () => {
      void handleClick();
    },
  });
}
