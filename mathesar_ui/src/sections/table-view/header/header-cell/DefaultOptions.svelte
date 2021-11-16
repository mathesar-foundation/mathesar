<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  // import type { Readable } from 'svelte/store';
  import {
    faSortAmountDown,
    faSortAmountDownAlt,
    faThList,
    faTrashAlt,
    faSpinner,
  } from '@fortawesome/free-solid-svg-icons';
  import { Icon, Button, Checkbox } from '@mathesar-component-library';
  import type {
    Meta,
    Column,
    SortOption,
    GroupOption,
    ConstraintsDataStore,
  } from '@mathesar/stores/table-data/types';
  import { toast } from '@mathesar/stores/toast';

  const dispatch = createEventDispatcher();

  export let meta: Meta;
  export let column: Column;
  export let constraintsDataStore: ConstraintsDataStore;

  let isRequestingToggleAllowDuplicates = false;

  $: ({ sort, group } = meta);
  $: sortDirection = ($sort as SortOption)?.get(column.name);
  $: hasGrouping = ($group as GroupOption)?.has(column.name);

  $: uniqueColumns = constraintsDataStore.uniqueColumns;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  $: allowsDuplicates = !(column.primary_key || $uniqueColumns.has(column.name));

  function handleSort(order: 'asc' | 'desc') {
    if (sortDirection === order) {
      meta.removeSort(column.name);
    } else {
      meta.addUpdateSort(column.name, order);
    }
    dispatch('close');
  }

  function toggleGroup() {
    if (hasGrouping) {
      meta.removeGroup(column.name);
    } else {
      meta.addGroup(column.name);
    }
    dispatch('close');
  }

  function deleteColumn() {
    dispatch('close');
    dispatch('columnDelete');
  }
  
  async function toggleAllowDuplicates() {
    isRequestingToggleAllowDuplicates = true;
    try {
      const newAllowsDuplicates = !allowsDuplicates;
      await constraintsDataStore.setUniquenessOfColumn(column, !newAllowsDuplicates);
      const message = `Column "${column.name}" will ${newAllowsDuplicates ? '' : 'no longer '}allow duplicates.`;
      toast.success({ message });
      dispatch('close');
    } catch (error) {
      const message = `Unable to update "Allow Duplicates" of column "${column.name}". ${error.message as string}.`;
      toast.error({ message });
    } finally {
      isRequestingToggleAllowDuplicates = false;
    }
  }
</script>

<ul>
  <li>
    <Button appearance="plain" on:click={() => handleSort('asc')}>
      <Icon class="opt" data={faSortAmountDownAlt}/>
      <span>
        {#if sortDirection === 'asc'}
          Remove asc sort
        {:else}
          Sort Ascending
        {/if}
      </span>
    </Button>
  </li>
  <li>
    <Button appearance="plain" on:click={() => handleSort('desc')}>
      <Icon class="opt" data={faSortAmountDown}/>
      <span>
        {#if sortDirection === 'desc'}
          Remove desc sort
        {:else}
          Sort Descending
        {/if}
      </span>
    </Button>
  </li>
  <li>
    <Button appearance="plain" on:click={toggleGroup}>
      <Icon class="opt" data={faThList}/>
      <span>
        {#if hasGrouping}
          Remove grouping
        {:else}
          Group by column
        {/if}
      </span>
    </Button>
  </li>
  <li>
    <Button appearance="plain" on:click={deleteColumn}>
      <Icon class="opt" data={faTrashAlt}/>
      <span>
        Delete column
      </span>
    </Button>
  </li>
  <!--
    TODO Once we have a DropdownMenu component, make this option
    disabled if the column is a primary key.
  -->
  <li>
    <Button appearance="plain" on:click={toggleAllowDuplicates}>
      {#if isRequestingToggleAllowDuplicates}
        <Icon class="opt" data={faSpinner} spin={true}/>
      {:else}
        <span class="opt"><Checkbox checked={allowsDuplicates} /></span>
      {/if}
      <span>Allow Duplicates</span>
    </Button>
  </li>
</ul>
