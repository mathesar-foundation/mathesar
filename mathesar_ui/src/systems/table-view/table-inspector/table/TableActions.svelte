<script lang="ts">
  import { router } from 'tinro';

  import {
    AnchorButton,
    Button,
    Help,
    Icon,
    iconExternalLink,
  } from '@mathesar-component-library';
  import { iconDeleteMajor, iconExploration } from '@mathesar/icons';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import {
    currentTable,
    deleteTable,
    refetchTablesForSchema,
    tables,
  } from '@mathesar/stores/tables';
  import {
    constructDataExplorerUrlToSummarizeFromGroup,
    createDataExplorerUrlToExploreATable,
  } from '@mathesar/systems/data-explorer';

  export let canExecuteDDL: boolean;

  const tabularData = getTabularDataStoreFromContext();

  $: ({ id, columnsDataStore, meta } = $tabularData);
  $: ({ grouping } = meta);
  $: ({ columns } = columnsDataStore);
  $: explorationPageUrl =
    $currentDatabase && $currentSchemaId
      ? createDataExplorerUrlToExploreATable(
          $currentDatabase?.name,
          $currentSchemaId,
          {
            id: $tabularData.id,
            name: $tables.data.get($tabularData.id)?.name ?? '',
          },
        )
      : '';
  $: summarizationUrl = (() => {
    if (!$currentTable || !$currentDatabase || !$currentSchemaId) {
      return undefined;
    }
    return constructDataExplorerUrlToSummarizeFromGroup(
      $currentDatabase.name,
      $currentSchemaId,
      {
        baseTable: { id, name: $currentTable.name },
        columns: $columns,
        terseGrouping: $grouping.terse(),
      },
    );
  })();

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
</script>

<div class="actions-container">
  {#if $currentDatabase && $currentSchemaId}
    <AnchorButton href={explorationPageUrl}>
      <div class="action-item">
        <div>
          <Icon {...iconExploration} /> <span>Explore Data</span>
          <Help>
            Open this table in Data Explorer to query and analyze your data.
          </Help>
        </div>
        <Icon {...iconExternalLink} />
      </div>
    </AnchorButton>
    {#if summarizationUrl}
      <AnchorButton href={summarizationUrl}>
        <div class="action-item">
          <div>
            <Icon {...iconExploration} />
            <span>Summarize in Data Explorer</span>
            <Help>
              Open a pre-configured exploration based on the current table
              display.
            </Help>
          </div>
          <Icon {...iconExternalLink} />
        </div>
      </AnchorButton>
    {/if}
  {/if}

  {#if canExecuteDDL}
    <Button appearance="outline-primary" on:click={handleDeleteTable}>
      <Icon {...iconDeleteMajor} />
      <span>Delete Table</span>
    </Button>
  {/if}
</div>

<style lang="scss">
  .actions-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }

  .action-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
