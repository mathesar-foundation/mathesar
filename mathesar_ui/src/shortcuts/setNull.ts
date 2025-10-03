import type {
  RowAdditionRecipe,
  RowModificationRecipe,
} from '@mathesar/stores/table-data/records';
import { get, type Writable } from 'svelte/store';
import type SheetSelection from '@mathesar/components/sheet/selection/SheetSelection';
import { arrayFrom, execPipe, map, take } from 'iter-tools';
import { startingFrom } from '@mathesar/utils/iterUtils';
import { getRowSelectionId, type RecordRow } from '@mathesar/stores/table-data';

export interface SetNullContext {
  getRecordRows: () => RecordRow[];
  bulkDml: (
    modificationRecipes: RowModificationRecipe[],
    additionRecipes?: RowAdditionRecipe[],
  ) => Promise<{ rowIds: string[]; columnIds: string[] }>;
}

export async function setNull(
  selectionStore: Writable<SheetSelection>,
  context: SetNullContext,
) {
  const selection = get(selectionStore);

  const rows = execPipe(
    context.getRecordRows(),
    (i) => startingFrom(i, (r) => selection.rowIds.has(getRowSelectionId(r))),
    take(selection.rowIds.size),
    arrayFrom,
  );

  const modificationRecipes = execPipe(
    rows,
    map((row) => ({
      row,
      cells: [
        ...map((columnId) => {
          return {
            columnId: columnId,
            value: null,
          };
        }, selection.columnIds),
      ],
    })),
    arrayFrom,
  );

  await context.bulkDml(modificationRecipes, []);
}
