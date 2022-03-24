<script lang="ts">
  import {
    FormBuilder,
    makeForm,
    getValidationContext,
  } from '@mathesar-component-library';
  import type {
    FormBuildConfiguration,
    FormValues,
  } from '@mathesar-component-library/types';
  import type { DbType } from '@mathesar/App.d';
  import type { AbstractTypeDbConfig } from '@mathesar/stores/abstract-types/types';
  import type { Column } from '@mathesar/stores/table-data/types';

  export let selectedDbType: DbType;
  export let typeOptions: Column['type_options'];
  export let configuration: AbstractTypeDbConfig;
  export let column: Column;

  function constructForm(
    _configuration: AbstractTypeDbConfig,
    _column: Column,
  ): FormBuildConfiguration {
    const dbFormValues =
      _column.type === selectedDbType
        ? _configuration.constructDbFormValuesFromTypeOptions(
            column.type,
            column.type_options,
          )
        : {};
    return makeForm(_configuration.form, dbFormValues);
  }

  $: form = constructForm(configuration, column);
  $: values = form.values;

  const validationContext = getValidationContext();
  validationContext.addValidator('DbFormValidator', () => {
    const valid = form.getValidationResult().isValid;
    return valid;
  });

  function setSelectedDBType(formValues: FormValues) {
    const determinedResult = configuration.determineDbTypeAndOptions(
      formValues,
      column.type,
    );
    typeOptions = determinedResult.typeOptions;
    selectedDbType = determinedResult.dbType;
    validationContext.validate();
  }

  $: setSelectedDBType($values);
</script>

<FormBuilder {form} />
