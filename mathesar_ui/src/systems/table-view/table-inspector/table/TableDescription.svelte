<script lang="ts">
  import EditableTextWithActions from '@mathesar/components/EditableTextWithActions.svelte';
  import EditTableHOC from '@mathesar/components/EditTableHOC.svelte';
  import { tables } from '@mathesar/stores/tables';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';

  const tabularData = getTabularDataStoreFromContext();
</script>

<EditTableHOC let:onUpdate tableId={$tabularData.id}>
  <div class="update-table-description-property-container">
    <span class="label">Description</span>
    <EditableTextWithActions
      initialValue={$tables.data.get($tabularData.id)?.description ?? ''}
      onSubmit={(description) => onUpdate({ description })}
      isLongText
    />
  </div>
</EditTableHOC>

<style lang="scss">
  .update-table-description-property-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }
</style>
