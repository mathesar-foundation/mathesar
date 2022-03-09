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
  import type {
    AbstractTypeConfigForm,
    AbstractTypeDbConfigOptions,
  } from '@mathesar/stores/abstract-types/types';
  import type { Column } from '@mathesar/stores/table-data/types';
  import {
    getDefaultsFromFormConfig,
    getSavedVariablesFromFormConfig,
  } from '../utils';

  export let selectedDbType: DbType;
  export let typeOptions: Column['type_options'];
  export let configuration: AbstractTypeDbConfigOptions['configuration'];
  export let column: Column;

  function constructForm(
    formConfig: AbstractTypeConfigForm,
    _column: Column,
  ): FormBuildConfiguration {
    const dbTypeDefaults = getDefaultsFromFormConfig(
      formConfig,
      selectedDbType,
      _column,
    );
    return makeForm(formConfig, dbTypeDefaults);
  }

  $: savedVariables = getSavedVariablesFromFormConfig(configuration.form);
  $: form = constructForm(configuration.form, column);
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
    if (savedVariables.length > 0) {
      const newTypeOptions: Column['type_options'] = {};
      savedVariables.forEach((variable) => {
        newTypeOptions[variable] = formValues[variable];
      });
      typeOptions = newTypeOptions;
    } else {
      typeOptions = null;
    }
    validationContext.validate();
  }

  $: setSelectedDBType($values);
</script>

<FormBuilder {form} />
