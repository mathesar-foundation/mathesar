<script lang="ts">
  import { getContext } from 'svelte';
  import type { ModalController } from '@mathesar-component-library';
  import {
    CheckboxGroup,
    LabeledInput,
    RadioGroup,
    TextInput,
  } from '@mathesar-component-library';
  import { CancelOrProceedButtonPair } from '@mathesar-component-library';
  import { ControlledModal } from '@mathesar-component-library';
  import type {
    Column,
    TabularDataStore,
  } from '@mathesar/stores/table-data/types';
  import { tables } from '@mathesar/stores/tables';
  import FormField from '@mathesar/components/FormField.svelte';
  import ColumnName from '@mathesar/components/ColumnName.svelte';
  import { toast } from '@mathesar/stores/toast';
  import Form from '@mathesar/components/Form.svelte';
  import UniqueConstraintsHelp from './__help__/UniqueConstraintsHelp.svelte';
  import ConstraintNameHelp from './__help__/ConstraintNameHelp.svelte';
  import UniqueConstraintColumnsHelp from './__help__/UniqueConstraintColumnsHelp.svelte';

  export let controller: ModalController;

  type NamingStrategy = 'auto' | 'manual';

  const tabularData = getContext<TabularDataStore>('tabularData');
  const namingStrategyOptions = [
    { value: 'auto', label: 'Automatically' },
    { value: 'manual', label: 'Manually' },
  ];

  function getSuggestedName(
    _tableName: string,
    columnIds: number[],
    _columnsInTable: Column[],
    _existingConstraintNames: string[],
  ): string | undefined {
    const getColumnName = (id: number) =>
      _columnsInTable.find((c) => c.id === id)?.name;
    const columnNames = columnIds.map(getColumnName);
    let ordinal = 0;
    while (true) {
      const suffix = ordinal ? `_${ordinal}` : '';
      const name = `${_tableName}_${columnNames.join('_')}${suffix}`;
      if (!_existingConstraintNames.includes(name)) {
        return name;
      }
      ordinal += 1;
    }
  }

  function getNameValidationErrors(
    _namingStrategy: NamingStrategy,
    _constraintName: string | undefined,
    _existingConstraintNames: string[],
  ) {
    if (_namingStrategy === 'auto') {
      return [];
    }
    if (!_constraintName?.trim()) {
      return ['Name cannot be empty'];
    }
    if (_existingConstraintNames.includes(_constraintName?.trim())) {
      return ['A constraint with that name already exists'];
    }
    return [];
  }

  let constraintColumnIds: number[] = [];
  let namingStrategy: NamingStrategy = 'auto';
  let constraintName: string | undefined;

  function init() {
    constraintColumnIds = [];
    namingStrategy = 'auto';
    constraintName = undefined;
  }

  $: constraintsDataStore = $tabularData.constraintsDataStore;
  $: existingConstraintNames = $constraintsDataStore.constraints.map(
    (c) => c.name,
  );
  $: tableName = $tables.data.get($tabularData.id)?.name ?? '';
  $: columnsDataStore = $tabularData.columnsDataStore;
  $: columnsInTable = $columnsDataStore.columns;
  $: columnsOptions = columnsInTable.map((column) => ({
    value: column.id,
    labelComponent: ColumnName,
    labelComponentProps: { column },
  }));
  $: nameValidationErrors = getNameValidationErrors(
    namingStrategy,
    constraintName,
    existingConstraintNames,
  );
  $: canProceed =
    constraintColumnIds.length > 0 && !nameValidationErrors.length;

  function handleNamingStrategyChange() {
    // Begin with a suggested name as the starting value, but only do it when
    // the user switches from 'auto' to 'manual'.
    constraintName =
      namingStrategy === 'manual'
        ? getSuggestedName(
            tableName,
            constraintColumnIds,
            columnsInTable,
            existingConstraintNames,
          )
        : undefined;
  }

  async function handleSave() {
    try {
      await constraintsDataStore.add({
        columns: constraintColumnIds,
        type: 'unique',
        name: constraintName,
      });
      // Why init before close when we also init on open? Because without init
      // there's a weird UI state during the out-transition of the modal where
      // the constraint name validation shows an error due to the name being a
      // duplicate at that point.
      init();
      controller.close();
    } catch (error) {
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      toast.error(`Unable to add constraint. ${error.message as string}`);
    }
  }
</script>

<ControlledModal {controller} on:open={init}>
  <span slot="title">New Unique Constraint <UniqueConstraintsHelp /></span>
  <Form>
    <FormField>
      <CheckboxGroup options={columnsOptions} bind:values={constraintColumnIds}>
        Columns <UniqueConstraintColumnsHelp />
      </CheckboxGroup>
    </FormField>

    <FormField>
      <RadioGroup
        options={namingStrategyOptions}
        bind:value={namingStrategy}
        isInline
        on:change={handleNamingStrategyChange}
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
