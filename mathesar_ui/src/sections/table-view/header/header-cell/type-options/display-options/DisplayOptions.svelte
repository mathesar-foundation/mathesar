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
    AbstractTypeDisplayConfigOptions,
  } from '@mathesar/stores/abstract-types/types';
  import type { Column } from '@mathesar/stores/table-data/types';

  export let selectedDbType: DbType;
  export let displayOptions: Column['display_options'];
  export let selectedAbstractType: AbstractType;
  export let column: Column;

  const dummyReadable = readable({});

  $: displayOptionsConfig =
    selectedAbstractType.typeSwitchOptions?.display ?? undefined;

  function constructForm(
    _displayOptionsConfig?: AbstractTypeDisplayConfigOptions | undefined,
  ): FormBuildConfiguration | undefined {
    if (_displayOptionsConfig?.form) {
      return makeForm(_displayOptionsConfig.form, {});
    }
    return undefined;
  }

  $: form = constructForm(displayOptionsConfig);
  $: values = form?.values ?? dummyReadable;

  function setDisplayOptions(formValues: Record<string, FormInputDataType>) {
    //
  }

  $: setDisplayOptions($values);
</script>

{#if displayOptionsConfig && form}
  <FormBuilder {form} />
{/if}
