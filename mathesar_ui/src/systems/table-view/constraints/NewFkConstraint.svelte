<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Table } from '@mathesar/api/rpc/tables';
  import {
    type FilledFormValues,
    FormSubmit,
    makeForm,
    requiredField,
    uniqueWith,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import FieldLayout from '@mathesar/components/form/FieldLayout.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import SelectProcessedColumn from '@mathesar/components/SelectProcessedColumn.svelte';
  import SelectTable from '@mathesar/components/SelectTable.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import { currentDatabase } from '@mathesar/stores/databases';
  import {
    type ProcessedColumn,
    TableStructure,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { importVerifiedTables } from '@mathesar/stores/tables';
  import { getAvailableName } from '@mathesar/utils/db';
  import {
    RadioGroup,
    Spinner,
    ensureReadable,
  } from '@mathesar-component-library';

  import ConstraintNameHelp from './__help__/ConstraintNameHelp.svelte';

  export let onClose: (() => void) | undefined = undefined;

  type NamingStrategy = 'auto' | 'manual';
  const namingStrategyLabelMap = new Map<NamingStrategy, string>([
    ['auto', $_('automatically')],
    ['manual', $_('manually')],
  ]);
  const namingStrategies = [...namingStrategyLabelMap.keys()];

  const tabularData = getTabularDataStoreFromContext();

  function getSuggestedName(
    _tableName: string,
    _column: ProcessedColumn | undefined,
    reservedNames: Set<string>,
  ): string {
    const desiredName = `FK_${_tableName}_${_column?.column.name ?? ''}`;
    return getAvailableName(desiredName, reservedNames);
  }

  $: constraintsDataStore = $tabularData.constraintsDataStore;
  $: existingConstraintNames = new Set(
    $constraintsDataStore.constraints.map((c) => c.name),
  );

  $: baseColumn = requiredField<ProcessedColumn | undefined>(undefined);
  $: targetTable = requiredField<Table | undefined>(undefined);
  $: targetColumn = requiredField<ProcessedColumn | undefined>(undefined);
  $: namingStrategy = requiredField<NamingStrategy>('auto');
  $: constraintName = requiredField<string | undefined>(undefined, [
    uniqueWith(existingConstraintNames),
  ]);
  $: form = makeForm({
    baseColumn,
    targetTable,
    targetColumn,
    namingStrategy,
    ...($namingStrategy === 'auto' ? {} : { constraintName }),
  });

  $: tables = [...$importVerifiedTables.values()];
  $: baseTableName = $tabularData.table.name;
  $: ({ processedColumns } = $tabularData);
  $: baseTableColumns = [...$processedColumns.values()];

  $: targetTableStructure = $targetTable
    ? new TableStructure({
        database: $currentDatabase,
        table: $targetTable,
        abstractTypesMap: $currentDbAbstractTypes.data,
      })
    : undefined;
  $: targetTableStructureIsLoading = ensureReadable(
    targetTableStructure?.isLoading,
  );
  $: targetTableColumnsStore = ensureReadable(
    targetTableStructure?.processedColumns,
  );
  $: targetTableColumnsMap =
    $targetTableColumnsStore ?? new Map<number, ProcessedColumn>();
  $: targetTableColumns = [...targetTableColumnsMap.values()];

  function handleNamingStrategyChange() {
    // Begin with a suggested name as the starting value, but only do it when
    // the user switches from 'auto' to 'manual'.
    $constraintName =
      $namingStrategy === 'manual'
        ? getSuggestedName(baseTableName, $baseColumn, existingConstraintNames)
        : undefined;
  }

  async function handleSave(values: FilledFormValues<typeof form>) {
    await constraintsDataStore.add({
      columns: [values.baseColumn.id],
      type: 'f',
      name: values.constraintName,
      fkey_relation_id: values.targetTable.oid,
      fkey_columns: [values.targetColumn.id],
    });
    // Why reset before close when the form is automatically reset during
    // mount? Because without reset here, there's a weird UI state during the
    // out-transition of the modal where the constraint name validation shows
    // an error due to the name being a duplicate at that point.
    form.reset();
    onClose?.();
  }
</script>

<div class="add-new-fk-constraint">
  <span class="title">{$_('new_foreign_key_constraint')}</span>

  <Field
    field={baseColumn}
    input={{
      component: SelectProcessedColumn,
      props: { columns: baseTableColumns },
    }}
    layout="stacked"
    label={$_('column_references_target_table')}
  />

  <Field
    field={targetTable}
    input={{ component: SelectTable, props: { autoSelect: 'clear', tables } }}
    layout="stacked"
    label={$_('target_table')}
  />

  {#if $targetTable}
    {#if $targetTableStructureIsLoading}
      <FieldLayout><Spinner /></FieldLayout>
    {:else}
      <Field
        field={targetColumn}
        input={{
          component: SelectProcessedColumn,
          props: { columns: targetTableColumns },
        }}
        layout="stacked"
      >
        <span slot="label">
          <RichText text={$_('target_column_in_table')} let:slotName>
            {#if slotName === 'tableName'}
              <TableName table={$targetTable} bold truncate={false} />
            {/if}
          </RichText>
        </span>
      </Field>
    {/if}
  {/if}

  <FieldLayout>
    <RadioGroup
      options={namingStrategies}
      bind:value={$namingStrategy}
      isInline
      on:change={handleNamingStrategyChange}
      getRadioLabel={(s) => namingStrategyLabelMap.get(s) ?? ''}
    >
      {$_('set_constraint_name')}
      <ConstraintNameHelp />
    </RadioGroup>
  </FieldLayout>

  {#if $namingStrategy === 'manual'}
    <Field
      field={constraintName}
      layout="stacked"
      label={$_('constraint_name')}
    />
  {/if}

  <FormSubmit
    {form}
    catchErrors
    onProceed={handleSave}
    onCancel={onClose}
    size="small"
    proceedButton={{ label: $_('add') }}
  />
</div>

<style lang="scss">
  .add-new-fk-constraint {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }
  }
</style>
