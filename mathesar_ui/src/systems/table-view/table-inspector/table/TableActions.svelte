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
  import { currentSchema } from '@mathesar/stores/schemas';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { currentTable, deleteTable, tables } from '@mathesar/stores/tables';
  import {
    constructDataExplorerUrlToSummarizeFromGroup,
    createDataExplorerUrlToExploreATable,
  } from '@mathesar/systems/data-explorer';
  import TableDeleteConfirmationBody from './TableDeleteConfirmationBody.svelte';

  export let canExecuteDDL: boolean;

  const tabularData = getTabularDataStoreFromContext();

  $: ({ id, columnsDataStore, meta } = $tabularData);
  $: ({ grouping } = meta);
  $: ({ columns } = columnsDataStore);
  $: explorationPageUrl =
    $currentDatabase && $currentSchema
      ? createDataExplorerUrlToExploreATable(
          $currentDatabase?.name,
          $currentSchema.id,
          {
            id: $tabularData.id,
            name: $tables.data.get($tabularData.id)?.name ?? '',
          },
        )
      : '';
  $: summarizationUrl = (() => {
    if (!$currentTable || !$currentDatabase || !$currentSchema) {
      return undefined;
    }
    return constructDataExplorerUrlToSummarizeFromGroup(
      $currentDatabase.name,
      $currentSchema.id,
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
      body: {
        component: TableDeleteConfirmationBody,
        props: {
          tableName: $currentTable?.name,
        },
      },
      onProceed: async () => {
        // TODO handle error when deleting
        // TODO: Get db and schema from prop or context
        const database = $currentDatabase;
        const schema = $currentSchema;
        if (database && schema) {
          await deleteTable(database, schema, $tabularData.id);
          router.goto(getSchemaPageUrl(database.name, schema.id), true);
        }
      },
    });
  }
</script>

<div class="actions-container">
  {#if $currentDatabase && $currentSchema}
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
