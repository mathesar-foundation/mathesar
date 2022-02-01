<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    faSortAmountDown,
    faSortAmountDownAlt,
    faThList,
    faTrashAlt,
    faSpinner,
    faICursor,
  } from '@fortawesome/free-solid-svg-icons';
  import { Icon, Button, Checkbox } from '@mathesar-component-library';
  import type {
    Meta,
    Column,
    SortOption,
    GroupOption,
    ColumnsDataStore,
    ConstraintsDataStore,
  } from '@mathesar/stores/table-data/types';
  import { toast } from '@mathesar/stores/toast';
  import { confirmDelete } from '@mathesar/stores/confirmation';

  const dispatch = createEventDispatcher();

  export let meta: Meta;
  export let column: Column;
  export let columnsDataStore: ColumnsDataStore;
  export let constraintsDataStore: ConstraintsDataStore;

  let isRequestingToggleAllowNull = false;
  let isRequestingToggleAllowDuplicates = false;

  $: ({ sort, group } = meta);
  $: sortDirection = ($sort as SortOption)?.get(column.name);
  $: hasGrouping = ($group as GroupOption)?.has(column.name);

  $: allowsNull = column.nullable;
  $: ({ uniqueColumns } = constraintsDataStore);
  $: allowsDuplicates = !(column.primary_key || $uniqueColumns.has(column.id));

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

  async function toggleAllowNull() {
    isRequestingToggleAllowNull = true;
    try {
      const newAllowsNull = !allowsNull;
      await columnsDataStore.setNullabilityOfColumn(column, newAllowsNull);
      toast.success(
        `Column "${column.name}" will ${
          newAllowsNull ? '' : 'no longer '
        }allow NULL.`,
      );
      dispatch('close');
    } catch (error) {
      toast.error(
        `Unable to update "Allow NULL" of column "${column.name}". ${
          error.message as string
        }.`,
      );
    } finally {
      isRequestingToggleAllowNull = false;
    }
  }

  function deleteColumn() {
    dispatch('close');
    void confirmDelete({
      identifierType: 'column',
      identifierName: column.name,
      body: [
        'All objects related to this column will be affected.',
        'This could break existing tables and views.',
        'Are you sure you want to proceed?',
      ],
      onProceed: () => columnsDataStore.deleteColumn(column.id),
    });
  }

  function handleRename() {
    dispatch('close');
    dispatch('rename');
  }

  async function toggleAllowDuplicates() {
    isRequestingToggleAllowDuplicates = true;
    try {
      const newAllowsDuplicates = !allowsDuplicates;
      await constraintsDataStore.setUniquenessOfColumn(
        column,
        !newAllowsDuplicates,
      );
      const message = `Column "${column.name}" will ${
        newAllowsDuplicates ? '' : 'no longer '
      }allow duplicates.`;
      toast.success({ message });
      dispatch('close');
    } catch (error) {
      const message = `Unable to update "Allow Duplicates" of column "${
        column.name
      }". ${error.message as string}.`;
      toast.error({ message });
    } finally {
      isRequestingToggleAllowDuplicates = false;
    }
  }
</script>

<h6 class="category">Display</h6>
<ul>
  <li>
    <Button appearance="plain" on:click={() => handleSort('asc')}>
      <Icon class="opt" data={faSortAmountDownAlt} />
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
      <Icon class="opt" data={faSortAmountDown} />
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
      <Icon class="opt" data={faThList} />
      <span>
        {#if hasGrouping}
          Remove grouping
        {:else}
          Group by column
        {/if}
      </span>
    </Button>
  </li>
</ul>
<div class="divider" />
<h6 class="category">Operations</h6>
<ul>
  <li>
    <Button appearance="plain" on:click={handleRename}>
      <Icon class="opt" data={faICursor} />
      <span> Rename </span>
    </Button>
  </li>
  <li>
    <Button appearance="plain" on:click={deleteColumn}>
      <Icon class="opt" data={faTrashAlt} />
      <span> Delete column </span>
    </Button>
  </li>
  <!--
    TODO Once we have a DropdownMenu component, make this option
    disabled if the column is a primary key.
  -->
  <li>
    <Button appearance="plain" on:click={toggleAllowNull}>
      {#if isRequestingToggleAllowNull}
        <Icon class="opt" data={faSpinner} spin={true} />
      {:else}
        <span class="opt"><Checkbox checked={allowsNull} /></span>
      {/if}
      <span>Allow NULL</span>
    </Button>
  </li>
  <!--
    TODO Once we have a DropdownMenu component, make this option
    disabled if the column is a primary key.
  -->
  <li>
    <Button appearance="plain" on:click={toggleAllowDuplicates}>
      {#if isRequestingToggleAllowDuplicates}
        <Icon class="opt" data={faSpinner} spin={true} />
      {:else}
        <span class="opt"><Checkbox checked={allowsDuplicates} /></span>
      {/if}
      <span>Allow Duplicates</span>
    </Button>
  </li>
</ul>
