<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import Form from '@mathesar/components/Form.svelte';
  import FormField from '@mathesar/components/FormField.svelte';
  import {
    type ProcessedColumn,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import { getColumnConstraintTypeByColumnId } from '@mathesar/utils/columnUtils';
  import { getAvailableName } from '@mathesar/utils/db';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { CancelOrProceedButtonPair } from '@mathesar-component-library';
  import {
    LabeledInput,
    MultiSelect,
    RadioGroup,
    TextInput,
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
      return [$_('constraint_name_cannot_be_empty')];
    }
    if (_existingConstraintNames.has(_constraintName?.trim())) {
      return [$_('constraint_name_already_exists')];
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
  $: tableName = $tabularData.table.name;
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
        type: 'u',
        name: constraintName,
      });
      // Why init before close when we also init on open? Because without init
      // there's a weird UI state during the out-transition of the modal where
      // the constraint name validation shows an error due to the name being a
      // duplicate at that point.
      init();
      onClose?.();
    } catch (error) {
      toast.error(
        `${$_('unable_to_add_constraint')} ${getErrorMessage(error)}`,
      );
    }
  }

  function handleCancel() {
    onClose?.();
  }
</script>

<div class="add-new-unique-constraint">
  <span>{$_('new_unique_constraint')}</span>
  <Form>
    <FormField>
      <LabeledInput label={$_('columns')} layout="stacked">
        <MultiSelect
          bind:values={constraintColumns}
          options={columnsInTable}
          autoClearInvalidValues={false}
          let:option
        >
          <ColumnName
            column={{
              ...option.column,
              constraintsType: getColumnConstraintTypeByColumnId(
                option.column.id,
                $processedColumns,
              ),
            }}
          />
        </MultiSelect>
      </LabeledInput>
    </FormField>

    <FormField>
      <RadioGroup
        options={namingStrategies}
        bind:value={namingStrategy}
        isInline
        on:change={handleNamingStrategyChange}
        getRadioLabel={(s) => namingStrategyLabelMap.get(s) ?? ''}
      >
        {$_('set_constraint_name')}
        <ConstraintNameHelp />
      </RadioGroup>
    </FormField>

    {#if namingStrategy === 'manual'}
      <FormField errors={nameValidationErrors}>
        <LabeledInput label={$_('constraint_name')} layout="stacked">
          <TextInput
            bind:value={constraintName}
            hasError={nameValidationErrors.length > 0}
          />
        </LabeledInput>
      </FormField>
    {/if}
  </Form>

  <CancelOrProceedButtonPair
    onProceed={handleSave}
    onCancel={handleCancel}
    proceedButton={{ label: $_('add') }}
    {canProceed}
    size="small"
  />
</div>

<style lang="scss">
  .add-new-unique-constraint {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }
  }
</style>
