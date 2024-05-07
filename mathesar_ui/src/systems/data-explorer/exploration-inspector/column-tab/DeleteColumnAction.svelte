<script lang="ts">
  import { _ } from 'svelte-i18n';

  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { Button, Collapsible, Icon } from '@mathesar-component-library';

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
          source.input_table_id === $query.base_table
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

<Collapsible isOpen triggerAppearance="plain">
  <span slot="header">{$_('actions')}</span>
  <div slot="content" class="section-content actions">
    {#if disallowColumnDeletion}
      <div class="warning">
        <WarningBox>
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
        </WarningBox>
      </div>
    {/if}

    <Button
      class="delete-button"
      appearance="outline-primary"
      disabled={disallowColumnDeletion}
      on:click={deleteSelectedColumn}
    >
      <Icon {...iconDeleteMajor} />
      <span>
        {$_('delete_columns_count', {
          values: { count: selectedColumnAliases.length },
        })}
      </span>
    </Button>
  </div>
</Collapsible>

<style>
  .warning {
    margin-bottom: var(--size-large);
  }
</style>
