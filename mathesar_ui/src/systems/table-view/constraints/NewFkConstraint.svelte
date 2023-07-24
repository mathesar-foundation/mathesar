<script lang="ts">
  import {
    ensureReadable,
    RadioGroup,
    Spinner,
  } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import {
    FormSubmit,
    makeForm,
    requiredField,
    uniqueWith,
    type FilledFormValues,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import FieldLayout from '@mathesar/components/form/FieldLayout.svelte';
  import SelectProcessedColumn from '@mathesar/components/SelectProcessedColumn.svelte';
  import SelectTable from '@mathesar/components/SelectTable.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import {
    getTabularDataStoreFromContext,
    TableStructure,
    type ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import { importVerifiedTables } from '@mathesar/stores/tables';
  import { getAvailableName } from '@mathesar/utils/db';
  import { LL } from '@mathesar/i18n/i18n-svelte';
  import RichText from '@mathesar/components/RichText.svelte';
  import ConstraintNameHelp from './__help__/ConstraintNameHelp.svelte';

  export let onClose: (() => void) | undefined = undefined;

  type NamingStrategy = 'auto' | 'manual';
  const namingStrategyLabelMap = new Map<NamingStrategy, string>([
    ['auto', $LL.general.automatically()],
    ['manual', $LL.general.manual()],
  ]);
  const namingStrategies = [...namingStrategyLabelMap.keys()];

  const tabularData = getTabularDataStoreFromContext();

  function getSuggestedName(
    _tableName: string,
    _column: ProcessedColumn | undefined,
    reservedNames: Set<string>,
  ): string {
    // TODO: i18n
    const desiredName = `FK_${_tableName}_${_column?.column.name ?? ''}`;
    return getAvailableName(desiredName, reservedNames);
  }

  $: constraintsDataStore = $tabularData.constraintsDataStore;
  $: existingConstraintNames = new Set(
    $constraintsDataStore.constraints.map((c) => c.name),
  );

  $: baseColumn = requiredField<ProcessedColumn | undefined>(undefined);
  $: targetTable = requiredField<TableEntry | undefined>(undefined);
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
  $: baseTableName = $importVerifiedTables.get($tabularData.id)?.name ?? '';
  $: ({ processedColumns } = $tabularData);
  $: baseTableColumns = [...$processedColumns.values()];

  $: targetTableStructure = $targetTable
    ? new TableStructure({
        id: $targetTable.id,
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
      type: 'foreignkey',
      name: values.constraintName,
      referent_table: values.targetTable.id,
      referent_columns: [values.targetColumn.id],
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
  <span class="title"
    >{$LL.constraintsNewForeignKeyConstraint.newForeignKeyConstraint()}</span
  >

  <Field
    field={baseColumn}
    input={{
      component: SelectProcessedColumn,
      props: { columns: baseTableColumns },
    }}
    layout="stacked"
    label={$LL.constraintsNewForeignKeyConstraint.columnReferencesTargetTable()}
  />

  <Field
    field={targetTable}
    input={{ component: SelectTable, props: { autoSelect: 'clear', tables } }}
    layout="stacked"
    label={$LL.constraintsNewForeignKeyConstraint.targetTable()}
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
          <RichText
            text={$LL.constraintsNewForeignKeyConstraint.targetColumnInTable()}
            let:slotName
          >
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
      {$LL.general.setConstraintName()}
      <ConstraintNameHelp />
    </RadioGroup>
  </FieldLayout>

  {#if $namingStrategy === 'manual'}
    <Field
      field={constraintName}
      layout="stacked"
      label={$LL.general.constraintName()}
    />
  {/if}

  <FormSubmit
    {form}
    catchErrors
    onProceed={handleSave}
    onCancel={onClose}
    size="small"
    proceedButton={{ label: $LL.general.add() }}
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
