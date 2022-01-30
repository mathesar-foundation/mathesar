<script lang="ts">
  import { Form, makeForm, executeRule } from '@mathesar-component-library';
  import type {
    FormBuildConfiguration,
    FormInputDataType,
  } from '@mathesar-component-library/types';
  import type { DbType } from '@mathesar/App.d';
  import type { AbstractTypeDbConfigOptions } from '@mathesar/stores/abstract-types/types';

  export let selectedDbType: DbType | undefined;
  export let configuration: AbstractTypeDbConfigOptions['configuration'];

  function constructForm(
    formConfig: AbstractTypeDbConfigOptions['configuration']['form'],
    formValues?: AbstractTypeDbConfigOptions['configuration']['ruleReversalValues'],
  ): FormBuildConfiguration {
    if (selectedDbType && formValues?.[selectedDbType]) {
      return makeForm(formConfig, formValues[selectedDbType]);
    }
    return makeForm(formConfig);
  }

  $: form = constructForm(configuration.form, configuration.ruleReversalValues);
  $: values = form.values;

  function setSelectedDBType(formValues: Record<string, FormInputDataType>) {
    // eslint-disable-next-line no-restricted-syntax
    for (const determinationRule of configuration.determinationRules) {
      const result = executeRule(determinationRule.rule, formValues);
      if (result) {
        selectedDbType = determinationRule.resolve;
        break;
      }
    }
  }

  $: setSelectedDBType($values);
</script>

<Form {form} />
