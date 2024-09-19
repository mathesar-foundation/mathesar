<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EditableTextWithActions from '@mathesar/components/EditableTextWithActions.svelte';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import {
    factoryToGetTableNameValidationErrors,
    updateTable,
  } from '@mathesar/stores/tables';

  const tabularData = getTabularDataStoreFromContext();

  export let disabled = false;

  $: ({ table } = $tabularData);
  $: getNameValidationErrors = factoryToGetTableNameValidationErrors(table);

  async function handleSubmit(name: string) {
    await updateTable({
      schema: table.schema,
      table: {
        oid: table.oid,
        name,
      },
    });
  }
</script>

<div class="rename-table-property-container">
  <span class="label">{$_('name')}</span>
  <EditableTextWithActions
    initialValue={table.name}
    onSubmit={handleSubmit}
    getValidationErrors={$getNameValidationErrors}
    {disabled}
  />
</div>

<style lang="scss">
  .rename-table-property-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.25rem;
    }
  }
  .label {
    font-weight: var(--font-weight-medium);
  }
</style>
