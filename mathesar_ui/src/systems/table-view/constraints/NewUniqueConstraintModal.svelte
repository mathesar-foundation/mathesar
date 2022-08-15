<script lang="ts">
  import type { ModalController } from '@mathesar-component-library';
  import {
    CheckboxGroup,
    LabeledInput,
    RadioGroup,
    TextInput,
  } from '@mathesar-component-library';
  import { CancelOrProceedButtonPair } from '@mathesar-component-library';
  import { ControlledModal } from '@mathesar-component-library';
  import type { Column } from '@mathesar/api/tables/columns';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { tables } from '@mathesar/stores/tables';
  import FormField from '@mathesar/components/FormField.svelte';
  import { toast } from '@mathesar/stores/toast';
  import Form from '@mathesar/components/Form.svelte';
  import { getAvailableName } from '@mathesar/utils/db';
  import type { ProcessedColumn } from '@mathesar/stores/table-data/processedColumns';
  import TableColumnName from '@mathesar/components/TableColumnName.svelte';
  import UniqueConstraintsHelp from './__help__/UniqueConstraintsHelp.svelte';
  import ConstraintNameHelp from './__help__/ConstraintNameHelp.svelte';
  import UniqueConstraintColumnsHelp from './__help__/UniqueConstraintColumnsHelp.svelte';

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
    _columns: ProcessedColumn[],
    reservedNames: Set<string>,
  ): string {
    const columnNames = _columns.map((c) => c.column.name);
    const desiredName = `${_tableName}_${columnNames.join('_')}`;
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

  let constraintColumns: ProcessedColumn[] = [];
  let namingStrategy: NamingStrategy = 'auto';
  let constraintName: string | undefined;

  function init() {
    constraintColumns = [];
    namingStrategy = 'auto';
    constraintName = undefined;
  }

  $: constraintsDataStore = $tabularData.constraintsDataStore;
  $: existingConstraintNames = new Set(
    $constraintsDataStore.constraints.map((c) => c.name),
  );
  $: tableName = $tables.data.get($tabularData.id)?.name ?? '';
  $: ({ processedColumns } = $tabularData);
  $: columnsInTable = Array.from($processedColumns.values());
  $: nameValidationErrors = getNameValidationErrors(
    namingStrategy,
    constraintName,
    existingConstraintNames,
  );
  $: canProceed = constraintColumns.length > 0 && !nameValidationErrors.length;

  function handleNamingStrategyChange() {
    // Begin with a suggested name as the starting value, but only do it when
    // the user switches from 'auto' to 'manual'.
    constraintName =
      namingStrategy === 'manual'
        ? getSuggestedName(
            tableName,
            constraintColumns,
            existingConstraintNames,
          )
        : undefined;
  }

  async function handleSave() {
    try {
      await constraintsDataStore.add({
        columns: constraintColumns.map((c) => c.id),
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
      <CheckboxGroup
        options={columnsInTable}
        bind:values={constraintColumns}
        getCheckboxLabel={(column) => ({
          component: TableColumnName,
          props: {
            column,
          },
        })}
      >
        Columns <UniqueConstraintColumnsHelp />
      </CheckboxGroup>
    </FormField>

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
