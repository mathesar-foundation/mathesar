<script lang="ts">
  import {
    FormBuilder,
    makeForm,
    getValidationContext,
  } from '@mathesar-component-library';
  import type {
    FormBuildConfiguration,
    FormInputDataType,
  } from '@mathesar-component-library/types';
  import type { DbType } from '@mathesar/App.d';
  import type { AbstractTypeDbConfigOptions } from '@mathesar/stores/abstract-types/types';
  import type { Column } from '@mathesar/stores/table-data/types';
  import { getDefaultValuesFromConfig } from '../utils';

  export let selectedDbType: DbType;
  export let typeOptions: Column['type_options'];
  export let configuration: AbstractTypeDbConfigOptions['configuration'];
  export let column: Column;

  function constructForm(
    _configuration: AbstractTypeDbConfigOptions['configuration'],
    _column: Column,
  ): FormBuildConfiguration {
    const dbTypeDefaults = getDefaultValuesFromConfig(
      _configuration,
      selectedDbType,
      _column,
    );
    return makeForm(_configuration.form, dbTypeDefaults);
  }

  $: form = constructForm(configuration, column);
  $: values = form.values;

  const validationContext = getValidationContext();
  validationContext.addValidator('DbFormValidator', () => {
    const valid = form.getValidationResult().isValid;
    return valid;
  });

  function setSelectedDBType(formValues: Record<string, FormInputDataType>) {
    selectedDbType = configuration.determineDbType(
      formValues,
      column.type,
      column.type_options,
    );
    const savableVariables =
      configuration.getSavableTypeOptions(selectedDbType);
    if (savableVariables.length > 0) {
      const newTypeOptions: Column['type_options'] = {};
      savableVariables.forEach((variable) => {
        newTypeOptions[variable] = formValues[variable];
      });
      typeOptions = newTypeOptions;
    } else {
      typeOptions = {};
    }
    validationContext.validate();
  }

  $: setSelectedDBType($values);
</script>

<FormBuilder {form} />
