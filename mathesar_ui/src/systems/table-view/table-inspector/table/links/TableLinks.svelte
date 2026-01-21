<script lang="ts">
  import { filterJoinableTablesByMaxDepth } from '@mathesar/api/rpc/tables';
  import { Spinner } from '@mathesar/component-library';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { getErrorMessage } from '@mathesar/utils/errors';

  import LinksContent from './LinksContent.svelte';

  const tabularData = getTabularDataStoreFromContext();

  $: columns = $tabularData.processedColumns;
  $: table = $tabularData.table;
  $: joinableTablesValue = $tabularData.joinableTables;
  $: joinableTablesUpto1Level = $joinableTablesValue.resolvedValue
    ? filterJoinableTablesByMaxDepth($joinableTablesValue.resolvedValue, 1)
    : undefined;
</script>

<div>
  {#if $joinableTablesValue.isLoading}
    <Spinner />
  {:else if joinableTablesUpto1Level}
    <LinksContent
      {table}
      currentTableColumns={$columns}
      joinableTablesResult={joinableTablesUpto1Level}
    />
  {:else if $joinableTablesValue.error}
    <ErrorBox>{getErrorMessage($joinableTablesValue.error)}</ErrorBox>
  {/if}
</div>
