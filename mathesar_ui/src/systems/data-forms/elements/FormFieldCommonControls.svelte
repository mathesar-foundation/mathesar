<script lang="ts">
  import { iconDeleteMajor } from '@mathesar/icons';
  import { Button, Icon } from '@mathesar-component-library';

  import type { DataFormField } from '../data-form-utilities/FormFields';

  export let dataFormField: DataFormField;
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
