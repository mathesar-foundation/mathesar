<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';
  import { Spinner } from '@mathesar-component-library';

  import type { EditableDataFormManager } from '../data-form-utilities/DataFormManager';
  import type { FkField } from '../data-form-utilities/FkField';

  export let dataFormManager: EditableDataFormManager;
  export let dataFormField: FkField;

  $: ({ relatedTableOid } = dataFormField);
  $: linkedTableStructure = dataFormManager.getTableStructure(relatedTableOid);
  $: ({ isLoading, table } = linkedTableStructure);
</script>

<div class="sub-form-help">
  <RichText text={$_('form_fk_sub_form_help')} let:slotName>
    {#if slotName === 'tableName'}
      <span>
        {#if $isLoading}
          <Spinner />
        {:else if $table}
          <TableName table={$table} />
        {/if}
      </span>
    {/if}
  </RichText>
</div>

<style lang="scss">
  .sub-form-help {
    display: block;
    margin-bottom: var(--data_forms__selectable-element-padding);
    color: var(--stormy-600);

    span {
      display: inline-flex;
    }
  }
</style>
