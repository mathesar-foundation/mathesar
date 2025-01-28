<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    iconDeleteMajor,
    iconMoveColumnsToExistingLinkedTable,
    iconMoveColumnsToNewLinkedTable,
  } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { modal } from '@mathesar/stores/modal';
  import {
    type ProcessedColumn,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { Button, Icon, iconSettings } from '@mathesar-component-library';

  import ExtractColumnsModal from './column-extraction/ExtractColumnsModal.svelte';
  import { ExtractColumnsModalController } from './column-extraction/ExtractColumnsModalController';

  const tabularData = getTabularDataStoreFromContext();
  const extractColumns = new ExtractColumnsModalController(
    modal.getPropsForNewModal(),
  );

  export let columns: ProcessedColumn[];

  $: ({ table, processedColumns, columnsDataStore } = $tabularData);
  $: column = columns.length === 1 ? columns[0] : undefined;
  $: canMoveToLinkedTable = [...$processedColumns].some(([, c]) => c.linkFk);
  $: ({ currentRoleOwns } = table.currentAccess);

  function handleDeleteColumn(c: ProcessedColumn) {
    void confirmDelete({
      identifierType: $_('column'),
      identifierName: c.column.name,
      body: [
        $_('all_objects_related_to_column_affected'),
        $_('could_break_tables_views'),
        $_('are_you_sure_to_proceed'),
      ],
      onProceed: () => columnsDataStore.deleteColumn(c.id),
    });
  }

  function handleMoveColumnsToNewLinkedTable() {
    extractColumns.targetType.set('newTable');
    extractColumns.columns.set(columns);
    extractColumns.open();
  }

  function handleMoveColumnsToExistingLinkedTable() {
    extractColumns.targetType.set('existingTable');
    extractColumns.columns.set(columns);
    extractColumns.open();
  }
</script>

<div class="actions-container">
  <Button
    on:click={handleMoveColumnsToNewLinkedTable}
    disabled={!$currentRoleOwns}
    appearance="action"
  >
    <div class="action-item">
      <div>
        <Icon {...iconMoveColumnsToNewLinkedTable} />
        <span>
          {$_('extract_columns_to_new_table', {
            values: { count: columns.length },
          })}
        </span>
      </div>
      <Icon {...iconSettings} />
    </div>
  </Button>
  {#if canMoveToLinkedTable}
    <Button
      on:click={handleMoveColumnsToExistingLinkedTable}
      disabled={!$currentRoleOwns}
      appearance="action"
    >
      <div class="action-item">
        <div>
          <Icon {...iconMoveColumnsToExistingLinkedTable} />
          <span>
            {$_('move_columns_to_linked_table', {
              values: { count: columns.length },
            })}
          </span>
        </div>
        <Icon {...iconSettings} />
      </div>
    </Button>
  {/if}
  {#if column}
    <Button
      appearance="outline-primary"
      on:click={() => column && handleDeleteColumn(column)}
      disabled={!$currentRoleOwns}
    >
      <Icon {...iconDeleteMajor} />
      <span>
        {$_('delete_column')}
      </span>
    </Button>
  {/if}
</div>

<ExtractColumnsModal controller={extractColumns} />

<style lang="scss">
  .actions-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }

  .action-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
