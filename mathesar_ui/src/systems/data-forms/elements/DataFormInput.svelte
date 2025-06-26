<script lang="ts">
  import { _ } from 'svelte-i18n';

  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';

  import type { DataFormManager } from '../DataFormManager';
  import type {
    EphermeralFkField,
    EphermeralScalarField,
  } from '../EphemeralDataForm';

  export let dataFormField: EphermeralScalarField | EphermeralFkField;
  export let dataFormManager: DataFormManager;
  export let isSelected: boolean;

  $: ({ fieldStore, processedColumn, label } = dataFormField);
</script>

<div class="data-form-input" class:selected={isSelected}>
  <div class="label">
    <input type="text" value={$label} />
  </div>

  <div class="value">
    <DynamicInput
      bind:value={$fieldStore}
      componentAndProps={processedColumn.inputComponentAndProps}
    />
  </div>
</div>

<style lang="scss">
  .data-form-input {
    display: flex;
    flex-direction: column;
    gap: var(--sm3);

    .label {
      width: 100%;

      input {
        border: 1px solid transparent;
        background-color: transparent;
        font-weight: var(--font-weight-medium);
      }
    }

    &.selected {
      .label input {
        background-color: var(--input-background);
        border-bottom: 1px solid var(--input-border);
      }
    }

    .value {
      --input-min-height: 2.5rem;
      --text-area-min-height: 5.5rem;
    }
  }
</style>
