<script lang="ts">
  import type { Writable } from 'svelte/store';

  import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import { SheetDataCell } from '@mathesar/components/sheet';
  import { makeCellId } from '@mathesar/components/sheet/cellIds';
  import type SheetSelection from '@mathesar/components/sheet/selection/SheetSelection';
  import { handleKeyboardEventOnCell } from '@mathesar/components/sheet/sheetKeyboardUtils';
  import type { QueryRow } from '../QueryRunner';
  import type { ProcessedQueryOutputColumn } from '../utils';

  export let column: ProcessedQueryOutputColumn;
  export let row: QueryRow | undefined;
  export let rowSelectionId: string;
  export let recordRunState: RequestStatus['state'] | undefined;
  export let selection: Writable<SheetSelection>;

  $: cellId = row && makeCellId(rowSelectionId, column.id);
</script>

<SheetDataCell
  columnIdentifierKey={column.id}
  cellSelectionId={cellId}
  selection={$selection}
  let:isActive
>
  {#if row || recordRunState === 'processing'}
    <CellFabric
      {isActive}
      columnFabric={column}
      value={row?.record[column.id]}
      showAsSkeleton={recordRunState === 'processing'}
      disabled={true}
      on:movementKeyDown={({ detail }) =>
        handleKeyboardEventOnCell(detail.originalEvent, selection)}
    />
  {/if}
</SheetDataCell>
