<script lang="ts">
  import { Collapsible, Button, Icon } from '@mathesar-component-library';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { pluralize } from '@mathesar/utils/languageUtils';
  import { LL } from '@mathesar/i18n/i18n-svelte';
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
  <span slot="header">{$LL.general.actions()}</span>
  <div slot="content" class="section-content actions">
    {#if disallowColumnDeletion}
      <div class="warning">
        <WarningBox>
          {#if selectedColumnAliases.length === 1}
            {#if denyDeletionDueToLastRemainingBaseColumn}
              {$LL.deleteColumnAction.cannotDeleteColumnLastRemainingBaseColumn()}
            {:else}
              {$LL.deleteColumnAction.cannotDeleteColumnUsedInTransformation()}
            {/if}
          {:else if denyDeletionDueToLastRemainingBaseColumn}
            {$LL.deleteColumnAction.cannotDeleteColumnsLastRemainingBaseColumn()}
          {:else}
            {$LL.deleteColumnAction.cannotDeleteColumnsUsedInTransformation()}
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
