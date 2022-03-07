<script lang="ts">
  import { FormBuilder, makeForm } from '@mathesar-component-library';
  import type {
    FormBuildConfiguration,
    FormInputDataType,
  } from '@mathesar-component-library/types';
  import type { DbType } from '@mathesar/App.d';
  import type { AbstractTypeDbConfigOptions } from '@mathesar/stores/abstract-types/types';
  import type { Column } from '@mathesar/stores/table-data/types';
  import { getDefaultsAndSavedVarsFromFormConfig } from '../utils';

  export let selectedDbType: DbType | undefined;
  export let typeOptions: Column['type_options'];
  export let configuration: AbstractTypeDbConfigOptions['configuration'];
  export let column: Column;

  function constructForm(
    formConfig: AbstractTypeDbConfigOptions['configuration']['form'],
    typeDefaults: Record<string, Record<string, FormInputDataType>>,
  ): FormBuildConfiguration {
    if (selectedDbType && typeDefaults[selectedDbType]) {
      return makeForm(formConfig, {
        ...typeDefaults[selectedDbType],
        ...(typeOptions || {}),
      });
    }
    return makeForm(formConfig, typeOptions || {});
  }

  $: [dbTypeDefaults, savedVariables] = getDefaultsAndSavedVarsFromFormConfig(
    configuration.form,
  );
  $: form = constructForm(configuration.form, dbTypeDefaults);
  $: values = form.values;

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
  }

  $: setSelectedDBType($values);
</script>

<FormBuilder {form} />
