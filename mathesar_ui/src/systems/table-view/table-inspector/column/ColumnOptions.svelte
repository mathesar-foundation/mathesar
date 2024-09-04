<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { RichText } from '@mathesar/components/rich-text';
  import type {
    ColumnsDataStore,
    ConstraintsDataStore,
    ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import {
    Checkbox,
    Help,
    Icon,
    LabeledInput,
    iconLoading,
  } from '@mathesar-component-library';

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
      const msg = newAllowsNull
        ? $_('column_will_allow_null', {
            values: {
              columnName: column.column.name,
            },
          })
        : $_('column_will_not_allow_null', {
            values: {
              columnName: column.column.name,
            },
          });
      toast.success(msg);
      dispatch('close');
    } catch (error) {
      const errorInfo = $_('unable_to_update_allow_null_column', {
        values: {
          columnName: column.column.name,
        },
      });
      toast.error(`${errorInfo} ${getErrorMessage(error)}.`);
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
      const msg = newAllowsDuplicates
        ? $_('column_will_allow_duplicates', {
            values: {
              columnName: column.column.name,
            },
          })
        : $_('column_will_not_allow_duplicates', {
            values: {
              columnName: column.column.name,
            },
          });
      toast.success(msg);
      dispatch('close');
    } catch (error) {
      const errorInfo = $_('unable_to_update_allow_duplicates_column', {
        values: {
          columnName: column.column.name,
        },
      });
      toast.error(`${errorInfo} ${getErrorMessage(error)}.`);
    } finally {
      isRequestingToggleAllowDuplicates = false;
    }
  }
</script>

<div class="column-options">
  <LabeledInput layout="inline-input-first">
    <span slot="label">
      {$_('restrict_to_unique')}
    </span>
    <span slot="description">
      {$_('restrict_to_unique_help')}
    </span>
    {#if isRequestingToggleAllowDuplicates}
      <Icon class="opt" {...iconLoading} />
    {:else}
      <Checkbox
        disabled={isRequestingToggleAllowDuplicates}
        checked={!allowsDuplicates}
        on:change={toggleAllowDuplicates}
      />
    {/if}
  </LabeledInput>

  <LabeledInput layout="inline-input-first">
    <span slot="label">
      <RichText text={$_('disallow_null_values')} let:slotName>
        {#if slotName === 'null'}
          <span class="null">NULL</span>
        {/if}
      </RichText>
    </span>
    <span slot="description">
      {$_('disallow_null_values_help')}
    </span>
    {#if isRequestingToggleAllowNull}
      <Icon class="opt" {...iconLoading} />
    {:else}
      <Checkbox
        disabled={isRequestingToggleAllowNull}
        checked={!allowsNull}
        on:change={toggleAllowNull}
      />
    {/if}
  </LabeledInput>
</div>

<style lang="scss">
  .column-options {
    padding: 0.5rem 0;
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }

    .null {
      font-style: italic;
      color: var(--slate-500);
    }
  }
</style>
