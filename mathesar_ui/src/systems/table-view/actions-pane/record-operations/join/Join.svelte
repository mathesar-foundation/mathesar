<script lang="ts">
  import { filterJoinableTablesByMaxDepth } from '@mathesar/api/rpc/tables';
  import { Spinner } from '@mathesar/component-library';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { getErrorMessage } from '@mathesar/utils/errors';

  import JoinConfig from './JoinConfig.svelte';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ meta, joinableTables } = $tabularData);
  $: joining = meta.joining;
  $: joinableTablesValue = $joinableTables;
  $: joinableTablesUpto2Levels = joinableTablesValue.resolvedValue
    ? filterJoinableTablesByMaxDepth(joinableTablesValue.resolvedValue, 2)
    : undefined;
</script>

{#if joinableTablesValue.isLoading}
  <div class="loading"><Spinner /></div>
{:else if joinableTablesUpto2Levels}
  <JoinConfig joinableTables={joinableTablesUpto2Levels} {joining} />
{:else if joinableTablesValue.error}
  <ErrorBox>{getErrorMessage(joinableTablesValue.error)}</ErrorBox>
{/if}

<style>
  .loading {
    padding: var(--sm3);
    color: var(--color-fg-base-muted);
    display: grid;
    justify-content: center;
  }
</style>
