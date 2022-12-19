<script lang="ts">
  import {
    FormBuilder,
    getValidationContext,
  } from '@mathesar-component-library';
  import type { FormValues } from '@mathesar-component-library/types';
  import type { DbType } from '@mathesar/AppTypes';
  import type {
    AbstractType,
    AbstractTypeDbConfig,
  } from '@mathesar/stores/abstract-types/types';
  import DbTypeIndicator from './DbTypeIndicator.svelte';
  import { constructDbForm } from './utils';
  import type { ColumnWithAbstractType } from './utils';

  export let selectedAbstractType: AbstractType;
  export let selectedDbType: DbType;
  export let typeOptions: ColumnWithAbstractType['type_options'];
  export let column: ColumnWithAbstractType;

  let dbFormHasError = false;

  $: ({ dbOptionsConfig, dbForm, dbFormValues } = constructDbForm(
    selectedAbstractType,
    selectedDbType,
    column,
  ));

  const validationContext = getValidationContext();
  validationContext.addValidator('AbstractTypeConfigValidator', () => {
    let isValid = true;
    if (dbForm) {
      const isDbFormValid = dbForm.getValidationResult().isValid;
      dbFormHasError = !isDbFormValid;
      isValid = isValid && isDbFormValid;
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

  $: onDbFormValuesChange($dbFormValues, dbOptionsConfig);
</script>

{#if dbForm}
  <div class="type-options">
    <DbTypeIndicator type={selectedDbType} />
    {#if dbForm}
      <div class="option-form db-opts">
        <div class="content">
          <FormBuilder form={dbForm} />
        </div>
      </div>
    {/if}
  </div>
{:else}
  <DbTypeIndicator type={selectedDbType} />
{/if}

<style lang="scss">
  .type-options {
    .option-form {
      margin-top: 0.5rem;

      .content {
        padding-top: 0.75rem;
      }
    }
  }
</style>
