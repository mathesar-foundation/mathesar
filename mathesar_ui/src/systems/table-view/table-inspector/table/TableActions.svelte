<script lang="ts">
  import { router } from 'tinro';
  import { Help, Icon } from '@mathesar-component-library';
  import { iconDeleteMajor, iconExploration } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { deleteTable, refetchTablesForSchema } from '@mathesar/stores/tables';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import { currentDatabase } from '@mathesar/stores/databases';
  import ActionItem from '../ActionItem.svelte';
  import { createDataExplorerUrlToExploreATable } from '@mathesar/systems/data-explorer';

  const tabularData = getTabularDataStoreFromContext();

  function handleDeleteTable() {
    void confirmDelete({
      identifierType: 'Table',
      onProceed: async () => {
        await deleteTable($tabularData.id);
        // TODO handle error when deleting
        // TODO: Get db and schema from prop or context
        if ($currentDatabase && $currentSchemaId) {
          await refetchTablesForSchema($currentSchemaId);
          router.goto(
            getSchemaPageUrl($currentDatabase.name, $currentSchemaId),
            true,
          );
        }
      },
    });
  }

  $: explorationPageUrl =
    $currentDatabase && $currentSchemaId
      ? createDataExplorerUrlToExploreATable(
          $currentDatabase?.name,
          $currentSchemaId,
          $tabularData.id,
        )
      : '';
</script>

<div class="actions-container">
  {#if $currentDatabase && $currentSchemaId}
    <ActionItem href={explorationPageUrl}>
      <Icon {...iconExploration} /> <span>Explore Data</span>
      <Help
        >Open this table in Data Explorer to query and analyze your data.</Help
      >
    </ActionItem>
  {/if}

  <ActionItem danger on:click={handleDeleteTable}>
    <Icon {...iconDeleteMajor} />
    <span>Delete Table</span>
  </ActionItem>
</div>

<style lang="scss">
  .actions-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }
</style>
