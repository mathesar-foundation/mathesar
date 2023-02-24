<script lang="ts">
  import {
    FormBuilder,
    getValidationContext,
  } from '@mathesar-component-library';
  import type {
    FormBuildConfiguration,
    FormValues,
  } from '@mathesar-component-library/types';
  import type { AbstractTypeDisplayConfig } from '@mathesar/stores/abstract-types/types';
  import type { Readable } from 'svelte/store';
  import type { ColumnWithAbstractType } from './utils';

  export let displayOptions: ColumnWithAbstractType['display_options'];
  export let displayOptionsConfig: AbstractTypeDisplayConfig;
  export let displayForm: FormBuildConfiguration;
  export let displayFormValues: Readable<FormValues>;
  export let disabled = false;

  let displayFormHasError = false;

  const validationContext = getValidationContext();
  validationContext.addValidator('AbstractTypeConfigValidator', () => {
    let isValid = true;
    if (displayForm) {
      const isDisplayFormValid = displayForm.getValidationResult().isValid;
      displayFormHasError = !isDisplayFormValid;
      isValid = isValid && isDisplayFormValid;
    }
    return isValid;
  });

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

  $: onDisplayFormValuesChange($displayFormValues, displayOptionsConfig);
</script>

<div class="type-options">
  <div class="option-form display-opts">
    <div class="content">
      <FormBuilder form={displayForm} {disabled} />
    </div>
  </div>
</div>
