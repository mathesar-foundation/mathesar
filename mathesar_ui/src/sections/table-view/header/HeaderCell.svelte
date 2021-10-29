<script lang="ts">
  import {
    faSortAmountDown,
    faSortAmountDownAlt,
    faThList,
  } from '@fortawesome/free-solid-svg-icons';
  import { Dropdown, Icon } from '@mathesar-components';
  import type { ConstraintsDataStore } from '@mathesar/stores/table-data/constraints';
  import type {
    Meta,
    Column,
    SortOption,
    GroupOption,
    ColumnPosition,
  } from '@mathesar/stores/table-data/types';

  export let columnPosition: ColumnPosition;
  export let column: Column;
  export let meta: Meta;
  export let constraintsDataStore: ConstraintsDataStore;

  let isRequestingToggleAllowDuplicates = false;
  
  $: ({ sort, group } = meta);
  $: sortDirection = ($sort as SortOption)?.get(column.name);
  $: hasGrouping = ($group as GroupOption)?.has(column.name);

  $: allowsDuplicatesStore = constraintsDataStore.columnAllowsDuplicates(column);
  $: allowsDuplicates = $allowsDuplicatesStore as boolean;

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

  async function toggleAllowDuplicates() {
    isRequestingToggleAllowDuplicates = true;
    try {
      const isUnique = await constraintsDataStore.updateUniquenessOfColumn(column, (u) => !u);
      const msg = `Column ${column.name} will ${isUnique ? 'no longer' : ''} allow duplicates.`;
      console.log(msg); // TODO display success toast message: msg
    } catch (error) {
      const msg = `Unable to update "Allow Duplicates" of column ${column.name}. ${error.message as string}.`;
      console.log(msg); // TODO display error toast message
    } finally {
      isRequestingToggleAllowDuplicates = false;
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
        <li on:click={toggleAllowDuplicates}>
          <!-- TODO: style -->
          {#if allowsDuplicates}
            <span>[Y]</span>
          {:else}
            <span>[N]</span>
          {/if}
          <span> Allow Duplicates</span>
        </li>
      </ul>
    </svelte:fragment>
  </Dropdown>
</div>
