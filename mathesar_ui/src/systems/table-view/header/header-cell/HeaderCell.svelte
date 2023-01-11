<!-- 
  TODO: Implement the loader while renaming
  when implementing rename functionality
  using table inspector
 -->
<script lang="ts">
  import { Button, Icon } from '@mathesar-component-library';
  import {
    getTabularDataStoreFromContext,
    type ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import CellBackground from '@mathesar/components/CellBackground.svelte';
  import {
    iconFiltering,
    iconGrouping,
    iconSortAscending,
    iconSortDescending,
  } from '@mathesar/icons';

  export let processedColumn: ProcessedColumn;
  export let isSelected = false;

  const tabularData = getTabularDataStoreFromContext();
  $: ({ meta } = $tabularData);
  $: ({ filtering, sorting, grouping } = meta);

  $: hasFilter = $filtering.entries.some(
    (entry) => entry.columnId === processedColumn.id,
  );
  $: sorter = $sorting.get(processedColumn.id);
  $: grouped = $grouping.entries.some(
    (entry) => entry.columnId === processedColumn.id,
  );
</script>

<div class="header-cell-root">
  <CellBackground when={isSelected} color="var(--cell-bg-color-row-selected)" />
  <Button appearance="ghost" on:click on:mousedown on:mouseenter>
    <ProcessedColumnName {processedColumn} />
    {#if sorter || hasFilter || grouped}
      <div class="indicator-icons">
        {#if sorter}
          <Icon
            {...sorter === 'ASCENDING' ? iconSortAscending : iconSortDescending}
          />
        {/if}
        {#if hasFilter}
          <Icon {...iconFiltering} />
        {/if}
        {#if grouped}
          <Icon {...iconGrouping} />
        {/if}
      </div>
    {/if}
  </Button>
</div>

<style lang="scss">
  .header-cell-root {
    width: 100%;

    :global(button.btn) {
      width: 100%;
      padding: 0.26rem 0.5rem;
      font-size: inherit;
      justify-content: space-between;
    }

    .indicator-icons {
      display: flex;
      flex-direction: row;
      align-items: center;

      > :global(* + *) {
        margin-left: 0.25rem;
      }
    }
  }
</style>
