<script lang="ts">
  import {
    faSortAmountDown,
    faSortAmountDownAlt,
    faThList,
    faTrashAlt,
  } from '@fortawesome/free-solid-svg-icons';
  import {
    Dropdown,
    Icon,
    Modal,
    Button,
  } from '@mathesar-components';
  import type {
    Meta,
    TableColumn,
    SortOption,
    GroupOption,
    ColumnPosition,
  } from '@mathesar/stores/table-data/types';
  import { createEventDispatcher } from 'svelte';

  export let columnPosition: ColumnPosition;
  export let column: TableColumn;
  export let meta: Meta;

  const dispatch = createEventDispatcher();

  let isOpen = false;

  $: ({ sort, group } = meta);
  $: sortDirection = ($sort as SortOption)?.get(column.name);
  $: hasGrouping = ($group as GroupOption)?.has(column.name);

  function handleSort(order: 'asc' | 'desc') {
    if (sortDirection === order) {
      meta.removeSort(column.name);
    } else {
      meta.addUpdateSort(column.name, order);
    }
  }

  function toggleGroup() {
    if (hasGrouping) {
      meta.removeGroup(column.name);
    } else {
      meta.addGroup(column.name);
    }
  }

  function deleteColumn(_column) {
    if (_column) {
      dispatch('columnDelete', _column.index);
      isOpen = false;
    }
  }
</script>

<div class="cell" style="width:{columnPosition?.width || 0}px;
      left:{(columnPosition?.left || 0)}px;">
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
        <li on:click={() => handleSort('asc')}>
          <Icon class="opt" data={faSortAmountDownAlt}/>
          <span>
            {#if sortDirection === 'asc'}
              Remove asc sort
            {:else}
              Sort Ascending
            {/if}
          </span>
        </li>
        <li on:click={() => handleSort('desc')}>
          <Icon class="opt" data={faSortAmountDown}/>
          <span>
            {#if sortDirection === 'desc'}
              Remove desc sort
            {:else}
              Sort Descending
            {/if}
          </span>
        </li>
        <li on:click={toggleGroup}>
          <Icon class="opt" data={faThList}/>
          <span>
            {#if hasGrouping}
              Remove grouping
            {:else}
              Group by column
            {/if}
          </span>
        </li>
        <li on:click={() => { isOpen = true; } }>
          <Icon class="opt" data={faTrashAlt}/>
          <span>
            Delete column
          </span>
        </li>
      </ul>
    </svelte:fragment>
  </Dropdown>
</div>
{#if isOpen}
  <Modal class="delete-modal">
    <div class="header">
      Deleting '{column.name}' could break existing tables and views.
    </div>
    <div class="help-text">
      All Objects related to this column will be afected. 
    </div>
  <svelte:fragment slot="footer">
      <Button on:click={() => { isOpen = false; }}>Cancel</Button>
      <Button appearance="primary" on:click={() => { deleteColumn(column); }}>
        Delete Column
      </Button>
  </svelte:fragment>
  </Modal>
{/if}
