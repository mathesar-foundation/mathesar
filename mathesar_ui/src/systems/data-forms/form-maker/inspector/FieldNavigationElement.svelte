<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import {
    Button,
    ensureReadable,
    iconError,
  } from '@mathesar-component-library';

  import type { EditableDataFormManager } from '../data-form-utilities/DataFormManager';
  import type { DataFormField } from '../data-form-utilities/fields';

  export let dataFormManager: EditableDataFormManager;
  export let field: DataFormField | undefined = undefined;
  $: label = field ? field.label : ensureReadable(null);

  function selectField() {
    if (field) {
      dataFormManager.selectElement({ type: 'field', field });
    }
  }
</script>

<div>
  {#if field}
    <Button appearance="ghost" on:click={selectField}>
      {#if 'fieldColumn' in field}
        <ColumnName
          column={{
            ...field.fieldColumn.column,
            constraintsType: field.fieldColumn.foreignKeyLink
              ? ['foreignkey']
              : [],
          }}
        />
      {:else if 'error' in field}
        <div class="error">
          <NameWithIcon name={$label ?? 'Field'} icon={iconError} />
        </div>
      {:else}
        <span>{$label ?? 'Field'}</span>
      {/if}
    </Button>
  {:else}
    <Button
      appearance="ghost"
      on:click={() => dataFormManager.resetSelectedElement()}
    >
      {$_('form')}
    </Button>
  {/if}
</div>

<style lang="scss">
  .error {
    color: var(--danger-color);
  }
</style>
