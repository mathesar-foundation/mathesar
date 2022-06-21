<script lang="ts">
  import { onMount } from 'svelte';
  import type { ProcessedTableColumnMap } from '@mathesar/sections/table-view/utils';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data/tabularData';
  import type { Row } from '@mathesar/stores/table-data/records';
  import Cell from '@mathesar/components/cell/Cell.svelte';
  import CellArranger from './CellArranger.svelte';

  const tabularData = getTabularDataStoreFromContext();

  export let processedTableColumnsMap: ProcessedTableColumnMap;
  export let submit: (record: Row) => void;

  let selectionIndex = 0;

  $: ({ display } = $tabularData);
  $: recordsStore = $tabularData.recordsData.savedRecords;
  $: records = $recordsStore;
  $: ({ rowWidth } = display);

  function selectPrevious() {
    selectionIndex = Math.max(selectionIndex - 1, 0);
  }

  function selectNext() {
    selectionIndex = Math.min(selectionIndex + 1, records.length - 1);
  }

  function handleKeydown(e: KeyboardEvent) {
    let handled = true;
    switch (e.key) {
      case 'ArrowUp':
        selectPrevious();
        break;
      case 'ArrowDown':
        selectNext();
        break;
      case 'Enter':
        submit(records[selectionIndex]);
        break;
      default:
        handled = false;
    }

    if (handled) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeydown, { capture: true });
    };
  });
</script>

{#each records as row, index}
  {#if row.record}
    <div
      class="row"
      class:selected={index === selectionIndex}
      style={`width: ${$rowWidth}px;`}
    >
      <CellArranger
        {processedTableColumnsMap}
        {display}
        let:style
        let:processedColumn
      >
        <div class="cell" {style}>
          <Cell
            sheetColumn={processedColumn}
            value={row.record[processedColumn.column.id]}
          />
        </div>
      </CellArranger>
    </div>
  {/if}
{/each}

<style>
  .row {
    position: relative;
    height: 30px;
  }
  .cell {
    position: absolute;
  }
  .selected {
    background-color: #f0f0f0;
  }
</style>
