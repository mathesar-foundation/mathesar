<script lang="ts">
  import type { Writable } from 'svelte/store';

  import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import { SheetDataCell } from '@mathesar/components/sheet';
  import { makeCellId } from '@mathesar/components/sheet/cellIds';
  import type SheetSelection from '@mathesar/components/sheet/selection/SheetSelection';
  import { handleKeyboardEventOnCell } from '@mathesar/components/sheet/sheetKeyboardUtils';
  import { getRowSelectionId, type QueryRow } from '../QueryRunner';
  import type { ProcessedQueryOutputColumn } from '../utils';

  export let column: ProcessedQueryOutputColumn;
  export let row: QueryRow | undefined;
  export let recordRunState: RequestStatus['state'] | undefined;
  export let selection: Writable<SheetSelection>;

  $: cellId = row && makeCellId(getRowSelectionId(row), column.id);
  $: isActive = cellId === $selection.activeCellId;
</script>

<SheetDataCell
  columnIdentifierKey={column.id}
  cellSelectionId={cellId}
  {isActive}
>
  {#if row || recordRunState === 'processing'}
    <CellFabric
      {isActive}
      isSelected={$selection.cellIds.has(cellId ?? '')}
      columnFabric={column}
      value={row?.record[column.id]}
      showAsSkeleton={recordRunState === 'processing'}
      disabled={true}
      on:movementKeyDown={({ detail }) =>
        handleKeyboardEventOnCell(detail.originalEvent, selection)}
    />
  {/if}
</SheetDataCell>
