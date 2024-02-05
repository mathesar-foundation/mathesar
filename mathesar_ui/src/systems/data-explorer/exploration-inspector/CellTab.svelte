<script lang="ts">
  /**
   * @file
   *
   * NOTICE: There is some code duplication between this file and
   * `CellMode.svelte` used for the table view. It might be good to resolve this
   * duplication at some point. In the meantime, be mindful of propagating
   * changes to both files as necessary.
   */
  import { _ } from 'svelte-i18n';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import { parseCellId } from '@mathesar/components/sheet/cellIds';
  import QueryRunner, { getRowSelectionId } from '../QueryRunner';

  export let queryHandler: QueryRunner;

  $: ({ selection, processedColumns, rowsData } = queryHandler);
  $: ({ rows } = $rowsData);
  $: ({ activeCellId } = $selection);
  $: cell = activeCellId ? parseCellId(activeCellId) : undefined;
  $: columnId = cell?.columnId ?? '';
  // TODO: Usage of `find` is not ideal for perf here. Would be nice to store
  // rows in a map for faster lookup.
  $: row = rows.find((r) => getRowSelectionId(r) === cell?.rowId);
  $: cellValue = row?.record[columnId];
  $: column = $processedColumns.get(columnId);
</script>

<div class="section-content" class:has-content={cellValue !== undefined}>
  {#if cellValue !== undefined}
    <section class="cell-content">
      <header>{$_('content')}</header>
      <div class="content">
        {#if column}
          <CellFabric
            isIndependentOfSheet={true}
            disabled={true}
            columnFabric={column}
            value={cellValue}
          />
        {/if}
      </div>
    </section>
  {:else}
    {$_('select_cell_view_properties')}
  {/if}
</div>

<style lang="scss">
  .section-content {
    &.has-content {
      padding: var(--size-x-small);
    }
    .cell-content {
      header {
        font-weight: 500;
      }
      .content {
        white-space: pre-wrap;
        border: 1px solid var(--slate-300);
        padding: var(--size-xx-small);
        border-radius: var(--border-radius-m);
        margin-top: var(--size-x-small);
      }
    }
  }
</style>
