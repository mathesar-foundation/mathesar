<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import {
    faSortAmountDown,
    faSortAmountDownAlt,
    faThList,
  } from '@fortawesome/free-solid-svg-icons';
  import {
    Button,
    Dropdown,
    Icon,
    Resizeable,
    TextInput,
  } from '@mathesar-components';
  import type {
    TableColumnData,
    ColumnPosition,
    TableColumn,
    SortOption,
    GroupOption,
  } from '@mathesar/stores/tableData';
  import {
    DEFAULT_COLUMN_WIDTH,
    DEFAULT_COUNT_COL_WIDTH,
    GROUP_MARGIN_LEFT,
    DEFAULT_ROW_RIGHT_PADDING,
    updateColumnPosition,
  } from '@mathesar/stores/tableData';

  const dispatch = createEventDispatcher();
  export let columns: TableColumnData;
  export let sort: SortOption = new Map();
  export let group: GroupOption = new Set();
  export let horizontalScrollOffset = 0;
  export let isResultGrouped: boolean;

  let resizer:Resizeable;

  let headerRef: HTMLElement;
  let resizerRef:HTMLElement;
  const resizerRefs: HTMLElement[] = [];


  function onHScrollOffsetChange(_hscrollOffset: number) {
    if (headerRef) {
      headerRef.scrollLeft = _hscrollOffset;
    }
  }

  $: onHScrollOffsetChange(horizontalScrollOffset);

  let paddingLeft: number;
  $: paddingLeft = isResultGrouped ? GROUP_MARGIN_LEFT : 0;

  export let columnPosition: ColumnPosition = new Map();

  function resizeColumn(column:TableColumn) {
    if (column) {
      const position = columnPosition.get(column.name);
      if (position) {
        position.width = column.width;
        columnPosition = updateColumnPosition(columns.data);
      }
    }
  }

  let columnToResize:TableColumn;
  $: resizeColumn(columnToResize);

  function showColumnSizer(event:MouseEvent, column:TableColumn) {
    resizer.$set({
      target: <HTMLElement>event.target,
      onResize: (resizeEvent) => {
        const newWidth = (resizeEvent.detail.width) ? <number>resizeEvent.detail.width : column.width;
        column.width = newWidth;
      },
      onResizeEnd: () => {
        columnToResize = column;
      },
    });
  }

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

  const getColumnNames = () => {
    const columnNames:string[] = [];
    const columnData = (columns.data) ? columns.data : null;
    if (columnData) {
      columnData.forEach((col:TableColumn) => columnNames.push(col.name));
    }
    return columnNames;
  };

  let newColumnDropdownIsOpen = false;
  let newColumnName = '';
  function addColumn() {
    const newColumn:TableColumn = {
      name: newColumnName,
      type: 'varchar',
      index: columns.data.length,
      nullable: true,
      primaryKey: false,
      validTargetTypes: null,
      width: DEFAULT_COLUMN_WIDTH,
    };
    dispatch('addColumn', newColumn);
    newColumnDropdownIsOpen = false;
    newColumnName = '';
  }
</script>

<Resizeable
  bind:this={resizer}
  target={resizerRef}
  directions={['e']}
/>
<div id="columns-header" bind:this={headerRef} class="header">
  <div class="cell row-control" style="width:{DEFAULT_COUNT_COL_WIDTH + paddingLeft}px;">
  </div>

  {#each columns.data as column, i (column.name)}
    <div
      bind:this={resizerRefs[i]}
      on:mouseenter={(e) => showColumnSizer(e, column)}
      class="cell" style="
        width:{column.width}px;
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
              <span>
                {#if sort?.get(column.name) === 'asc'}
                  Remove asc sort
                {:else}
                  Sort Ascending
                {/if}
              </span>
            </li>
            <li on:click={() => sortByColumn(column, 'desc')}>
              <Icon class="opt" data={faSortAmountDown}/>
              <span>
                {#if sort?.get(column.name) === 'desc'}
                  Remove desc sort
                {:else}
                  Sort Descending
                {/if}
              </span>
            </li>
            <li on:click={() => groupByColumn(column)}>
              <Icon class="opt" data={faThList}/>
              <span>
                {#if group?.has(column.name)}
                  Remove grouping
                {:else}
                  Group by column
                {/if}
              </span>
            </li>
          </ul>
        </svelte:fragment>
      </Dropdown>
    </div>
  {/each}

  <div class="cell" style="width:{70 + DEFAULT_ROW_RIGHT_PADDING}px;left:{
    columnPosition.get('__row').width + paddingLeft
  }px;">
    <Dropdown closeOnInnerClick={false}
              contentClass="content"
              bind:isOpen={newColumnDropdownIsOpen}
              triggerAppearance="plain">

      <svelte:fragment slot="trigger">
        <span class="name">Add Column</span>
      </svelte:fragment>

      <svelte:fragment slot="content">
        <div class="add-column" style="width:{(70 + DEFAULT_ROW_RIGHT_PADDING) * 1.5}px">
          <div class="grid">

            <TextInput bind:value={newColumnName}>
              <svelte:fragment slot="prepend">Name:</svelte:fragment>
            </TextInput>
            <Button appearance="primary" disabled={newColumnName.length === 0 || getColumnNames().indexOf(newColumnName) >= 0} on:click={() => addColumn()}>
              Add
            </Button>

          </div>

          {#if getColumnNames().indexOf(newColumnName) >= 0}
            <p class="messages">
              <strong>Warning!</strong> The column name must be unique.
            </p>
          {/if}
        </div>
      </svelte:fragment>
    </Dropdown>
  </div>
</div>
<style global lang="scss">
  @import "Header.scss";
</style>