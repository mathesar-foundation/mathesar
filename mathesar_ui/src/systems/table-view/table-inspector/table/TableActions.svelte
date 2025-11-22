<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import { getQueryStringFromParams } from '@mathesar/api/rest/utils/requestUtils';
  import {
    iconDeleteMajor,
    iconExploration,
    iconExport,
    iconImportData,
  } from '@mathesar/icons';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { deleteTable } from '@mathesar/stores/tables';
  import {
    constructDataExplorerUrlToSummarizeFromGroup,
    createDataExplorerUrlToExploreATable,
  } from '@mathesar/systems/data-explorer';
  import { importModalContext } from '@mathesar/systems/table-view/import/ImportController';
  import {
    AnchorButton,
    Button,
    Help,
    Icon,
    iconExternalLink,
  } from '@mathesar-component-library';

  import TableDeleteConfirmationBody from './TableDeleteConfirmationBody.svelte';

  const tabularData = getTabularDataStoreFromContext();
  const importModal = importModalContext.getOrError();

  $: ({ table, columnsDataStore, meta, canInsertRecords, canSelectRecords } =
    $tabularData);

  $: ({ filtering, sorting, grouping } = meta);
  $: ({ columns } = columnsDataStore);
  $: explorationPageUrl = createDataExplorerUrlToExploreATable(
    table.schema.database.id,
    table.schema.oid,
    table,
  );
  $: exportLinkParams = getQueryStringFromParams({
    database_id: table.schema.database.id,
    table_oid: table.oid,
    ...$sorting.recordsRequestParamsIncludingGrouping($grouping),
    ...$filtering.recordsRequestParams(),
  });
  $: summarizationUrl = (() =>
    constructDataExplorerUrlToSummarizeFromGroup(
      table.schema.database.id,
      table.schema.oid,
      {
        databaseId: table.schema.database.id,
        schemaOid: table.schema.oid,
        baseTable: table,
        columns: $columns,
        terseGrouping: $grouping.terse(),
      },
    ))();
  $: ({ currentRoleOwns } = table.currentAccess);

  function handleDeleteTable() {
    void confirmDelete({
      identifierType: $_('table'),
      body: {
        component: TableDeleteConfirmationBody,
        props: {
          tableName: table.name,
        },
      },
      onProceed: async () => {
        await deleteTable(table.schema, table.oid);
        router.goto(
          getSchemaPageUrl(table.schema.database.id, table.schema.oid),
          true,
        );
      },
    });
  }
</script>

<div class="actions-container">
  <AnchorButton href={explorationPageUrl} appearance="action">
    <div class="action-item">
      <div>
        <Icon {...iconExploration} /> <span>{$_('explore_data')}</span>
        <Help>
          {$_('open_table_in_data_explorer')}
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
          <span>{$_('summarize_in_data_explorer')}</span>
          <Help>
            {$_('summarize_in_data_explorer_help')}
          </Help>
        </div>
        <Icon {...iconExternalLink} />
      </div>
    </AnchorButton>
  {/if}

  <Button
    on:click={() => importModal.open()}
    disabled={!$canInsertRecords}
    appearance="action"
  >
    <Icon {...iconImportData} />
    <span>{$_('import')}</span>
  </Button>

  {#if $canSelectRecords}
    <AnchorButton
      href="/api/export/v0/tables/?{exportLinkParams}"
      appearance="action"
      data-tinro-ignore
      aria-label={$_('export')}
      download="{table.name}.csv"
    >
      <div class="action-item">
        <div>
          <Icon {...iconExport} />
          <span>{$_('export')}</span>
          <Help>
            {$_('export_table_as_csv_help', {
              values: { tableName: table.name },
            })}
          </Help>
        </div>
      </div>
    </AnchorButton>
  {/if}

  <Button
    appearance="danger"
    on:click={handleDeleteTable}
    disabled={!$currentRoleOwns}
  >
    <Icon {...iconDeleteMajor} />
    <span>{$_('delete_table')}</span>
  </Button>
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
