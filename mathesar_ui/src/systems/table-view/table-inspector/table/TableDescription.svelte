<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EditableTextWithActions from '@mathesar/components/EditableTextWithActions.svelte';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { currentTablesData, updateTable } from '@mathesar/stores/tables';
  import { currentConnection } from '@mathesar/stores/databases';

  const tabularData = getTabularDataStoreFromContext();

  export let disabled = false;

  async function handleSave(description: string) {
    updateTable($currentConnection, {
      oid: $tabularData.table.oid,
      description,
    });
  }
</script>

<div class="update-table-description-property-container">
  <span class="label">{$_('description')}</span>
  <EditableTextWithActions
    initialValue={$currentTablesData.tablesMap.get($tabularData.id)
      ?.description ?? ''}
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
      margin-top: 0.5rem;
    }
  }
</style>
