<script lang="ts">
  import type { EphemeralDataFormField } from '../data-form-utilities/AbstractEphemeralField';
  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../data-form-utilities/DataFormManager';

  import FormFieldCommonControls from './FormFieldCommonControls.svelte';

  export let dataFormManager: DataFormManager;
  export let dataFormField: EphemeralDataFormField;
  export let isSelected: boolean;

  $: ({ label } = dataFormField);

  function onLabelInput(e: Event) {
    const element = e.target as HTMLInputElement;
    dataFormField.setLabel(element.value);
  }
</script>

<div class="label" class:selected={isSelected}>
  {#if dataFormManager instanceof EditableDataFormManager}
    <input type="text" value={$label} on:input={onLabelInput} />
  {:else}
    <span>
      {$label}
    </span>
  {/if}

  {#if isSelected && dataFormManager instanceof EditableDataFormManager}
    <div class="control-panel">
      <FormFieldCommonControls {dataFormManager} {dataFormField}>
        <slot />
      </FormFieldCommonControls>
    </div>
  {/if}
</div>

<style lang="scss">
  .label {
    width: 100%;
    display: flex;

    input {
      border: 1px solid transparent;
      background-color: transparent;
      font-weight: var(--font-weight-medium);
      padding: var(--sm5) 0;
      margin: 0;
    }

    &.selected {
      input {
        background-color: var(--input-background);
        border-bottom: 1px solid var(--input-border);
      }
    }

    .control-panel {
      margin-left: auto;
      display: flex;
    }
  }
</style>
