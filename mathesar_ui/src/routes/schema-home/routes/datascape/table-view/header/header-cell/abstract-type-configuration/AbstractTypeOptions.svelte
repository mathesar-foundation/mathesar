<script lang="ts">
  import { faDatabase, faPalette } from '@fortawesome/free-solid-svg-icons';
  import {
    FormBuilder,
    Icon,
    getValidationContext,
  } from '@mathesar-component-library';
  import type { FormValues } from '@mathesar-component-library/types';
  import type { DbType } from '@mathesar/AppTypes';
  import type { Column } from '@mathesar/stores/table-data/types';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';
  import DbTypeIndicator from './DbTypeIndicator.svelte';
  import SetDefaultValue from './SetDefaultValue.svelte';
  import TypeOptionTab from './TypeOptionTab.svelte';
  import { constructDbForm, constructDisplayForm } from './utils';

  export let selectedAbstractType: AbstractType;
  export let selectedDbType: DbType;
  export let typeOptions: Column['type_options'];
  export let displayOptions: Column['display_options'];
  export let defaultValue: Column['default'];
  export let column: Column;

  let selectedTab: 'database' | 'display' = 'database';
  let dbFormHasError = false;
  let displayFormHasError = false;
  let defaultValueHasError = false;
  let showDefaultValueErrorIndication = false;

  // Why are the following not reactive?
  // The whole component gets re-rendered when selectedAbstractType changes,
  // so these do not have to be reactive.
  // Also, these functions should not be reactive for changes in selectedDbType and column.
  const { dbOptionsConfig, dbForm, dbFormValues } = constructDbForm(
    selectedAbstractType,
    selectedDbType,
    column,
  );
  const { displayOptionsConfig, displayForm, displayFormValues } =
    constructDisplayForm(selectedAbstractType, selectedDbType, column);

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

  function onDbFormValuesChange(dbFormValueSubstance: FormValues) {
    if (dbOptionsConfig) {
      const determinedResult = dbOptionsConfig.determineDbTypeAndOptions(
        dbFormValueSubstance,
        column.type,
      );
      typeOptions = determinedResult.typeOptions ?? {};
      selectedDbType = determinedResult.dbType;
      validationContext.validate();
    }
  }

  function onDisplayFormValuesChange(displayFormValueSubstance: FormValues) {
    if (displayOptionsConfig) {
      displayOptions =
        displayOptionsConfig?.determineDisplayOptions(
          displayFormValueSubstance,
        ) ?? {};
      validationContext.validate();
    }
  }

  $: onDbFormValuesChange($dbFormValues);
  $: onDisplayFormValuesChange($displayFormValues);
</script>

<div class="type-options">
  <ul class="type-option-tabs">
    <TypeOptionTab
      bind:selectedTab
      tab="database"
      hasError={dbFormHasError || showDefaultValueErrorIndication}
    >
      <Icon size="0.75em" data={faDatabase} />
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
        <Icon size="0.75em" data={faPalette} />
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
