<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import { dataFilesApi } from '@mathesar/api/rest/dataFiles';
  import type { Schema } from '@mathesar/api/rpc/schemas';
  import type { Database } from '@mathesar/AppTypes';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { getTablePageUrl } from '@mathesar/routes/urls';
  import AsyncStore from '@mathesar/stores/AsyncStore';
  import { getTableFromStoreOrApi } from '@mathesar/stores/tables';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { Spinner } from '@mathesar-component-library';

  import ImportPreviewContent from './ImportPreviewContent.svelte';
  import ImportPreviewLayout from './ImportPreviewLayout.svelte';

  const tableFetch = new AsyncStore(getTableFromStoreOrApi);
  const dataFileFetch = new AsyncStore(dataFilesApi.get);

  export let database: Database;
  export let schema: Schema;
  export let tableId: number;
  export let useColumnTypeInference = false;

  function redirectToTablePage() {
    router.goto(getTablePageUrl(database.id, schema.oid, tableId));
  }

  $: void (async () => {
    const table = (await tableFetch.run(tableId)).resolvedValue;
    if (!table) {
      return;
    }
    if (table.import_verified) {
      redirectToTablePage();
      return;
    }
    const firstDataFileId = table.data_files?.[0];
    if (firstDataFileId === undefined) {
      redirectToTablePage();
      return;
    }
    await dataFileFetch.run(firstDataFileId);
  })();
  $: error = $tableFetch.error ?? $dataFileFetch.error;
</script>

<svelte:head><title>{makeSimplePageTitle($_('import'))}</title></svelte:head>

{#if $tableFetch.resolvedValue && $dataFileFetch.resolvedValue}
  <ImportPreviewContent
    {database}
    {schema}
    table={$tableFetch.resolvedValue}
    dataFile={$dataFileFetch.resolvedValue}
    {useColumnTypeInference}
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
