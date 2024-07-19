<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EditableTextWithActions from '@mathesar/components/EditableTextWithActions.svelte';
  import EditTableHOC from '@mathesar/components/EditTableHOC.svelte';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { tables } from '@mathesar/stores/tables';

  const tabularData = getTabularDataStoreFromContext();

  export let disabled = false;
</script>

<EditTableHOC let:onUpdate tableId={$tabularData.id}>
  <div class="update-table-description-property-container">
    <span class="label">{$_('description')}</span>
    <EditableTextWithActions
      initialValue={$tables.tablesMap.get($tabularData.id)?.description ?? ''}
      onSubmit={(description) => onUpdate({ description })}
      isLongText
      {disabled}
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
