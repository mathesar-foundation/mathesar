<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import type { JoinableTablesResult } from '@mathesar/api/rpc/tables';
  import { Spinner } from '@mathesar/component-library';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import type { RelatedColumns } from '@mathesar/stores/table-data';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { getErrorMessage } from '@mathesar/utils/errors';

  import RelatedColumnsTree from './RelatedColumnsTree.svelte';

  export let relatedColumns: Writable<RelatedColumns>;

  const tabularData = getTabularDataStoreFromContext();
  $: table = $tabularData.table;
  $: databaseId = table.schema.database.id;
  $: tableOid = table.oid;

  async function fetchJoinableTables(
    dbId: number,
    tblOid: number,
  ): Promise<JoinableTablesResult> {
    return api.tables
      .list_joinable({
        database_id: dbId,
        table_oid: tblOid,
      })
      .run();
  }

  let joinableTablesPromise: Promise<JoinableTablesResult>;
  $: joinableTablesPromise = fetchJoinableTables(databaseId, tableOid);
</script>

<div class="related-columns-content">
  <header class="header">
    <h3>{$_('related_columns')}</h3>
  </header>

  <div class="content">
    {#await joinableTablesPromise}
      <div class="loading">
        <Spinner />
      </div>
    {:then joinableTablesResult}
      <RelatedColumnsTree {joinableTablesResult} {relatedColumns} />
    {:catch error}
      <ErrorBox>{getErrorMessage(error)}</ErrorBox>
    {/await}
  </div>
</div>

<style lang="scss">
  .related-columns-content {
    min-width: 500px;
    max-width: 700px;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
  }

  .header {
    padding: var(--lg1);
    border-bottom: 1px solid var(--color-border);
    background: linear-gradient(
      to bottom,
      var(--color-bg),
      var(--color-bg-raised)
    );

    h3 {
      margin: 0;
      font-size: var(--lg1);
      font-weight: 600;
      color: var(--color-fg-base);
    }
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: var(--lg1);
    background-color: var(--color-bg-raised);

    // Custom scrollbar styling
    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: var(--color-bg);
      border-radius: var(--border-radius-m);
    }

    &::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: var(--border-radius-m);

      &:hover {
        background: var(--color-border-dark);
      }
    }
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--lg3);
  }
</style>
