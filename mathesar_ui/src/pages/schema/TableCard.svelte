<script lang="ts">
  import {
    ButtonMenuItem,
    DropdownMenu,
    Truncate,
  } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import LinkMenuItem from '@mathesar/component-library/menu/LinkMenuItem.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import {
    iconDeleteMajor,
    iconEdit,
    iconExploration,
    iconMoreActions,
    iconSelectRecord,
  } from '@mathesar/icons';
  import {
    getImportPreviewPageUrl,
    getTablePageUrl,
  } from '@mathesar/routes/urls';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { modal } from '@mathesar/stores/modal';
  import { deleteTable, refetchTablesForSchema } from '@mathesar/stores/tables';
  import { createDataExplorerUrlToExploreATable } from '@mathesar/systems/data-explorer';
  import { getRecordSelectorFromContext } from '@mathesar/systems/record-selector/RecordSelectorController';
  import { isTableImportConfirmationRequired } from '@mathesar/utils/tables';
  import EditTable from './EditTable.svelte';

  const recordSelector = getRecordSelectorFromContext();
  const editTableModalController = modal.spawnModalController();

  export let table: TableEntry;
  export let database: Database;
  export let schema: SchemaEntry;

  let isHoveringMenuTrigger = false;

  $: isTableImportConfirmationNeeded = isTableImportConfirmationRequired(table);
  $: tablePageUrl = isTableImportConfirmationNeeded
    ? getImportPreviewPageUrl(database.name, schema.id, table.id)
    : getTablePageUrl(database.name, schema.id, table.id);
  $: explorationPageUrl = createDataExplorerUrlToExploreATable(
    database.name,
    schema.id,
    table,
  );
  $: description = table.description ?? '';

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

  function handleFindRecord() {
    recordSelector.navigateToRecordPage({ tableId: table.id });
  }
</script>

<div class="table-card" class:hovering-menu-trigger={isHoveringMenuTrigger}>
  <a class="link passthrough" href={tablePageUrl} aria-label={table.name}>
    <div class="top">
      <div class="top-content"><TableName {table} /></div>
      <div class="fake-button" />
    </div>
    <div class="bottom">
      {#if description}
        <Truncate lines={2} popoverPlacement="bottom">{description}</Truncate>
      {/if}
    </div>
  </a>
  <div
    class="menu-container"
    on:mouseenter={() => {
      isHoveringMenuTrigger = true;
    }}
    on:mouseleave={() => {
      isHoveringMenuTrigger = false;
    }}
  >
    <DropdownMenu
      showArrow={false}
      triggerAppearance="ghost"
      triggerClass="dropdown-menu-button"
      closeOnInnerClick={true}
      trigger
      label=""
      icon={iconMoreActions}
      size="small"
    >
      {#if !isTableImportConfirmationNeeded}
        <ButtonMenuItem on:click={handleFindRecord} icon={iconSelectRecord}>
          Find a Record
        </ButtonMenuItem>
        <ButtonMenuItem on:click={handleEditTable} icon={iconEdit}>
          Edit Table
        </ButtonMenuItem>
        <LinkMenuItem href={explorationPageUrl} icon={iconExploration}>
          Explore Table
        </LinkMenuItem>
      {/if}
      <ButtonMenuItem
        on:click={handleDeleteTable}
        danger
        icon={iconDeleteMajor}
      >
        Delete Table
      </ButtonMenuItem>
    </DropdownMenu>
  </div>
</div>

<EditTable modalController={editTableModalController} {table} />

<style>
  .table-card {
    position: relative;
    isolation: isolate;
    --menu-trigger-size: 3rem;
    --padding: 1rem;
  }
  .link {
    display: block;
    border: 1px solid var(--slate-300);
    border-radius: var(--border-radius-l);
    cursor: pointer;
    overflow: hidden;
    height: 100%;
  }
  .link:hover {
    border-color: var(--slate-500);
    box-shadow: 0 0.2rem 0.4rem 0 rgba(0, 0, 0, 0.1);
  }
  .top {
    display: flex;
    overflow: hidden;
  }
  .top-content {
    flex: 1 1 auto;
    overflow: hidden;
    font-size: var(--text-size-large);
    height: var(--menu-trigger-size);
    display: flex;
    align-items: center;
    padding: 0 var(--padding);
  }
  .fake-button {
    flex: 0 0 auto;
    width: var(--menu-trigger-size);
    height: var(--menu-trigger-size);
  }
  .hovering-menu-trigger .fake-button {
    background: var(--slate-100);
  }
  .bottom:not(:empty) {
    padding: 0 var(--padding) var(--padding) var(--padding);
  }
  .menu-container {
    position: absolute;
    top: 0;
    right: 0;
    width: var(--menu-trigger-size);
    height: var(--menu-trigger-size);
    z-index: 1;
  }
  .menu-container :global(.dropdown-menu-button) {
    width: 100%;
    height: 100%;
    font-size: var(--text-size-large);
    color: var(--slate-500);
  }
  .menu-container :global(.dropdown-menu-button:hover) {
    color: var(--slate-800);
  }
</style>
