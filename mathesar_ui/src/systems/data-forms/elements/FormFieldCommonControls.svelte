<script lang="ts">
  import { iconDeleteMajor } from '@mathesar/icons';
  import { Button, Icon } from '@mathesar-component-library';

  import type { EphemeralDataFormField } from '../data-form-utilities/types';

  export let dataFormField: EphemeralDataFormField;
</script>

<div class="controls">
  <slot />
  <Button
    appearance="outcome"
    on:click={() => dataFormField.holder.delete(dataFormField)}
  >
    <Icon {...iconDeleteMajor} />
  </Button>
</div>

<style lang="scss">
  .controls {
    display: flex;
    gap: var(--sm4);
  }
</style>
