<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EditableTextWithActions from '@mathesar/components/EditableTextWithActions.svelte';
  import EditTableHOC from '@mathesar/components/EditTableHOC.svelte';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { currentTablesData } from '@mathesar/stores/tables';

  const tabularData = getTabularDataStoreFromContext();

  export let disabled = false;
</script>

<EditTableHOC
  let:getNameValidationErrors
  let:onUpdate
  tableId={$tabularData.id}
>
  <div class="rename-table-property-container">
    <span class="label">{$_('name')}</span>
    <EditableTextWithActions
      initialValue={$currentTablesData.tablesMap.get($tabularData.id)?.name ??
        ''}
      onSubmit={(name) => onUpdate({ name })}
      getValidationErrors={getNameValidationErrors}
      {disabled}
    />
  </div>
</EditTableHOC>

<style lang="scss">
  .rename-table-property-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }
</style>
