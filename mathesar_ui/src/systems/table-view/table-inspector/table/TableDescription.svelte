<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EditableTextWithActions from '@mathesar/components/EditableTextWithActions.svelte';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { updateTable } from '@mathesar/stores/tables';

  const tabularData = getTabularDataStoreFromContext();

  export let disabled = false;

  $: ({ table } = $tabularData);

  async function handleSave(description: string) {
    await updateTable({
      schema: table.schema,
      table: { oid: table.oid, description },
    });
  }
</script>

<div class="update-table-description-property-container">
  <span class="label">{$_('table_description')}</span>
  <EditableTextWithActions
    initialValue={table.description ?? ''}
    onSubmit={handleSave}
    isLongText
    {disabled}
  />
</div>

<style lang="scss">
  .update-table-description-property-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.25rem;
    }
  }
</style>
