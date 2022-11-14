<script lang="ts">
  import EditableTextWithActions from '@mathesar/components/EditableTextWithActions.svelte';
  import EditTableHOC from '@mathesar/components/EditTableHOC.svelte';
  import { tables } from '@mathesar/stores/tables';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';

  const tabularData = getTabularDataStoreFromContext();
</script>

<EditTableHOC
  let:getNameValidationErrors
  let:onUpdate
  tableId={$tabularData.id}
>
  <div class="rename-table-property-container">
    <span class="label">Name</span>
    <EditableTextWithActions
      initialValue={$tables.data.get($tabularData.id)?.name ?? ''}
      onSubmit={onUpdate}
      getValidationErrors={getNameValidationErrors}
    />
  </div>
</EditTableHOC>

<style>
  .rename-table-property-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .label {
    font-size: var(--text-size-small);
    margin-left: 0.5rem;
  }
</style>
