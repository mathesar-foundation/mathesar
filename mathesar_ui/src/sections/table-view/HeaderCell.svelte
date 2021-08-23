<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    faSortAmountDown,
    faSortAmountDownAlt,
    faThList,
  } from '@fortawesome/free-solid-svg-icons';
  import {
    Dropdown,
    Icon,
    moveable,
  } from '@mathesar-components';
  import type {
    ColumnPosition,
    TableColumn,
    SortOption,
    GroupOption,
  } from '@mathesar/stores/tableData';
  import {
    GROUP_MARGIN_LEFT,
  } from '@mathesar/stores/tableData';
  import type { MoveableEvents, ResizableOptions } from 'moveable';


  const dispatch = createEventDispatcher();
  export let column: TableColumn;
  export let columnPosition: ColumnPosition;
  export let sortable = false;
  export let sort: SortOption = new Map();

  function sortByColumn(order: 'asc' | 'desc') {
    const newSort: SortOption = new Map(sort);
    if (sort?.get(column.name) === order) {
      newSort.delete(column.name);
    } else {
      newSort.set(column.name, order);
    }
    sort = newSort;
    dispatch('sortUpdated', sort);
  }

  export let groupable = false;
  export let group: GroupOption = new Set();
  let isResultGrouped: boolean;

  function groupByColumn() {
    const oldSize = group?.size || 0;
    const newGroup:GroupOption = new Set(group);
    if (newGroup?.has(column.name)) {
      newGroup.delete(column.name);
    } else {
      newGroup.add(column.name);
    }
    group = newGroup;
    dispatch('groupUpdated', {
      group: newGroup,
      resetPositions: oldSize === 0 || group.size === 0,
    });
  }

  function resizeColumn(event:MoveableEvents['resize']) {
    columnPosition.get(column.name).width = event.width;
    dispatch('columnResized', columnPosition);
  }
  export let isResizable:boolean;
  const showDropdown = () => (sortable || groupable);
  let paddingLeft: number;
  $: paddingLeft = isResultGrouped ? GROUP_MARGIN_LEFT : 0;

  const resizableOptions: ResizableOptions = {
    resizable: isResizable,
    renderDirections: ['e'],
  };
  let tableCellRef: HTMLElement;
</script>

<div
  bind:this={tableCellRef}
  use:moveable={{
    onResize: resizeColumn,
    moveableOptions: resizableOptions,
    reference: tableCellRef,
  }}

  class="cell" style="
  width:{columnPosition.get(column.name).width + paddingLeft}px;
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
  {#if showDropdown()}
    <Dropdown closeOnInnerClick={true}
        triggerClass="opts" triggerAppearance="plain"
        contentClass="table-opts-content">
        <svelte:fragment slot="content">
        <ul>
            {#if sortable}
                <li on:click={() => sortByColumn('asc')}>
                    <Icon class="opt" data={faSortAmountDownAlt}/>
                    <span>
                    {#if sort?.get(column.name) === 'asc'}
                        Remove asc sort
                    {:else}
                        Sort Ascending
                    {/if}
                    </span>
                </li>
                <li on:click={() => sortByColumn('desc')}>
                    <Icon class="opt" data={faSortAmountDown}/>
                    <span>
                      {#if sort?.get(column.name) === 'desc'}
                        Remove desc sort
                      {:else}
                        Sort Descending
                      {/if}
                    </span>
                  </li>
            {/if}
            {#if groupable}
                <li on:click={() => groupByColumn()}>
                    <Icon class="opt" data={faThList}/>
                    <span>
                    {#if group?.has(column.name)}
                        Remove grouping
                    {:else}
                        Group by column
                    {/if}
                    </span>
                </li>
            {/if}
        </ul>
        </svelte:fragment>
    </Dropdown>
  {/if}
</div>
