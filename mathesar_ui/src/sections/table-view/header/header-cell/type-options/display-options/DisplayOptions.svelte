<script lang="ts">
  import { readable } from 'svelte/store';
  import {
    FormBuilder,
    makeForm,
    getValidationContext,
  } from '@mathesar-component-library';

  import type { DbType } from '@mathesar/App.d';
  import type {
    FormBuildConfiguration,
    FormInputDataType,
  } from '@mathesar/component-library/types';
  import type {
    AbstractType,
    AbstractTypeDisplayConfig,
  } from '@mathesar/stores/abstract-types/types';
  import type { Column } from '@mathesar/stores/table-data/types';

  export let selectedDbType: DbType;
  export let displayOptions: Column['display_options'];
  export let selectedAbstractType: AbstractType;
  export let column: Column;

  const dummyReadable = readable({});

  $: configuration = selectedAbstractType.getDisplayConfig?.() ?? undefined;

  function constructForm(
    _configuration: AbstractTypeDisplayConfig | undefined,
    _column: Column,
  ): FormBuildConfiguration | undefined {
    if (_configuration) {
      const displayFormValues =
        _column.type === selectedDbType
          ? _configuration.constructDisplayFormValuesFromDisplayOptions(
              column.display_options,
            )
          : {};
      return makeForm(_configuration.form, displayFormValues);
    }
    return undefined;
  }

  $: form = constructForm(configuration, column);
  $: values = form?.values ?? dummyReadable;

  const validationContext = getValidationContext();
  validationContext.addValidator('DisplayFormValidator', () => {
    if (form) {
      return form.getValidationResult().isValid;
    }
    return true;
  });

  function setDisplayOptions(formValues: Record<string, FormInputDataType>) {
    displayOptions = configuration?.determineDisplayOptions(formValues) ?? {};
    validationContext.validate();
  }

  $: setDisplayOptions($values);
</script>

{#if form}
  <FormBuilder {form} />
{/if}
