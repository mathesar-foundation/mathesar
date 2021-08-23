<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import {
    faPlus,
  } from '@fortawesome/free-solid-svg-icons';
  import {
    Button,
    Dropdown,
    Icon,
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
    DEFAULT_COUNT_COL_WIDTH,
    GROUP_MARGIN_LEFT,
    DEFAULT_ROW_RIGHT_PADDING,
    updateColumnPosition,
  } from '@mathesar/stores/tableData';
  import TableCell from './HeaderCell.svelte';

  const dispatch = createEventDispatcher();
  export let columns: TableColumnData;
  export let sort: SortOption = new Map();
  export let group: GroupOption = new Set();
  export let horizontalScrollOffset = 0;
  export let isResultGrouped: boolean;

  let headerRef: HTMLElement;
  const headerCellRefs: TableCell[] = [];

  function onHScrollOffsetChange(_hscrollOffset: number) {
    if (headerRef) {
      headerRef.scrollLeft = _hscrollOffset;
    }
  }

  $: onHScrollOffsetChange(horizontalScrollOffset);

  let paddingLeft: number;
  $: paddingLeft = isResultGrouped ? GROUP_MARGIN_LEFT : 0;

  export let columnPosition: ColumnPosition = new Map();

  function updateColumnPositions(event:CustomEvent) {
    columnPosition = updateColumnPosition(columns.data, event.detail);
  }

  function onHeaderScroll(scrollLeft: number) {
    if (horizontalScrollOffset !== scrollLeft) {
      horizontalScrollOffset = scrollLeft;
    }
  }

  function updateSort(event:CustomEvent) {
    sort = event.detail as SortOption;
    dispatch('reload');
  }

  function updateGroup(event) {
    if (event.detail?.group) {
      group = event.detail.group as GroupOption;
    }
    if (event.detail?.resetPositions) {
      dispatch('reload', {
        resetPositions: event.detail?.resetPositions as boolean,
      });
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
    };
    dispatch('addColumn', newColumn);
    newColumnDropdownIsOpen = false;
    newColumnName = '';
  }

  function isColumnPresent(name:string) {
    return columns.data?.some((col) => col.name.toLowerCase() === name?.toLowerCase());
  }
  $: isDuplicateColumn = isColumnPresent(newColumnName);
</script>
<div id="columns-header" bind:this={headerRef} class="header">
  <div class="cell row-control" style="width:{DEFAULT_COUNT_COL_WIDTH + paddingLeft}px;">
  </div>

  {#each columns.data as column, i (column.name)}
    <TableCell
      bind:this={headerCellRefs[i]}
      column={column}
      sortable={true}
      sort={sort}
      on:sortUpdated={updateSort}
      groupable={true}
      group={group}
      on:groupUpdated={updateGroup}
      isResizable={true}
      columnPosition={columnPosition}
      on:columnResized={updateColumnPositions}
    />
  {/each}
  <div class="cell" style="width:{70 + DEFAULT_ROW_RIGHT_PADDING}px;left:{
    columnPosition.get('__row').width + paddingLeft
  }px;">
    <Dropdown bind:isOpen={newColumnDropdownIsOpen}
              triggerAppearance="plain">

      <svelte:fragment slot="trigger">
        <span class="name">
          <!-- @TODO: Look into whether is a screen-reader only class implemented -->
          <Icon class="opt" data={faPlus}/>
        </span>
      </svelte:fragment>

      <svelte:fragment slot="content">
        <div class="add-column" style="width:{(70 + DEFAULT_ROW_RIGHT_PADDING) * 1.5}px">
          <div class="grid">

            <TextInput bind:value={newColumnName}>
              <svelte:fragment slot="prepend">Name:</svelte:fragment>
            </TextInput>

            <Button appearance="primary" disabled={!newColumnName?.trim() || isDuplicateColumn} on:click={() => addColumn()}>
              Add
            </Button>
          </div>
          {#if isDuplicateColumn}
            <p class="warning">The column name must be unique.</p>
          {/if}
        </div>
      </svelte:fragment>
    </Dropdown>
  </div>
</div>
<style global lang="scss">
  @import "Header.scss";
</style>
