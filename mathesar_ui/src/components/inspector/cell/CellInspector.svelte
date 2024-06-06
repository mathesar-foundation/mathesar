<script lang="ts">
  import { _ } from 'svelte-i18n';

  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';

  import type { SelectedCellData } from './cellInspectorUtils';

  export let selectedCellData: SelectedCellData;

  $: ({ activeCellData } = selectedCellData);

  // TODO:
  //
  // - Add two collapsible sections: "Active Cell" and "Selected Cells". This
  //   will require some refactoring of the collapsible sections code to do this
  //   cleanly. Ideally we should extract that code out from the table inspector
  //   and Data Explorer inspector and put it here.
  //
  // - Utilize `selectedCellData.selectionData` to display the count of
  //   selected cells.
  //
  // - Add other computed aggregate values for the selected cells, such as
  //   average, sum, etc.
</script>

<div class="cell-inspector">
  {#if activeCellData}
    {@const { column, value, recordSummary } = activeCellData}
    <section class="active-cell">
      <header class="header">{$_('content')}</header>
      <div class="content">
        {#if column}
          <CellFabric
            isIndependentOfSheet={true}
            disabled={true}
            columnFabric={column}
            {value}
            {recordSummary}
          />
        {/if}
      </div>
    </section>
  {:else}
    {$_('select_cell_view_properties')}
  {/if}
</div>

<style>
  .cell-inspector {
    padding: var(--size-x-small);
  }
  .header {
    font-weight: 500;
  }
  .content {
    white-space: pre-wrap;
    border: 1px solid var(--slate-300);
    padding: var(--size-xx-small);
    border-radius: var(--border-radius-m);
    margin-top: var(--size-x-small);
  }
</style>
