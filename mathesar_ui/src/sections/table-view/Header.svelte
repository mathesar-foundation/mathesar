<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    faSort,
    faSortUp,
    faSortDown,
  } from '@fortawesome/free-solid-svg-icons';
  import { Icon } from '@mathesar-components';
  import type {
    TableColumnData,
    TableColumn,
    SortOption,
  } from '@mathesar/stores/tableData';

  const dispatch = createEventDispatcher();
  export let columns: TableColumnData;
  export let sort: SortOption = new Map();

  function sortByColumn(column: TableColumn) {
    const order = sort?.get(column.name) === 'asc' ? 'desc' : 'asc';
    const newSort: SortOption = new Map();
    newSort.set(column.name, order);
    sort = newSort;
    dispatch('refetch');
  }
</script>

<thead>
  <tr>
    <th class="row-number"></th>
    {#each columns.data as column, index (column.name)}
      <th>
        {#if index > 0}
          <div class="drag-grip"></div>
        {/if}
        <div class="header" on:click={() => sortByColumn(column)}>
          <span class="type">
            {#if column.type === 'INTEGER'}
              #
            {:else if column.type === 'VARCHAR'}
              T
            {:else}
              i
            {/if}
          </span>
          <span class="name">{column.name}</span>

          {#if sort?.get(column.name) === 'asc'}
            <Icon class="sort" data={faSortUp}/>
          {:else if sort?.get(column.name) === 'desc'}
            <Icon class="sort" data={faSortDown}/>
          {:else}
            <Icon class="sort unsorted" data={faSort}/>
          {/if}
        </div>
      </th>
    {/each}
  </tr>
</thead>
