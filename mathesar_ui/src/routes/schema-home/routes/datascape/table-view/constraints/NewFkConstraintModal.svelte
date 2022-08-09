<script lang="ts">
  import type { ModalController } from '@mathesar-component-library';
  import {
    CancelOrProceedButtonPair,
    ControlledModal,
    ensureReadable,
    LabeledInput,
    RadioGroup,
    Spinner,
    TextInput,
  } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/api/tables/tableList';
  import Form from '@mathesar/components/Form.svelte';
  import FormField from '@mathesar/components/FormField.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import SelectColumn from '@mathesar/components/SelectColumn.svelte';
  import SelectTable from '@mathesar/components/SelectTable.svelte';
  import {
    ColumnsDataStore,
    getTabularDataStoreFromContext,
    TabularType,
  } from '@mathesar/stores/table-data';
  import type { Column } from '@mathesar/api/tables/columns';
  import { tables as tablesStore } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import { States } from '@mathesar/utils/api';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { getAvailableName } from '@mathesar/utils/db';
  import ConstraintNameHelp from './__help__/ConstraintNameHelp.svelte';

  export let controller: ModalController;

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

  function getNameValidationErrors(
    _namingStrategy: NamingStrategy,
    _constraintName: string | undefined,
    _existingConstraintNames: Set<string>,
  ) {
    if (_namingStrategy === 'auto') {
      return [];
    }
    if (!_constraintName?.trim()) {
      return ['Name cannot be empty'];
    }
    if (_existingConstraintNames.has(_constraintName?.trim())) {
      return ['A constraint with that name already exists'];
    }
    return [];
  }

  let baseColumn: Column | undefined;
  let targetTable: TableEntry | undefined;
  let targetColumn: Column | undefined;
  let namingStrategy: NamingStrategy = 'auto';
  let constraintName: string | undefined;

  function init() {
    baseColumn = undefined;
    targetTable = undefined;
    targetColumn = undefined;
    namingStrategy = 'auto';
    constraintName = undefined;
  }

  $: constraintsDataStore = $tabularData.constraintsDataStore;
  $: existingConstraintNames = new Set(
    $constraintsDataStore.constraints.map((c) => c.name),
  );
  $: tables = [...$tablesStore.data.values()];
  $: baseTableName = $tablesStore.data.get($tabularData.id)?.name ?? '';
  $: columnsDataStore = $tabularData.columnsDataStore;
  $: baseTableColumns = $columnsDataStore.columns;
  $: targetTableColumnsStore = ensureReadable(
    targetTable
      ? new ColumnsDataStore(TabularType.Table, targetTable.id)
      : undefined,
  );
  $: targetTableColumnsAreLoading =
    $targetTableColumnsStore?.state === States.Loading;
  $: targetTableColumns = $targetTableColumnsStore?.columns ?? [];
  $: nameValidationErrors = getNameValidationErrors(
    namingStrategy,
    constraintName,
    existingConstraintNames,
  );
  $: canProceed =
    !!baseColumn &&
    !nameValidationErrors.length &&
    !!targetTable &&
    !!targetColumn;

  function handleNamingStrategyChange() {
    // Begin with a suggested name as the starting value, but only do it when
    // the user switches from 'auto' to 'manual'.
    constraintName =
      namingStrategy === 'manual'
        ? getSuggestedName(baseTableName, baseColumn, existingConstraintNames)
        : undefined;
  }

  async function handleSave() {
    try {
      if (!baseColumn) {
        throw new Error('No base column selected.');
      }
      if (!targetTable) {
        throw new Error('No target table selected.');
      }
      if (!targetColumn) {
        throw new Error('No target column selected.');
      }
      await constraintsDataStore.add({
        columns: [baseColumn.id],
        type: 'foreignkey',
        name: constraintName,
        referent_table: targetTable.id,
        referent_columns: [targetColumn.id],
      });
      // Why init before close when we also init on open? Because without init
      // there's a weird UI state during the out-transition of the modal where
      // the constraint name validation shows an error due to the name being a
      // duplicate at that point.
      init();
      controller.close();
    } catch (e) {
      toast.error(`Unable to add constraint. ${getErrorMessage(e)}`);
    }
  }
</script>

<ControlledModal {controller} on:open={init}>
  <span slot="title">New Foreign Key Constraint</span>
  <Form>
    <FormField>
      <LabeledInput layout="stacked">
        <span slot="label">
          Column in This Table Which References the Target Table
        </span>
        <SelectColumn columns={baseTableColumns} bind:column={baseColumn} />
      </LabeledInput>
    </FormField>

    <FormField>
      <LabeledInput label="Target Table" layout="stacked">
        <SelectTable
          {tables}
          bind:table={targetTable}
          initialSelectionType="empty"
        />
      </LabeledInput>
    </FormField>

    {#if targetTable}
      <FormField>
        {#if targetTableColumnsAreLoading}
          <Spinner />
        {:else}
          <LabeledInput layout="stacked">
            <span slot="label">
              Target Column in
              <Identifier>{targetTable.name}</Identifier>
              Table
            </span>
            <SelectColumn
              columns={targetTableColumns}
              bind:column={targetColumn}
            />
          </LabeledInput>
        {/if}
      </FormField>
    {/if}

    <FormField>
      <RadioGroup
        options={namingStrategies}
        bind:value={namingStrategy}
        isInline
        on:change={handleNamingStrategyChange}
        getRadioLabel={(s) => namingStrategyLabelMap.get(s) ?? ''}
      >
        Set Constraint Name <ConstraintNameHelp />
      </RadioGroup>
    </FormField>

    {#if namingStrategy === 'manual'}
      <FormField errors={nameValidationErrors}>
        <LabeledInput label="Constraint Name" layout="stacked">
          <TextInput
            bind:value={constraintName}
            hasError={nameValidationErrors.length > 0}
          />
        </LabeledInput>
      </FormField>
    {/if}
  </Form>

  <CancelOrProceedButtonPair
    slot="footer"
    onProceed={handleSave}
    onCancel={() => controller.close()}
    proceedButton={{ label: 'Add' }}
    {canProceed}
  />
</ControlledModal>
