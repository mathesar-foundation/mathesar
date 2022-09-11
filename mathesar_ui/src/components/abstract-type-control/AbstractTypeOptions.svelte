<script lang="ts">
  import {
    FormBuilder,
    getValidationContext,
    Icon,
  } from '@mathesar-component-library';
  import type { FormValues } from '@mathesar-component-library/types';
  import type { DbType } from '@mathesar/AppTypes';
  import { iconDatabase, iconDisplayOptions } from '@mathesar/icons';
  import type {
    AbstractType,
    AbstractTypeDbConfig,
    AbstractTypeDisplayConfig,
  } from '@mathesar/stores/abstract-types/types';
  import DbTypeIndicator from './DbTypeIndicator.svelte';
  import { constructDbForm, constructDisplayForm } from './utils';
  import type { ColumnWithAbstractType } from './utils';

  export let selectedAbstractType: AbstractType;
  export let selectedDbType: DbType;
  export let typeOptions: ColumnWithAbstractType['type_options'];
  export let displayOptions: ColumnWithAbstractType['display_options'];
  export let column: ColumnWithAbstractType;

  let dbFormHasError = false;
  let displayFormHasError = false;

  $: ({ dbOptionsConfig, dbForm, dbFormValues } = constructDbForm(
    selectedAbstractType,
    selectedDbType,
    column,
  ));
  $: ({ displayOptionsConfig, displayForm, displayFormValues } =
    constructDisplayForm(selectedAbstractType, selectedDbType, column));

  const validationContext = getValidationContext();
  validationContext.addValidator('AbstractTypeConfigValidator', () => {
    let isValid = true;
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

{#if dbForm || displayForm}
  <div class="type-options">
    <div class="type-options-content">
      {#if dbForm}
        <div>
          <Icon {...iconDatabase} />
          <span>Database Options</span>
        </div>
        <FormBuilder form={dbForm} />
        {#if column.type !== selectedDbType}
          New Db type: <DbTypeIndicator type={selectedDbType} />
        {/if}
      {/if}
      {#if displayForm}
        <div>
          <Icon {...iconDisplayOptions} />
          <span>Formatting Options</span>
        </div>
        <FormBuilder form={displayForm} />
      {/if}
    </div>
  </div>
{/if}
