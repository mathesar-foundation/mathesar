<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import { Button } from '@mathesar-component-library';

  import type { EphemeralDataFormField } from '../data-form-utilities/AbstractEphemeralField';
  import type { EditableDataFormManager } from '../data-form-utilities/DataFormManager';

  export let dataFormManager: EditableDataFormManager;
  export let field: EphemeralDataFormField | undefined = undefined;
</script>

<div>
  {#if field}
    <Button
      appearance="ghost"
      on:click={() => dataFormManager.selectElement({ type: 'field', field })}
    >
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
