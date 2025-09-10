<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    Label,
    type LabelController,
    ensureReadable,
    getStringValueFromEvent,
    isDefinedNonNullable,
  } from '@mathesar-component-library';

  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../data-form-utilities/DataFormManager';
  import type { DataFormField } from '../data-form-utilities/fields';

  import FormFieldCommonControls from './FormFieldCommonControls.svelte';

  export let dataFormManager: DataFormManager;
  export let dataFormField: DataFormField;
  export let labelController: LabelController;
  export let isSelected: boolean;
  export let disabled = false;

  $: ({ label, help } = dataFormField);
  $: isRequired =
    'isRequired' in dataFormField
      ? dataFormField.isRequired
      : ensureReadable(false);

  function onLabelInput(e: Event) {
    dataFormField.setLabel(getStringValueFromEvent(e));
  }

  function onHelpTextInput(e: Event) {
    dataFormField.setHelpText(getStringValueFromEvent(e));
  }
</script>

<div class="label-container" class:selected={isSelected}>
  <div class="header">
    <div class="label">
      {#if $isRequired}
        <span class="req-indicator">*</span>
      {/if}
      {#if dataFormManager instanceof EditableDataFormManager}
        <!--
          Why `readonly` instead of `disabled`?
          Disabled inputs do not trigger event handlers like click. In this case, it will prevent
          the form field from getting selected when user clicks on the input.
        -->
        <input
          type="text"
          readonly={disabled}
          class:disabled
          value={$label}
          on:input={onLabelInput}
          on:blur={() => dataFormField.checkAndSetDefaultLabel()}
        />
      {:else}
        <Label controller={labelController}>
          {$label}
        </Label>
      {/if}
    </div>

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
          readonly={disabled}
          class:disabled
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

    .req-indicator {
      color: var(--semantic-danger-text);
      font-size: var(--lg2);
    }

    input {
      border: none;
      border-bottom: 1px solid;
      border-color: transparent;
      background-color: transparent;
      font-weight: var(--font-weight-medium);
      padding: var(--sm5) 0;
      margin: 0;
    }

    &.selected {
      input {
        background-color: var(--color-bg-input);
        border-color: var(--color-border-input);

        &.disabled {
          background-color: var(--color-bg-input-disabled);
          cursor: not-allowed;
        }
      }
    }
  }

  .header {
    width: 100%;
    display: flex;
    gap: var(--sm2);
    flex-wrap: wrap;

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
