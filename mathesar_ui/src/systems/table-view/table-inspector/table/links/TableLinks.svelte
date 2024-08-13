<script lang="ts">
  import { api } from '@mathesar/api/rpc';
  import { Spinner } from '@mathesar/component-library';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { getErrorMessage } from '@mathesar/utils/errors';

  import LinksSectionContainer from './LinksSectionContainer.svelte';

  const tabularData = getTabularDataStoreFromContext();

  $: columns = $tabularData.processedColumns;

  function getJoinableTables(databaseId: number, tableOid: number) {
    return api.tables
      .list_joinable({
        database_id: databaseId,
        table_oid: tableOid,
        max_depth: 1,
      })
      .run();
  }
</script>

<div>
  {#await getJoinableTables($currentDatabase.id, $tabularData.table.oid)}
    <Spinner />
  {:then joinableTablesResult}
    <LinksSectionContainer
      currentTableColumns={$columns}
      {joinableTablesResult}
    />
  {:catch error}
    <ErrorBox>{getErrorMessage(error)}</ErrorBox>
  {/await}
</div>
