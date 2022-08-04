<script lang="ts">
  import {
    FormBuilder,
    Icon,
    getValidationContext,
  } from '@mathesar-component-library';
  import type { FormValues } from '@mathesar-component-library/types';
  import type { DbType } from '@mathesar/AppTypes';
  import type { Column } from '@mathesar/api/tables/columns';
  import type {
    AbstractType,
    AbstractTypeDbConfig,
    AbstractTypeDisplayConfig,
  } from '@mathesar/stores/abstract-types/types';
  import type { ProcessedColumn } from '@mathesar/stores/table-data/processedColumns';
  import { iconDatabase, iconDisplayOptions } from '@mathesar/icons';
  import DbTypeIndicator from './DbTypeIndicator.svelte';
  import SetDefaultValue from './SetDefaultValue.svelte';
  import TypeOptionTab from './TypeOptionTab.svelte';
  import { constructDbForm, constructDisplayForm } from './utils';

  export let selectedAbstractType: AbstractType;
  export let selectedDbType: DbType;
  export let typeOptions: Column['type_options'];
  export let displayOptions: Column['display_options'];
  export let defaultValue: Column['default'];
  export let processedColumn: ProcessedColumn;

  let selectedTab: 'database' | 'display' = 'database';
  let dbFormHasError = false;
  let displayFormHasError = false;
  let defaultValueHasError = false;
  let showDefaultValueErrorIndication = false;

  $: ({ column } = processedColumn);
  $: ({ dbOptionsConfig, dbForm, dbFormValues } = constructDbForm(
    selectedAbstractType,
    selectedDbType,
    column,
  ));
  $: ({ displayOptionsConfig, displayForm, displayFormValues } =
    constructDisplayForm(selectedAbstractType, selectedDbType, column));

  const validationContext = getValidationContext();
  validationContext.addValidator('AbstractTypeConfigValidator', () => {
    let isValid = !defaultValueHasError;
    if (dbForm) {
      const isDbFormValid = dbForm.getValidationResult().isValid;
      dbFormHasError = !isDbFormValid;
      isValid = isValid && isDbFormValid;
    }
    if (displayForm) {
      const isDisplayFormValid = displayForm.getValidationResult().isValid;
      displayFormHasError = !isDisplayFormValid;
      isValid = isValid && isDisplayFormValid;
    }
    return isValid;
  });

  function onDbFormValuesChange(
    dbFormValueSubstance: FormValues,
    _dbOptionsConfig: AbstractTypeDbConfig | undefined,
  ) {
    if (_dbOptionsConfig) {
      const determinedResult = _dbOptionsConfig.determineDbTypeAndOptions(
        dbFormValueSubstance,
        column.type,
      );
      typeOptions = determinedResult.typeOptions ?? {};
      selectedDbType = determinedResult.dbType;
      validationContext.validate();
    }
  }

  function onDisplayFormValuesChange(
    displayFormValueSubstance: FormValues,
    _displayOptionsConfig: AbstractTypeDisplayConfig | undefined,
  ) {
    if (_displayOptionsConfig) {
      displayOptions =
        _displayOptionsConfig?.determineDisplayOptions(
          displayFormValueSubstance,
        ) ?? {};
      validationContext.validate();
    }
  }

  $: onDbFormValuesChange($dbFormValues, dbOptionsConfig);
  $: onDisplayFormValuesChange($displayFormValues, displayOptionsConfig);
</script>

<div class="type-options">
  <ul class="type-option-tabs">
    <TypeOptionTab
      bind:selectedTab
      tab="database"
      hasError={dbFormHasError || showDefaultValueErrorIndication}
    >
      <Icon size="0.75em" {...iconDatabase} />
      <span>Database</span>
    </TypeOptionTab>
    {#if displayForm}
      <TypeOptionTab
        bind:selectedTab
        tab="display"
        hasError={displayFormHasError}
        on:select={() => {
          showDefaultValueErrorIndication = defaultValueHasError;
        }}
      >
        <Icon size="0.75em" {...iconDisplayOptions} />
        <span>Display</span>
      </TypeOptionTab>
    {/if}
  </ul>
  <div class="type-options-content">
    {#if selectedTab === 'database'}
      {#if dbForm}
        <FormBuilder form={dbForm} />
      {/if}
      <SetDefaultValue
        bind:defaultValue
        bind:defaultValueHasError
        bind:showError={showDefaultValueErrorIndication}
        {selectedDbType}
        {typeOptions}
        {displayOptions}
      />
      <DbTypeIndicator {selectedDbType} />
    {:else if displayForm}
      <FormBuilder form={displayForm} />
    {/if}
  </div>
</div>
