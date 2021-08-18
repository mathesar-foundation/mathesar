<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import {
    faChevronRight,
    faCog,
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
    DEFAULT_ROW_RIGHT_PADDING,
  } from '@mathesar/stores/tableData';

  const dispatch = createEventDispatcher();
  export let columns: TableColumnData;
  export let sort: SortOption = new Map();
  export let group: GroupOption = new Set();
  export let columnPosition: ColumnPosition = new Map();
  export let horizontalScrollOffset = 0;
  export let isResultGrouped: boolean;

  let headerRef: HTMLElement;
  let isAdvancedOptionsOpen = false;
  $: dropdownStates = columns.data.reduce((acc, el) => {
    acc[el.name] = false;
    return acc;
  }, {});

  function toggleAdvancedOptions() {
    isAdvancedOptionsOpen = !isAdvancedOptionsOpen;
  }

  function closeDropdown(name: string) {
    isAdvancedOptionsOpen = false;
    dropdownStates = { ...dropdownStates, [name]: false };
  }

  function onHScrollOffsetChange(_hscrollOffset: number) {
    if (headerRef) {
      headerRef.scrollLeft = _hscrollOffset;
    }
  }

  $: onHScrollOffsetChange(horizontalScrollOffset);

  let paddingLeft: number;
  $: paddingLeft = isResultGrouped ? GROUP_MARGIN_LEFT : 0;

  function onHeaderScroll(scrollLeft: number) {
    if (horizontalScrollOffset !== scrollLeft) {
      horizontalScrollOffset = scrollLeft;
    }
  }

  onMount(() => {
    onHScrollOffsetChange(horizontalScrollOffset);

    const scrollListener = (event: Event) => {
      const { scrollLeft } = event.target as HTMLElement;
      onHeaderScroll(scrollLeft);
    };

    headerRef.addEventListener('scroll', scrollListener);

    return () => {
      headerRef.removeEventListener('scroll', scrollListener);
    };
  });

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

  function determineTypeIcon(type: string) {
    switch (type) {
      case 'INTEGER':
        return '#';
      case 'VARCHAR':
        return 'T';
      default:
        return 'i';
    }
  }

  function determineDataTitle(type: string) {
    switch (type) {
      case 'INTEGER':
        return 'Number';
      case 'VARCHAR': 
        return 'Text'   
      default:
        return 'Else'
    }
  }
</script>

<div bind:this={headerRef} class="header">
  <div class="cell row-control" style="width:{DEFAULT_COUNT_COL_WIDTH + paddingLeft}px;">
  </div>

  {#each columns.data as column (column.name)}
    <div class="cell" style="
      width:{columnPosition.get(column.name).width}px;
      left:{columnPosition.get(column.name).left + paddingLeft}px;">
      <span class="type">
        {determineTypeIcon(column.type)}
      </span>
      <span class="name">{column.name}</span>

      <Dropdown isOpen={dropdownStates[column.name]} triggerClass="opts" triggerAppearance="plain"
                contentClass="table-opts-content">
        <svelte:fragment slot="content">
          <ul>
            <li>
              <span class="category">Data Type</span>
              <button class="list-button with-right-icon">
                <div>
                  <span class="data-icon">{determineTypeIcon(column.type)}</span>
                  <span>
                    {determineDataTitle(column.type)}
                  </span>
                </div>
                <div>
                  <Icon class="right-icon" data={faCog} />
                  <Icon class="right-icon" data={faChevronRight} />
                </div>
              </button>
            </li>
            <li>
              <button class="list-button" on:click={() => sortByColumn(column, 'asc')}>
                <Icon class="opt" data={faSortAmountDownAlt}/>
                <span>
                  {#if sort?.get(column.name) === 'asc'}
                    Remove asc sort
                  {:else}
                    Sort Ascending
                  {/if}
                </span>
              </button>
            </li>
            <li>
              <button class="list-button" on:click={() => sortByColumn(column, 'desc')}>
                <Icon class="opt" data={faSortAmountDown}/>
                <span>
                  {#if sort?.get(column.name) === 'desc'}
                    Remove desc sort
                  {:else}
                    Sort Descending
                  {/if}
                </span>
              </button>
            </li>
            <li>
              <button class="list-button" on:click={() => groupByColumn(column)}>
                <Icon class="opt" data={faThList}/>
                <span>
                  {#if group?.has(column.name)}
                    Remove grouping
                  {:else}
                    Group by column
                  {/if}
                </span>
              </button>
            </li>            
          </ul>
        </svelte:fragment>
      </Dropdown>
    </div>
  {/each}
  <div class="cell" style="width:{70 + DEFAULT_ROW_RIGHT_PADDING}px;left:{
      columnPosition.get('__row').width + paddingLeft
    }px;">
    <div class="add">
      +
    </div>
  </div>
</div>
