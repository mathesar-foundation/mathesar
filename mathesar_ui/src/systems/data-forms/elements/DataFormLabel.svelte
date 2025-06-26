<script lang="ts">
  import type { EphemeralDataFormField } from '../EphemeralDataForm';

  export let dataFormField: EphemeralDataFormField;
  export let isSelected: boolean;

  $: ({ label } = dataFormField);
</script>

<div class="label" class:selected={isSelected}>
  <input type="text" bind:value={$label} />

  {#if isSelected && $$slots.default}
    <div class="controls">
      <slot />
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
      padding: 0;
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
    }
  }
</style>
