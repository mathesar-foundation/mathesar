<script lang="ts">
  import { Spinner } from '@mathesar/component-library';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { getJoinableTablesResult } from '@mathesar/stores/tables';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import LinksSectionContainer from './LinksSectionContainer.svelte';
  import { getTableLinks } from './utils';

  const tabularData = getTabularDataStoreFromContext();
  const userProfile = getUserProfileStoreFromContext();

  $: database = $currentDatabase;
  $: schema = $currentSchema;

  $: canExecuteDDL = !!$userProfile?.hasPermission(
    { database, schema },
    'canExecuteDDL',
  );

  $: tableId = $tabularData.id;
  $: columns = $tabularData.processedColumns;
</script>

<div>
  {#await getJoinableTablesResult(tableId)}
    <Spinner />
  {:then joinableTablesResult}
    <LinksSectionContainer
      linksInThisTable={getTableLinks(
        'in_this_table',
        joinableTablesResult,
        $columns,
      )}
      linksFromOtherTables={getTableLinks(
        'from_other_tables',
        joinableTablesResult,
        $columns,
      )}
      {canExecuteDDL}
    />
  {/await}
</div>
