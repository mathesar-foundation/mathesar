<script lang="ts">
  import type { TableEntry } from '@mathesar/api/types/tables';
  import { isTableImportConfirmationRequired } from '@mathesar/utils/tables';
  import {
    getTablePageUrl,
    getImportPreviewPageUrl,
  } from '@mathesar/routes/urls';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import {
    Button,
    DropdownMenu,
    ButtonMenuItem,
    MenuDivider,
    iconShowMore,
  } from '@mathesar-component-library';
  import { getRecordSelectorFromContext } from '@mathesar/systems/record-selector/RecordSelectorController';
  import TableName from '@mathesar/components/TableName.svelte';
  import { iconDeleteMajor, iconEdit, iconExploration } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { deleteTable, refetchTablesForSchema } from '@mathesar/stores/tables';
  import LinkMenuItem from '@mathesar/component-library/menu/LinkMenuItem.svelte';
  import { createDataExplorerUrlToExploreATable } from '@mathesar/systems/data-explorer';
  import { modal } from '@mathesar/stores/modal';
  import EditTable from './EditTable.svelte';

  const recordSelector = getRecordSelectorFromContext();
  const editTableModalController = modal.spawnModalController();

  export let table: TableEntry;
  export let database: Database;
  export let schema: SchemaEntry;

  $: isTableImportConfirmationNeeded = isTableImportConfirmationRequired(table);

  function handleDeleteTable() {
    void confirmDelete({
      identifierType: 'Table',
      onProceed: async () => {
        await deleteTable(table.id);
        await refetchTablesForSchema(schema.id);
      },
    });
  }

  function handleEditTable() {
    editTableModalController.open();
  }

  $: explorationPageUrl = createDataExplorerUrlToExploreATable(
    database.name,
    schema.id,
    table.id,
  );
</script>

<div class="container">
  <div class="table-item-header">
    <div class="name-and-description">
      <div class="name"><TableName {table} /></div>
    </div>
    <DropdownMenu
      showArrow={false}
      triggerAppearance="plain"
      closeOnInnerClick={true}
      label=""
      icon={iconShowMore}
    >
      {#if !isTableImportConfirmationNeeded}
        <ButtonMenuItem on:click={handleEditTable} icon={iconEdit}>
          Edit Table
        </ButtonMenuItem>
        <MenuDivider />
        <LinkMenuItem href={explorationPageUrl} icon={iconExploration}>
          Explore Table
        </LinkMenuItem>
        <MenuDivider />
      {/if}
      <ButtonMenuItem
        on:click={handleDeleteTable}
        danger
        icon={iconDeleteMajor}
      >
        Delete Table
      </ButtonMenuItem>
    </DropdownMenu>
    <EditTable modalController={editTableModalController} {table} />
  </div>
  <div class="actions">
    {#if isTableImportConfirmationNeeded}
      <a
        class="btn btn-plain size-medium action action-link"
        href={getImportPreviewPageUrl(database.name, schema.id, table.id)}
      >
        Confirm Imported Data
      </a>
    {:else}
      <a
        class="btn btn-plain size-medium action action-link"
        href={getTablePageUrl(database.name, schema.id, table.id)}
      >
        Go to Table
      </a>
      <Button
        on:click={() =>
          recordSelector.navigateToRecordPage({ tableId: table.id })}
        appearance="plain"
        class="action"
      >
        Find Record
      </Button>
    {/if}
  </div>
</div>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--slate-200);
    border-radius: var(--border-radius-l);
    overflow: hidden;
    min-height: 7rem;  
    max-width: 24rem; 
  }

  .table-item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;

    > :global(* + *) {
      margin-left: 0.75rem;
    }
  }

  .name-and-description {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .name {
      font-size: var(--text-size-large);
      font-weight: 500;
    }

    > :global(* + *) {
      margin-top: 0.75rem;
    }
  }

  .actions {
    display: flex;
    flex-direction: row;
    background-color: var(--sand-100);
    border-top: 1px solid var(--sand-200);
    margin-top: auto;

    :global(.action) {
      flex: 1;
      padding: 0.75rem;
      justify-content: center;

      &:first-child {
        border-right: 1px solid var(--sand-200);
        border-bottom-left-radius: var(--border-radius-l);
      }
      &:last-child {
        border-bottom-right-radius: var(--border-radius-l);
      }
      &:hover {
        background-color: var(--slate-100);
      }

      &.action-link {
        text-decoration: none;
        cursor: pointer;
        text-align: center;
      }
    }
  }
</style>
