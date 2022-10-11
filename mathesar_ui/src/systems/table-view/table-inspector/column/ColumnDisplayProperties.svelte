<script lang="ts">
  import { Icon, Button } from '@mathesar-component-library';
  import {
    iconSortDescending,
    iconSortAscending,
    iconGrouping,
  } from '@mathesar/icons';
  import {
    Meta,
    SortDirection,
    type ProcessedColumn,
  } from '@mathesar/stores/table-data';

  export let column: ProcessedColumn;
  export let meta: Meta;

  $: ({ sorting, grouping } = meta);
  $: sortDirection = $sorting.get(column.id);
  $: hasGrouping = $grouping.hasColumn(column.id);

  function handleSort(order: SortDirection) {
    if (sortDirection === order) {
      sorting.update((s) => s.without(column.id));
    } else {
      sorting.update((s) => s.with(column.id, order));
    }
  }

  function toggleGroup() {
    if (hasGrouping) {
      grouping.update((g) => g.withoutColumn(column.id));
    } else {
      grouping.update((g) =>
        g.withEntry({
          columnId: column.id,
        }),
      );
    }
  }
</script>

<div class="properties-container">
  <Button appearance="plain" on:click={() => handleSort(SortDirection.A)}>
    <Icon class="opt" {...iconSortAscending} />
    <span>
      {#if sortDirection === SortDirection.A}
        Remove asc sort
      {:else}
        Sort Ascending
      {/if}
    </span>
  </Button>
  <Button appearance="plain" on:click={() => handleSort(SortDirection.D)}>
    <Icon class="opt" {...iconSortDescending} />
    <span>
      {#if sortDirection === SortDirection.D}
        Remove desc sort
      {:else}
        Sort Descending
      {/if}
    </span>
  </Button>
  <Button appearance="plain" on:click={toggleGroup}>
    <Icon class="opt" {...iconGrouping} />
    <span>
      {#if hasGrouping}
        Remove grouping
      {:else}
        Group by column
      {/if}
    </span>
  </Button>
</div>

<style>
  .properties-container {
    padding: 0.5rem -0.5rem;
    display: flex;
    flex-direction: column;
  }
</style>
