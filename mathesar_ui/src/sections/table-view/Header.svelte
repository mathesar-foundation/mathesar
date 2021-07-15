<script lang="ts">
  import { Dropdown } from '@mathesar-components';
  import type {
    TableColumnData,
    TableDisplayData,
  } from '@mathesar/stores/tableData';
  import {
    DEFAULT_COUNT_COL_WIDTH,
  } from '@mathesar/stores/tableData';

  // const dispatch = createEventDispatcher();
  export let columns: TableColumnData;
  // export let sort: SortOption = new Map();
  // export let group: GroupOption = new Set();
  export let columnPosition: TableDisplayData['columnPosition'] = new Map();
  export let horizontalScrollOffset = 0;

  // Sorting logic commented until ready to use
  // function sortByColumn(column: TableColumn, order: 'asc' | 'desc') {
  //   if (sort?.get(column.name) !== order) {
  //     const newSort: SortOption = new Map();
  //     newSort.set(column.name, order);
  //     sort = newSort;
  //     dispatch('refetch');
  //   }
  // }

  // Grouping logic commented until ready to use
  // function groupByColumn(column: TableColumn) {
  //   const newGroup = new Set(group);
  //   if (newGroup?.has(column.name)) {
  //     newGroup.delete(column.name);
  //   } else {
  //     newGroup.add(column.name);
  //   }
  //   group = newGroup;
  //   dispatch('refetch');
  // }
</script>

<div class="header" style="width:{columnPosition.get('__row').width + 160}px;margin-left:{-horizontalScrollOffset}px">
  <div class="cell row-number" style="width:{DEFAULT_COUNT_COL_WIDTH}px">
  </div>

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
            <!-- <li on:click={() => sortByColumn(column, 'asc')}>
              <Icon class="opt" data={faSortAmountDownAlt}/>
              <span>Sort Ascending</span>
            </li>
            <li on:click={() => sortByColumn(column, 'desc')}>
              <Icon class="opt" data={faSortAmountDown}/>
              <span>Sort Descending</span>
            </li> -->
            <!-- <li on:click={() => groupByColumn(column)}>
              <Icon class="opt" data={faThList}/>
              <span>Group by column</span>
            </li> -->
          </ul>
        </svelte:fragment>
      </Dropdown>
    </div>
  {/each}
  <div class="cell" style="width:70px;left:{
      columnPosition.get('__row').width
    }px;">
    <div class="add">
      +
    </div>
  </div>
</div>
