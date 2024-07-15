<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { TableEntry } from '@mathesar/api/rest/types/tables';
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
  import { deleteTable } from '@mathesar/stores/tables';
  import { createDataExplorerUrlToExploreATable } from '@mathesar/systems/data-explorer';
  import { getRecordSelectorFromContext } from '@mathesar/systems/record-selector/RecordSelectorController';
  import TableDeleteConfirmationBody from '@mathesar/systems/table-view/table-inspector/table/TableDeleteConfirmationBody.svelte';
  import { isTableImportConfirmationRequired } from '@mathesar/utils/tables';
  import {
    ButtonMenuItem,
    DropdownMenu,
    Icon,
    Truncate,
  } from '@mathesar-component-library';

  import EditTable from './EditTable.svelte';

  const recordSelector = getRecordSelectorFromContext();
  const editTableModalController = modal.spawnModalController();

  export let table: TableEntry;
  export let database: Database;
  export let schema: SchemaEntry;

  let isHoveringMenuTrigger = false;
  let isHoveringBottomButton = false;
  let isTableCardFocused = false;

  $: isTableImportConfirmationNeeded = isTableImportConfirmationRequired(table);
  $: tablePageUrl = isTableImportConfirmationNeeded
    ? getImportPreviewPageUrl(database.id, schema.id, table.id, {
        useColumnTypeInference: true,
      })
    : getTablePageUrl(database.id, schema.id, table.id);
  $: explorationPageUrl = createDataExplorerUrlToExploreATable(
    database.id,
    schema.id,
    table,
  );
  $: description = table.description ?? '';

  function handleDeleteTable() {
    void confirmDelete({
      identifierType: $_('table'),
      body: {
        component: TableDeleteConfirmationBody,
        props: {
          tableName: table.name,
        },
      },
      onProceed: async () => {
        await deleteTable(database, schema, table.id);
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

<div
  class="table-card"
  class:focus={isTableCardFocused}
  class:hovering-menu-trigger={isHoveringMenuTrigger}
  class:hovering-bottom-button={isHoveringBottomButton}
  class:unconfirmed-import={isTableImportConfirmationNeeded}
>
  <a
    class="link passthrough"
    href={tablePageUrl}
    aria-label={table.name}
    on:focusin={() => {
      isTableCardFocused = true;
    }}
    on:focusout={() => {
      isTableCardFocused = false;
    }}
  >
    <div class="top">
      <div class="top-content"><TableName {table} /></div>
    </div>
    <div class="description">
      {#if description}
        <Truncate
          lines={2}
          popoverPlacements={['bottom', 'left', 'top', 'right']}
        >
          {description}
        </Truncate>
      {/if}
    </div>
    <div class="bottom">
      {#if isTableImportConfirmationNeeded}
        {$_('needs_import_confirmation')}
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
      placements={['bottom-end', 'right-start', 'left-start']}
      label=""
      icon={iconMoreActions}
      size="small"
    >
      {#if !isTableImportConfirmationNeeded}
        <LinkMenuItem href={explorationPageUrl} icon={iconExploration}>
          {$_('explore_table')}
        </LinkMenuItem>
        <ButtonMenuItem on:click={handleEditTable} icon={iconEdit}>
          {$_('edit_table')}
        </ButtonMenuItem>
      {/if}
      <ButtonMenuItem
        on:click={handleDeleteTable}
        danger
        icon={iconDeleteMajor}
      >
        {$_('delete_table')}
      </ButtonMenuItem>
    </DropdownMenu>
  </div>
  {#if !isTableImportConfirmationNeeded}
    <button
      class="bottom-button passthrough"
      on:mouseenter={() => {
        isHoveringBottomButton = true;
      }}
      on:mouseleave={() => {
        isHoveringBottomButton = false;
      }}
      on:click={handleFindRecord}
    >
      <Icon {...iconSelectRecord} />
      <span class="label">{$_('find_record')}</span>
    </button>
  {/if}
</div>

<EditTable modalController={editTableModalController} {table} />

<style>
  .table-card {
    position: relative;
    isolation: isolate;
    --menu-trigger-size: 4rem;
    --padding: 1rem;
    --bottom-height: 2.5rem;
  }
  .table-card.focus {
    outline: 2px solid var(--slate-300);
    outline-offset: 1px;
    border-radius: var(--border-radius-l);
  }
  .table-card.unconfirmed-import {
    color: var(--color-text-muted);
  }
  .link {
    display: grid;
    grid-template: auto 1fr auto / 1fr;
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
  .description:not(:empty) {
    padding: 0 var(--padding) var(--padding) var(--padding);
    font-size: var(--text-size-small);
  }

  /** Menu button =========================================================== */
  .menu-container {
    position: absolute;
    top: 0;
    right: 0;
    margin: var(--size-ultra-small);
    z-index: 1;
  }
  .menu-container :global(.dropdown-menu-button) {
    width: 100%;
    height: 100%;
    font-size: var(--text-size-large);
    color: var(--slate-500);
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
  .menu-container :global(.dropdown-menu-button:hover) {
    color: var(--slate-800);
    background: var(--slate-100);
  }

  /** Bottom button========================================================== */
  .table-card .bottom {
    background: var(--sand-100);
    border-top: solid 1px var(--sand-200);
  }
  .table-card.unconfirmed-import .bottom {
    background: none;
    border-top: none;
  }
  .table-card.unconfirmed-import .bottom {
    color: var(--color-text);
  }
  .bottom-button {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 100%;
    z-index: 1;
    cursor: pointer;
  }
  .bottom-button:focus {
    outline: 2px solid var(--slate-300);
    outline-offset: 1px;
    border-bottom-left-radius: var(--border-radius-l);
    border-bottom-right-radius: var(--border-radius-l);
  }

  .hovering-bottom-button .bottom-button {
    color: inherit;
  }
  .hovering-bottom-button .bottom {
    color: inherit;
    background: var(--sand-200);
  }
  .bottom-button,
  .bottom {
    height: var(--bottom-height);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-size-small);
    color: var(--color-text-muted);
  }
  .bottom-button .label {
    margin-left: 0.25rem;
  }
</style>
