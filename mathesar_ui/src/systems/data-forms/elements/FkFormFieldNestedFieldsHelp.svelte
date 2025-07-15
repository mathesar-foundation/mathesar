<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';
  import { Spinner } from '@mathesar-component-library';

  import type { EditableDataFormManager } from '../data-form-utilities/DataFormManager';
  import type { EphermeralFkField } from '../data-form-utilities/EphemeralFkField';

  export let dataFormManager: EditableDataFormManager;
  export let dataFormField: EphermeralFkField;

  $: ({ relatedTableOid } = dataFormField);
  $: linkedTableStructure = dataFormManager.getTableStructure(relatedTableOid);
  $: linkedTableStructureStore = linkedTableStructure.asyncStore;
  $: linkedTable = $linkedTableStructureStore.resolvedValue?.table;
</script>

<div class="sub-form-help">
  <RichText text={$_('form_fk_sub_form_help')} let:slotName>
    {#if slotName === 'tableName'}
      <span>
        {#if $linkedTableStructureStore?.isLoading}
          <Spinner />
        {:else if linkedTable}
          <TableName table={linkedTable} />
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
