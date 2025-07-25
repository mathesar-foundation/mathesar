<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    getStringValueFromEvent,
    isDefinedNonNullable,
  } from '@mathesar-component-library';

  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../data-form-utilities/DataFormManager';
  import type { EphemeralDataFormField } from '../data-form-utilities/types';

  import FormFieldCommonControls from './FormFieldCommonControls.svelte';

  export let dataFormManager: DataFormManager;
  export let dataFormField: EphemeralDataFormField;
  export let isSelected: boolean;

  $: ({ label, help } = dataFormField);

  function onLabelInput(e: Event) {
    dataFormField.setLabel(getStringValueFromEvent(e));
  }

  function onHelpTextInput(e: Event) {
    dataFormField.setHelpText(getStringValueFromEvent(e));
  }
</script>

<div class="label-container" class:selected={isSelected}>
  <div class="label">
    {#if dataFormManager instanceof EditableDataFormManager}
      <input type="text" value={$label} on:input={onLabelInput} />
    {:else}
      <span>
        {$label}
      </span>
    {/if}

    {#if isSelected && dataFormManager instanceof EditableDataFormManager}
      <div class="control-panel">
        <FormFieldCommonControls {dataFormField}>
          <slot />
        </FormFieldCommonControls>
      </div>
    {/if}
  </div>

  {#if isDefinedNonNullable($help)}
    {#if dataFormManager instanceof EditableDataFormManager}
      <div class="help">
        <input
          type="text"
          value={$help}
          on:input={onHelpTextInput}
          placeholder={$_('field_add_help_text')}
        />
      </div>
    {:else if $help.trim().length}
      <div class="help">
        <span>
          {$help}
        </span>
      </div>
    {/if}
  {/if}
</div>

<style lang="scss">
  .label-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--sm4);

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
  }

  .label {
    width: 100%;
    display: flex;

    .control-panel {
      margin-left: auto;
      display: flex;
    }
  }

  .help {
    font-size: var(--sm1);

    input {
      width: 100%;
    }
  }
</style>
