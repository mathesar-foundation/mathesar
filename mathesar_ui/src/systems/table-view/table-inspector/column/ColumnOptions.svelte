<script lang="ts">
  import {
    Icon,
    Button,
    Checkbox,
    iconLoading,
  } from '@mathesar-component-library';
  import type {
    ColumnsDataStore,
    ProcessedColumn,
    ConstraintsDataStore,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import { createEventDispatcher } from 'svelte';

  export let column: ProcessedColumn;
  export let columnsDataStore: ColumnsDataStore;
  export let constraintsDataStore: ConstraintsDataStore;

  let isRequestingToggleAllowNull = false;
  let isRequestingToggleAllowDuplicates = false;

  const dispatch = createEventDispatcher();

  $: allowsNull = column.column.nullable;
  $: ({ uniqueColumns } = constraintsDataStore);
  $: allowsDuplicates = !(
    column.column.primary_key || $uniqueColumns.has(column.id)
  );

  async function toggleAllowNull() {
    isRequestingToggleAllowNull = true;
    try {
      const newAllowsNull = !allowsNull;
      await columnsDataStore.setNullabilityOfColumn(
        column.column,
        newAllowsNull,
      );
      toast.success(
        `Column "${column.column.name}" will ${
          newAllowsNull ? '' : 'no longer '
        }allow NULL.`,
      );
      dispatch('close');
    } catch (error) {
      toast.error(
        `Unable to update "Allow NULL" of column "${column.column.name}". ${
          // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
          error.message as string
        }.`,
      );
    } finally {
      isRequestingToggleAllowNull = false;
    }
  }

  async function toggleAllowDuplicates() {
    isRequestingToggleAllowDuplicates = true;
    try {
      const newAllowsDuplicates = !allowsDuplicates;
      await constraintsDataStore.setUniquenessOfColumn(
        column.column,
        !newAllowsDuplicates,
      );
      const message = `Column "${column.column.name}" will ${
        newAllowsDuplicates ? '' : 'no longer '
      }allow duplicates.`;
      toast.success({ message });
      dispatch('close');
    } catch (error) {
      const message = `Unable to update "Allow Duplicates" of column "${
        column.column.name
        // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      }". ${error.message as string}.`;
      toast.error({ message });
    } finally {
      isRequestingToggleAllowDuplicates = false;
    }
  }
</script>

<div class="properties-container">
  <!--
    TODO Once we have a DropdownMenu component, make this option
    disabled if the column is a primary key.
  -->
  <Button appearance="plain" on:click={toggleAllowNull}>
    {#if isRequestingToggleAllowNull}
      <Icon class="opt" {...iconLoading} />
    {:else}
      <span class="opt"><Checkbox checked={allowsNull} /></span>
    {/if}
    <span>Allow NULL</span>
  </Button>
  <!--
    TODO Once we have a DropdownMenu component, make this option
    disabled if the column is a primary key.
  -->
  <Button appearance="plain" on:click={toggleAllowDuplicates}>
    {#if isRequestingToggleAllowDuplicates}
      <Icon class="opt" {...iconLoading} />
    {:else}
      <span class="opt"><Checkbox checked={allowsDuplicates} /></span>
    {/if}
    <span>Allow Duplicates</span>
  </Button>
</div>

<style>
  .properties-container {
    padding: 0.5rem -0.5rem;
    display: flex;
    flex-direction: column;
  }
</style>
