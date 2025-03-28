<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import { dataFilesApi } from '@mathesar/api/rest/dataFiles';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { getTablePageUrl } from '@mathesar/routes/urls';
  import AsyncStore from '@mathesar/stores/AsyncStore';
  import { getTableFromStoreOrApi } from '@mathesar/stores/tables';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { tableRequiresImportConfirmation } from '@mathesar/utils/tables';
  import { Spinner } from '@mathesar-component-library';

  import ImportPreviewContent from './ImportPreviewContent.svelte';
  import ImportPreviewLayout from './ImportPreviewLayout.svelte';

  const tableFetch = new AsyncStore(getTableFromStoreOrApi);
  const dataFileFetch = new AsyncStore(dataFilesApi.get);

  export let database: Database;
  export let schema: Schema;
  export let tableId: number;
  export let useColumnTypeInference = false;
  export let renamedIdColumn: string | undefined = undefined;

  function redirectToTablePage() {
    router.goto(getTablePageUrl(database.id, schema.oid, tableId));
  }

  $: void (async () => {
    const table = (await tableFetch.run({ schema, tableOid: tableId }))
      .resolvedValue;
    if (!table) {
      return;
    }

    if (!tableRequiresImportConfirmation(table)) {
      redirectToTablePage();
      return;
    }
    const dataFileId = table.metadata?.data_file_id ?? undefined;
    if (dataFileId === undefined) {
      redirectToTablePage();
      return;
    }
    await dataFileFetch.run(dataFileId);
  })();
  $: error = $tableFetch.error ?? $dataFileFetch.error;
</script>

<svelte:head><title>{makeSimplePageTitle($_('import'))}</title></svelte:head>

{#if $tableFetch.resolvedValue && $dataFileFetch.resolvedValue}
  <ImportPreviewContent
    {schema}
    table={$tableFetch.resolvedValue}
    dataFile={$dataFileFetch.resolvedValue}
    {useColumnTypeInference}
    {renamedIdColumn}
    refreshTable={async () => {
      // Need to re-fetch the table in order to get the updated metadata
      await tableFetch.run({ schema, tableOid: tableId, clearCache: true });
    }}
  />
{:else if $tableFetch.isLoading || $dataFileFetch.isLoading}
  <ImportPreviewLayout><Spinner /></ImportPreviewLayout>
{:else}
  <ImportPreviewLayout>
    <ErrorBox>
      <p>{$_('unable_to_load_preview')}</p>
      <p>{getErrorMessage(error)}</p>
    </ErrorBox>
  </ImportPreviewLayout>
{/if}
