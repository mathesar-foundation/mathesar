<script lang="ts">
  import {
    faChevronRight,
    faCog,
    faSortAmountDown,
    faSortAmountDownAlt,
    faThList,
  } from '@fortawesome/free-solid-svg-icons';
  import { Icon } from '@mathesar-components';
  import { createEventDispatcher } from 'svelte';
  import type {
    GroupOption,
    SortOption,
    TableColumn,
  } from '@mathesar/stores/tableData';
  import type { MathesarType } from '@mathesar/stores/databases';

  export let mathesarType: MathesarType;
  export let mathesarTypeIcon: string;
  export let sort: SortOption;
  export let group: GroupOption;
  export let column: TableColumn;
  export let isDataTypeOptionsOpen: boolean;

  const dispatch = createEventDispatcher();

  // eslint-disable-next-line @typescript-eslint/no-shadow
  function sortByColumn(column: TableColumn, order: 'asc' | 'desc') {
    const newSort: SortOption = new Map(sort);
    if (sort?.get(column.name) === order) {
      newSort.delete(column.name);
    } else {
      newSort.set(column.name, order);
    }
    sort = newSort;
    dispatch('reload');
  }

  // eslint-disable-next-line @typescript-eslint/no-shadow
  function groupByColumn(column: TableColumn) {
    const oldSize = group?.size || 0;
    const newGroup = new Set(group);
    if (newGroup?.has(column.name)) {
      newGroup.delete(column.name);
    } else {
      newGroup.add(column.name);
    }
    group = newGroup;
    /**
     * Only reset item positions when group layout is created or destroyed
     */
    dispatch('reload', {
      resetPositions: oldSize === 0 || group.size === 0,
    });
  }

</script>

<style lang="scss">
  h6 {
    color: gray;
  }
</style>

<div class="container">
  <h6 class="category">Data Type</h6>
  <button
    class="list-button with-right-icon"
    on:click={() => { isDataTypeOptionsOpen = true; }}
  >
    <div>
      <span class="data-icon">{mathesarTypeIcon}</span>
      <span>{mathesarType.name}</span>
    </div>
    <div>
      <Icon class="right-icon" data={faCog} />
      <Icon class="right-icon" data={faChevronRight} />
    </div>
  </button>
  <button
    class="list-button"
    on:click={() => sortByColumn(column, 'asc')}
  >
    <Icon class="opt" data={faSortAmountDownAlt} />
    <span>
      {#if sort?.get(column.name) === 'asc'}
        Remove asc sort
      {:else}
        Sort Ascending
      {/if}
    </span>
  </button>
  <button
    class="list-button"
    on:click={() => sortByColumn(column, 'desc')}
  >
    <Icon class="opt" data={faSortAmountDown} />
    <span>
      {#if sort?.get(column.name) === 'desc'}
        Remove desc sort
      {:else}
        Sort Descending
      {/if}
    </span>
  </button>
  <button
    class="list-button"
    on:click={() => groupByColumn(column)}
  >
    <Icon class="opt" data={faThList} />
    <span>
      {#if group?.has(column.name)}
        Remove grouping
      {:else}
        Group by column
      {/if}
    </span>
  </button>
</div>
