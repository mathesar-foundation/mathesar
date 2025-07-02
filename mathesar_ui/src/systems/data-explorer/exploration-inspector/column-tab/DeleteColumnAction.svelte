<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Tooltip from '@mathesar/component-library/tooltip/Tooltip.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { Button, Icon } from '@mathesar-component-library';

  import type QueryManager from '../../QueryManager';
  import type { ProcessedQueryOutputColumn } from '../../utils';

  export let selectedColumns: ProcessedQueryOutputColumn[];
  export let queryManager: QueryManager;

  $: ({ query, columnsMetaData } = queryManager);
  $: selectedColumnAliases = selectedColumns.map(
    (selectedColumn) => selectedColumn.column.alias,
  );

  $: denyDeletionDueToLastRemainingBaseColumn = (() => {
    if ($query.hasSummarizationTransform()) {
      return false;
    }
    const unselectedColumns = $query.initial_columns.filter(
      (column) => !selectedColumnAliases.includes(column.alias),
    );
    if (unselectedColumns.length === 0) {
      return false;
    }
    const doesAnyUnselectedColumnBelongToBaseTable = unselectedColumns.some(
      (initialColumn) => {
        const source = $columnsMetaData.get(initialColumn.alias)?.source;
        return (
          source?.is_initial_column &&
          source.input_table_id === $query.base_table_oid
        );
      },
    );
    if (doesAnyUnselectedColumnBelongToBaseTable) {
      return false;
    }
    return true;
  })();

  $: columnsAreUsedInTransformations = $query.areColumnsUsedInTransformations(
    selectedColumnAliases,
  );

  $: disallowColumnDeletion =
    denyDeletionDueToLastRemainingBaseColumn || columnsAreUsedInTransformations;

  function deleteSelectedColumn() {
    void queryManager.update((q) =>
      q.withoutInitialColumns(selectedColumnAliases),
    );
  }
</script>

<div class="delete-column">
  <Tooltip enabled={disallowColumnDeletion}>
    <Button
      slot="trigger"
      appearance="danger"
      disabled={disallowColumnDeletion}
      on:click={deleteSelectedColumn}
    >
      <Icon {...iconDeleteMajor} />
      <span>
        {$_('remove_columns_from_query', {
          values: { count: selectedColumnAliases.length },
        })}
      </span>
    </Button>

    <div slot="content">
      {#if selectedColumnAliases.length === 1}
        {#if denyDeletionDueToLastRemainingBaseColumn}
          {$_('single_column_delete_error_last_base_column')}
        {:else}
          {$_('single_column_delete_error_used_in_transformations')}
        {/if}
      {:else if denyDeletionDueToLastRemainingBaseColumn}
        {$_('multiple_column_delete_error_last_base_column')}
      {:else}
        {$_('multiple_column_delete_error_used_in_transformations')}
      {/if}
    </div>
  </Tooltip>
</div>

<style>
  .delete-column > :global(*) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
</style>
