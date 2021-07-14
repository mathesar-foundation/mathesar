<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    faSortAmountDown,
    faSortAmountDownAlt,
    faThList,
  } from '@fortawesome/free-solid-svg-icons';
  import { Icon, Dropdown } from '@mathesar-components';
  import type {
    TableColumnData,
    TableColumn,
    SortOption,
    GroupOption,
    TableDisplayData,
  } from '@mathesar/stores/tableData';

  const dispatch = createEventDispatcher();
  export let columns: TableColumnData;
  export let sort: SortOption = new Map();
  export let group: GroupOption = new Set();
  export let columnPosition: TableDisplayData['columnPosition'] = new Map();
  export let horizontalScrollOffset = 0;

  $: lastColumn = columns.data[columns.data.length - 1].name;

  function sortByColumn(column: TableColumn, order: 'asc' | 'desc') {
    if (sort?.get(column.name) !== order) {
      const newSort: SortOption = new Map();
      newSort.set(column.name, order);
      sort = newSort;
      dispatch('refetch');
    }
  }

  function groupByColumn(column: TableColumn) {
    const newGroup = new Set(group);
    if (newGroup?.has(column.name)) {
      newGroup.delete(column.name);
    } else {
      newGroup.add(column.name);
    }
    group = newGroup;
    dispatch('refetch');
  }
</script>

<div class="header" style="width:{columnPosition.get('__row').width + 150}px;margin-left:{-horizontalScrollOffset}px">
  {#each columns.data as column, index (column.name)}
    <div class="cell" style="
      width:{columnPosition.get(column.name).width}px;
      left:{columnPosition.get(column.name).left}px;">
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

      <Dropdown closeOnInnerClick={true}
                triggerClass="opts" triggerAppearance="plain"
                contentClass="table-opts-content">
        <svelte:fragment slot="content">
          <ul>
            <li on:click={() => sortByColumn(column, 'asc')}>
              <Icon class="opt" data={faSortAmountDownAlt}/>
              <span>Sort Ascending</span>
            </li>
            <li on:click={() => sortByColumn(column, 'desc')}>
              <Icon class="opt" data={faSortAmountDown}/>
              <span>Sort Descending</span>
            </li>
            <li on:click={() => groupByColumn(column)}>
              <Icon class="opt" data={faThList}/>
              <span>Group by column</span>
            </li>
          </ul>
        </svelte:fragment>
      </Dropdown>
    </div>
  {/each}
  <div class="cell" style="width:200px;left:{
      columnPosition.get('__row').width
    }px;">
    <div class="add">
      +
    </div>
  </div>
</div>
