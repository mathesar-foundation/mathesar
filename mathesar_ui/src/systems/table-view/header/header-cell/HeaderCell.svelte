<!--
  TODO: Implement the loader while renaming
  when implementing rename functionality
  using table inspector
-->
<script lang="ts">
  import CellBackground from '@mathesar/components/CellBackground.svelte';
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import { getSheetColumnPosition } from '@mathesar/components/sheet';
  import {
    iconDescription,
    iconFiltering,
    iconGrouping,
    iconSortAscending,
    iconSortDescending,
  } from '@mathesar/icons';
  import {
    type ProcessedColumn,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { Icon, Tooltip } from '@mathesar-component-library';

  const tabularData = getTabularDataStoreFromContext();
  const widthThresholdForIcon = 72;

  export let processedColumn: ProcessedColumn;
  export let isSelected = false;

  $: ({ column } = processedColumn);
  $: ({ description } = column);
  $: id = processedColumn.id;
  $: ({ meta } = $tabularData);
  $: ({ filtering, sorting, grouping } = meta);
  $: hasFilter = $filtering.entries.some((entry) => entry.columnId === id);
  $: sorter = $sorting.get(id);
  $: grouped = $grouping.entries.some((entry) => entry.columnId === id);
  $: columnPosition = getSheetColumnPosition(String(column.id));
  $: hideIcon = (() => {
    if (!$columnPosition) return false;
    return $columnPosition.width < widthThresholdForIcon;
  })();
</script>

<div class="header-cell-root">
  <CellBackground when={isSelected} color="var(--cell-bg-color-row-selected)" />
  <div
    class="header-cell-btn btn btn-ghost"
    style="cursor: inherit;"
    on:click
    on:mousedown
    on:mouseenter
  >
    <ProcessedColumnName {hideIcon} {processedColumn} />
    {#if sorter || hasFilter || grouped || description}
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
        {#if description}
          <Tooltip>
            <Icon slot="trigger" {...iconDescription} />
            <div slot="content">{description}</div>
          </Tooltip>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .header-cell-btn {
    width: 100%;
    height: 100%;
  }
  .header-cell-root {
    width: 100%;
    height: 100%;
    cursor: inherit;
    :global(button.btn) {
      width: 100%;
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
