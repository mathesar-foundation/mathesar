<!--
  @component

  TODO:
  - Make `baseColumn` and `targetColumn` use `ProcessedColumn` instead of
    `Column`. Then refactor `SelectColumn.svelte` (which is only used here) into
    `SelectProcessedColumn.svelte`. This way it can use the correct icon for the
    column, taking into account links.
-->
<script lang="ts">
  import {
    ensureReadable,
    RadioGroup,
    Spinner,
  } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import type { Column } from '@mathesar/api/types/tables/columns';
  import {
    FormSubmit,
    makeForm,
    requiredField,
    uniqueWith,
    type FilledFormValues,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import FieldLayout from '@mathesar/components/form/FieldLayout.svelte';
  import SelectColumn from '@mathesar/components/SelectColumn.svelte';
  import SelectTable from '@mathesar/components/SelectTable.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import {
    ColumnsDataStore,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { importVerifiedTables } from '@mathesar/stores/tables';
  import { getAvailableName } from '@mathesar/utils/db';
  import ConstraintNameHelp from './__help__/ConstraintNameHelp.svelte';

  export let onClose: (() => void) | undefined = undefined;

  type NamingStrategy = 'auto' | 'manual';
  const namingStrategyLabelMap = new Map<NamingStrategy, string>([
    ['auto', 'Automatically'],
    ['manual', 'Manually'],
  ]);
  const namingStrategies = [...namingStrategyLabelMap.keys()];

  const tabularData = getTabularDataStoreFromContext();

  function getSuggestedName(
    _tableName: string,
    _column: Column | undefined,
    reservedNames: Set<string>,
  ): string {
    const desiredName = `FK_${_tableName}_${_column?.name ?? ''}`;
    return getAvailableName(desiredName, reservedNames);
  }

  $: constraintsDataStore = $tabularData.constraintsDataStore;
  $: existingConstraintNames = new Set(
    $constraintsDataStore.constraints.map((c) => c.name),
  );

  $: baseColumn = requiredField<Column | undefined>(undefined);
  $: targetTable = requiredField<TableEntry | undefined>(undefined);
  $: targetColumn = requiredField<Column | undefined>(undefined);
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
  $: columnsDataStore = $tabularData.columnsDataStore;
  $: baseTableColumns = columnsDataStore.columns;
  $: targetTableColumnsStore = $targetTable
    ? new ColumnsDataStore({ parentId: $targetTable.id })
    : undefined;
  $: targetTableColumnsStatus = ensureReadable(
    targetTableColumnsStore?.fetchStatus,
  );
  $: targetTableColumnsAreLoading =
    $targetTableColumnsStatus?.state === 'processing';
  $: targetTableColumns = ensureReadable(
    targetTableColumnsStore?.columns ?? [],
  );

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
  <span class="title">New Foreign Key Constraint</span>

  <Field
    field={baseColumn}
    input={{ component: SelectColumn, props: { columns: $baseTableColumns } }}
    layout="stacked"
    label="Column in this table which references the target table"
  />

  <Field
    field={targetTable}
    input={{ component: SelectTable, props: { autoSelect: 'clear', tables } }}
    layout="stacked"
    label="Target Table"
  />

  {#if $targetTable}
    {#if targetTableColumnsAreLoading}
      <FieldLayout><Spinner /></FieldLayout>
    {:else}
      <Field
        field={targetColumn}
        input={{
          component: SelectColumn,
          props: { columns: $targetTableColumns },
        }}
        layout="stacked"
      >
        <span slot="label">
          Target Column in
          <TableName table={$targetTable} bold truncate={false} />
          Table
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
      Set Constraint Name <ConstraintNameHelp />
    </RadioGroup>
  </FieldLayout>

  {#if $namingStrategy === 'manual'}
    <Field field={constraintName} layout="stacked" label="Constraint Name" />
  {/if}

  <FormSubmit
    {form}
    catchErrors
    onProceed={handleSave}
    onCancel={onClose}
    size="small"
    proceedButton={{ label: 'Add' }}
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
