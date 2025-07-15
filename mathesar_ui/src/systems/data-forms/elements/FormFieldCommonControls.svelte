<script lang="ts">
  import { iconDeleteMajor } from '@mathesar/icons';
  import { Button, Icon } from '@mathesar-component-library';

  import type { EphemeralDataFormField } from '../data-form-utilities/AbstractEphemeralField';
  import type { EditableDataFormManager } from '../data-form-utilities/DataFormManager';

  export let dataFormManager: EditableDataFormManager;
  export let dataFormField: EphemeralDataFormField;
</script>

<div class="controls">
  <slot />
  <Button
    appearance="outcome"
    on:click={() => dataFormManager.removeField(dataFormField)}
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
