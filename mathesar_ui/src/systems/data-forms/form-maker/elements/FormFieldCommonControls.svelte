<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconDeleteMajor } from '@mathesar/icons';
  import { Button, Icon, Tooltip } from '@mathesar-component-library';

  import type { DataFormField } from '../data-form-utilities/fields';

  export let dataFormField: DataFormField;
</script>

<div class="controls">
  <slot />

  <Tooltip enabled={!dataFormField.canDelete}>
    <Button
      slot="trigger"
      appearance="outcome"
      disabled={!dataFormField.canDelete}
      on:click={() => dataFormField.container.delete(dataFormField)}
    >
      <div class="icon">
        <Icon {...iconDeleteMajor} />
      </div>
    </Button>
    <span slot="content">{$_('field_cannot_be_removed_required_in_db')}</span>
  </Tooltip>
</div>

<style lang="scss">
  .controls {
    display: flex;
    gap: var(--sm4);
  }
</style>
