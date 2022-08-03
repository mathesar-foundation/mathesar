<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Icon, Button, Checkbox } from '@mathesar-component-library';
  import type {
    Meta,
    ColumnsDataStore,
    ConstraintsDataStore,
  } from '@mathesar/stores/table-data/types';
  import type { Column } from '@mathesar/api/tables/columns';
  import { toast } from '@mathesar/stores/toast';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { SortDirection } from '@mathesar/stores/table-data';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { findFkConstraintsForColumn } from '@mathesar/stores/table-data/constraintsUtils';
  import { iconSortAmountDown, iconCursor, iconDeleteAlt, iconLoading, iconSortAmountDownAlt, iconThList, iconUnlink } from '@mathesar/icons';

  const dispatch = createEventDispatcher();

  export let meta: Meta;
  export let column: Column;
  export let columnsDataStore: ColumnsDataStore;
  export let constraintsDataStore: ConstraintsDataStore;

  let isRequestingToggleAllowNull = false;
  let isRequestingToggleAllowDuplicates = false;

  $: ({ sorting, grouping } = meta);
  $: sortDirection = $sorting.get(column.id);
  $: hasGrouping = $grouping.has(column.id);

  $: allowsNull = column.nullable;
  $: ({ uniqueColumns } = constraintsDataStore);
  $: allowsDuplicates = !(column.primary_key || $uniqueColumns.has(column.id));
  $: ({ constraints } = $constraintsDataStore);
  $: tableLinkConstraints = findFkConstraintsForColumn(constraints, column.id);
  $: hasTableLink = tableLinkConstraints.length > 0;
  $: isRequestingRemoveTableLink = false;

  function handleSort(order: SortDirection) {
    if (sortDirection === order) {
      sorting.update((s) => s.without(column.id));
    } else {
      sorting.update((s) => s.with(column.id, order));
    }
    dispatch('close');
  }

  function toggleGroup() {
    if (hasGrouping) {
      grouping.update((g) => g.without(column.id));
    } else {
      grouping.update((g) => g.with(column.id));
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
          // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
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
        // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      }". ${error.message as string}.`;
      toast.error({ message });
    } finally {
      isRequestingToggleAllowDuplicates = false;
    }
  }

  async function removeTableLink() {
    isRequestingRemoveTableLink = true;
    try {
      await Promise.all(
        tableLinkConstraints.map((c) => constraintsDataStore.remove(c.id)),
      );
      toast.success('Table link removed');
      dispatch('close');
    } catch (error) {
      toast.error(`Unable to remove table link. ${getErrorMessage(error)}`);
    } finally {
      isRequestingRemoveTableLink = false;
    }
  }
</script>

<h6 class="category">Display</h6>
<ul>
  <li>
    <Button appearance="plain" on:click={() => handleSort(SortDirection.A)}>
      <Icon class="opt" {...iconSortAmountDownAlt} />
      <span>
        {#if sortDirection === SortDirection.A}
          Remove asc sort
        {:else}
          Sort Ascending
        {/if}
      </span>
    </Button>
  </li>
  <li>
    <Button appearance="plain" on:click={() => handleSort(SortDirection.D)}>
      <Icon class="opt" {...iconSortAmountDown} />
      <span>
        {#if sortDirection === SortDirection.D}
          Remove desc sort
        {:else}
          Sort Descending
        {/if}
      </span>
    </Button>
  </li>
  <li>
    <Button appearance="plain" on:click={toggleGroup}>
      <Icon class="opt" {...iconThList} />
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
      <Icon class="opt" {...iconCursor} />
      <span> Rename </span>
    </Button>
  </li>
  <li>
    <Button appearance="plain" on:click={deleteColumn}>
      <Icon class="opt" {...iconDeleteAlt} />
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
        <Icon class="opt" {...iconLoading} spin={true} />
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
        <Icon class="opt" {...iconLoading} spin={true} />
      {:else}
        <span class="opt"><Checkbox checked={allowsDuplicates} /></span>
      {/if}
      <span>Allow Duplicates</span>
    </Button>
  </li>
  {#if hasTableLink}
    <li>
      <Button appearance="plain" on:click={removeTableLink}>
        {#if isRequestingRemoveTableLink}
          <Icon class="opt" {...iconLoading} spin={true} />
        {:else}
          <Icon class="opt" {...iconUnlink} />
        {/if}
        <span>Remove Table Link</span>
      </Button>
    </li>
  {/if}
</ul>
