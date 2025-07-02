<script lang="ts">
  import { iconDeleteMajor } from '@mathesar/icons';
  import { Button, Icon } from '@mathesar-component-library';

  import type { EphemeralDataFormField } from '../../data-form-utilities/AbstractEphemeralField';

  export let dataFormField: EphemeralDataFormField;
  export let isSelected: boolean;

  $: ({ label } = dataFormField);
</script>

<div class="label" class:selected={isSelected}>
  <input type="text" bind:value={$label} />

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
      display: flex;
      gap: var(--sm4);
    }
  }
</style>
