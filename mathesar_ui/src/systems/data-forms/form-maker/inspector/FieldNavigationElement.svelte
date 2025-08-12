<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import { Button } from '@mathesar-component-library';

  import type { EditableDataFormManager } from '../data-form-utilities/DataFormManager';
  import type { DataFormField } from '../data-form-utilities/fields';

  export let dataFormManager: EditableDataFormManager;
  export let field: DataFormField | undefined = undefined;

  function selectField() {
    if (field) {
      dataFormManager.selectElement({ type: 'field', field });
    }
  }
</script>

<div>
  {#if field}
    <Button appearance="ghost" on:click={selectField}>
      <ColumnName
        column={{
          ...field.fieldColumn.column,
          constraintsType: field.fieldColumn.foreignKeyLink
            ? ['foreignkey']
            : [],
        }}
      />
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
