<script lang="ts">
  import { api } from '@mathesar/api/rpc';
  import { Spinner } from '@mathesar/component-library';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import type { Table } from '@mathesar/models/Table';
  import { getErrorMessage } from '@mathesar/utils/errors';

  import JoinConfig from './JoinConfig.svelte';
  import { getSimpleManyToManyRelationships } from './joinConfigUtils';

  export let table: Table;

  $: joinableTablesPromise = api.tables
    .list_joinable({
      database_id: table.schema.database.id,
      table_oid: table.oid,
      max_depth: 2,
    })
    .run();
</script>

{#await joinableTablesPromise}
  <div class="loading"><Spinner /></div>
{:then r}
  {@const simpleManyToManyRelationships = getSimpleManyToManyRelationships(r)}
  <JoinConfig {simpleManyToManyRelationships} />
{:catch error}
  <ErrorBox>{getErrorMessage(error)}</ErrorBox>
{/await}

<style>
  .loading {
    padding: var(--sm3);
    color: var(--color-fg-base-muted);
    display: grid;
    justify-content: center;
  }
</style>
