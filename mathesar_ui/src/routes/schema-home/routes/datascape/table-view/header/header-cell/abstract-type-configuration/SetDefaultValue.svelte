<script lang="ts" context="module">
  import type { Column } from '@mathesar/stores/table-data/columns';

  function getPropsFromDefaultValue(_defaultValue: Column['default']) {
    return {
      isPresent: !!_defaultValue,
      isDynamic: _defaultValue?.is_dynamic ?? false,
      value: _defaultValue?.value,
    };
  }

  function getDefaultValueFromProps(
    _isPresent: boolean,
    _isDynamic: boolean,
    _value: unknown,
  ) {
    return _isPresent
      ? {
          is_dynamic: _isDynamic,
          value: _value,
        }
      : null;
  }
</script>

<script lang="ts">
  import {
    getValidationContext,
    isDefinedNonNullable,
  } from '@mathesar-component-library';
  import {
    LabeledInput,
    Checkbox,
    TextInput,
  } from '@mathesar-component-library';
  import FormField from '@mathesar/components/FormField.svelte';
  import DataTypeBasedInput from '@mathesar/components/cell/DataTypeBasedInput.svelte';

  export let selectedDbType: Column['type'];
  export let typeOptions: Column['type_options'];
  export let displayOptions: Column['display_options'];
  export let defaultValue: Column['default'];
  export let defaultValueHasError = false;

  let { isPresent, isDynamic, value } = getPropsFromDefaultValue(defaultValue);
  const validationContext = getValidationContext();

  function onDefaultValueChange(_defaultValue: Column['default']) {
    ({ isPresent, isDynamic, value } = getPropsFromDefaultValue(_defaultValue));
  }

  function onPropsChange(
    _isPresent: boolean,
    _isDynamic: boolean,
    _value: unknown,
  ) {
    defaultValue = getDefaultValueFromProps(_isPresent, _isDynamic, _value);
  }

  $: onDefaultValueChange(defaultValue);
  $: onPropsChange(isPresent, isDynamic, value);
  $: {
    defaultValueHasError =
      isPresent &&
      (typeof value === 'undefined' || value === null || value === '');
    validationContext.validate();
  }

  // Show error to the user only after user modifies value
  export let showError = false;

  function onInputChange() {
    if (isDefinedNonNullable(value) && value !== '') {
      showError = false;
    } else {
      showError = true;
    }
  }
</script>

<div class="default-value-control">
  <LabeledInput label="Set Default Value" layout="inline-input-first">
    <Checkbox
      bind:checked={isPresent}
      on:change={() => {
        showError = false;
      }}
    />
  </LabeledInput>

  {#if isPresent}
    <div>
      <LabeledInput label="Default Value" layout="stacked">
        {#if isDynamic}
          <TextInput value={String(value)} disabled={true} />
        {:else}
          <FormField errors={showError ? ['* This is a required field'] : []}>
            <DataTypeBasedInput
              bind:value
              column={{
                type: selectedDbType,
                type_options: typeOptions,
                display_options: displayOptions,
              }}
              hasError={showError}
              on:input={onInputChange}
              on:change={onInputChange}
            />
          </FormField>
        {/if}
      </LabeledInput>
    </div>
  {/if}
</div>

<style lang="scss">
  div.default-value-control {
    margin-top: 0.8rem;

    div {
      margin-top: 0.6rem;
    }
  }
</style>
