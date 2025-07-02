<script lang="ts">
  import { iconDeleteMajor } from '@mathesar/icons';
  import { Button, Icon } from '@mathesar-component-library';

  import type { EphemeralDataFormField } from '../../data-form-utilities/AbstractEphemeralField';
  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../../data-form-utilities/DataFormManager';

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

  {#if isSelected}
    <div class="controls">
      <slot />
      <Button appearance="outcome">
        <Icon {...iconDeleteMajor} />
      </Button>
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

    .controls {
      margin-left: auto;
      display: flex;
      gap: var(--sm4);
    }
  }
</style>
