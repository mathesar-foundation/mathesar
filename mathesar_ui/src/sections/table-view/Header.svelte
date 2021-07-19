<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    faSortAmountDown,
    faSortAmountDownAlt,
    faThList,
  } from '@fortawesome/free-solid-svg-icons';
  import { Dropdown, Icon } from '@mathesar-components';
  import type {
    TableColumnData,
    ColumnPosition,
    TableColumn,
    SortOption,
    GroupOption,
  } from '@mathesar/stores/tableData';
  import {
    DEFAULT_COUNT_COL_WIDTH,
    GROUP_MARGIN_LEFT,
  } from '@mathesar/stores/tableData';

  const dispatch = createEventDispatcher();
  export let columns: TableColumnData;
  export let sort: SortOption = new Map();
  export let group: GroupOption = new Set();
  export let columnPosition: ColumnPosition = new Map();
  export let horizontalScrollOffset = 0;

  let paddingLeft: number;
  $: paddingLeft = group?.size > 0 ? GROUP_MARGIN_LEFT : 0;

  function sortByColumn(column: TableColumn, order: 'asc' | 'desc') {
    // Sorting is currently done as a single column sort
    // TODO: Implement multi column sort
    if (sort?.get(column.name) !== order) {
      const newSort: SortOption = new Map();
      newSort.set(column.name, order);
      sort = newSort;
      dispatch('reload');
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
    dispatch('reload');
  }
</script>

<div class="header" style="width:{columnPosition.get('__row').width + 160}px;
                            margin-left:{-horizontalScrollOffset}px">
  <div class="cell row-number" style="width:{DEFAULT_COUNT_COL_WIDTH + paddingLeft}px;">
  </div>

  {#each columns.data as column (column.name)}
    <div class="cell" style="
      width:{columnPosition.get(column.name).width}px;
      left:{columnPosition.get(column.name).left + paddingLeft}px;">
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
  <div class="cell" style="width:70px;left:{
      columnPosition.get('__row').width + paddingLeft
    }px;">
    <div class="add">
      +
    </div>
  </div>
</div>
