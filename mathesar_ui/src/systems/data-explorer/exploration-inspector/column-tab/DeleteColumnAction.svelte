<script lang="ts">
  import { Collapsible, Button, Icon } from '@mathesar-component-library';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { pluralize } from '@mathesar/utils/languageUtils';
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
    queryManager.clearSelection();
  }
</script>

<Collapsible isOpen triggerAppearance="plain">
  <span slot="header">Actions</span>
  <div slot="content" class="section-content actions">
    {#if disallowColumnDeletion}
      <div class="warning">
        <WarningBox>
          {#if selectedColumnAliases.length === 1}
            {#if denyDeletionDueToLastRemainingBaseColumn}
              This column cannot be deleted because atleast one column from the
              base table is required. Please add another column from the base
              table before deleting this column.
            {:else}
              This column cannot be deleted because it is either used in
              transformations or a result of transformations. Please remove the
              column from the transformations before deleting it.
            {/if}
          {:else if denyDeletionDueToLastRemainingBaseColumn}
            Some of the selected columns cannot be deleted because atleast one
            column from the base table is required. Please add another column
            from the base table before deleting them.
          {:else}
            Some of the selected columns cannot be deleted because they're
            either used in transformations or results of transformations. Please
            remove them from the transformations before deleting them.
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
      <span>Delete {pluralize(selectedColumnAliases, 'columns', 'title')}</span>
    </Button>
  </div>
</Collapsible>

<style>
  .warning {
    margin-bottom: var(--size-large);
  }
</style>
