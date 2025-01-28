<script lang="ts">
  import { _ } from 'svelte-i18n';

  import LinkMenuItem from '@mathesar/component-library/menu/LinkMenuItem.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import {
    iconDeleteMajor,
    iconEdit,
    iconExploration,
    iconMoreActions,
    iconPermissions,
    iconSelectRecord,
  } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import type { Table } from '@mathesar/models/Table';
  import {
    getImportPreviewPageUrl,
    getTablePageUrl,
  } from '@mathesar/routes/urls';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { deleteTable } from '@mathesar/stores/tables';
  import { createDataExplorerUrlToExploreATable } from '@mathesar/systems/data-explorer';
  import { getRecordSelectorFromContext } from '@mathesar/systems/record-selector/RecordSelectorController';
  import TableDeleteConfirmationBody from '@mathesar/systems/table-view/table-inspector/table/TableDeleteConfirmationBody.svelte';
  import { tableRequiresImportConfirmation } from '@mathesar/utils/tables';
  import {
    ButtonMenuItem,
    DropdownMenu,
    Icon,
    Truncate,
  } from '@mathesar-component-library';

  const recordSelector = getRecordSelectorFromContext();

  export let table: Table;
  export let database: Database;
  export let schema: Schema;
  export let openEditTableModal: (_table: Table) => void;
  export let openTablePermissionsModal: (_table: Table) => void;

  $: ({ currentRoleOwns, currentRolePrivileges } = table.currentAccess);

  let isHoveringMenuTrigger = false;
  let isHoveringBottomButton = false;
  let isTableCardFocused = false;

  $: requiresImportConfirmation = tableRequiresImportConfirmation(table);
  $: tablePageUrl = requiresImportConfirmation
    ? getImportPreviewPageUrl(database.id, schema.oid, table.oid, {
        useColumnTypeInference: true,
      })
    : getTablePageUrl(database.id, schema.oid, table.oid);
  $: explorationPageUrl = createDataExplorerUrlToExploreATable(
    database.id,
    schema.oid,
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
        await deleteTable(schema, table.oid);
      },
    });
  }

  function handleFindRecord() {
    recordSelector.navigateToRecordPage({ tableId: table.oid });
  }
</script>

<div
  class="table-card"
  class:focus={isTableCardFocused}
  class:no-select={!$currentRolePrivileges.has('SELECT')}
  class:hovering-menu-trigger={isHoveringMenuTrigger}
  class:hovering-bottom-button={isHoveringBottomButton}
  class:unconfirmed-import={requiresImportConfirmation}
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
      {#if requiresImportConfirmation}
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
      {#if !requiresImportConfirmation}
        <LinkMenuItem
          href={explorationPageUrl}
          icon={iconExploration}
          disabled={!$currentRolePrivileges.has('SELECT')}
        >
          {$_('explore_table')}
        </LinkMenuItem>
        <ButtonMenuItem
          on:click={() => openEditTableModal(table)}
          icon={iconEdit}
          disabled={!$currentRoleOwns}
        >
          {$_('edit_table')}
        </ButtonMenuItem>
        <ButtonMenuItem
          on:click={() => openTablePermissionsModal(table)}
          icon={iconPermissions}
        >
          {$_('table_permissions')}
        </ButtonMenuItem>
      {/if}
      <ButtonMenuItem
        on:click={handleDeleteTable}
        danger
        icon={iconDeleteMajor}
        disabled={!$currentRoleOwns}
      >
        {$_('delete_table')}
      </ButtonMenuItem>
    </DropdownMenu>
  </div>
  {#if !requiresImportConfirmation}
    <button
      class="bottom-button passthrough"
      on:mouseenter={() => {
        isHoveringBottomButton = true;
      }}
      on:mouseleave={() => {
        isHoveringBottomButton = false;
      }}
      on:click={handleFindRecord}
      disabled={!$currentRolePrivileges.has('SELECT')}
    >
      <Icon {...iconSelectRecord} />
      <span class="label">{$_('find_record')}</span>
    </button>
  {/if}
</div>

<style>
  .table-card {
    position: relative;
    isolation: isolate;
    --menu-trigger-size: 3rem;
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
    border: 1px solid var(--slate-200);
    border-radius: var(--border-radius-l);
    cursor: pointer;
    overflow: hidden;
    height: 100%;
    background-color: var(--white);
    font-weight: var(--font-weight-medium);
  }
  .link:hover {
    border-color: var(--slate-300);
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
    font-size: var(--text-size-base);
    color: var(--slate-500);
    font-weight: var(--font-weight-normal);
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
    background: var(--white);
    border-top: solid 1px var(--slate-100);
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
  .bottom-button:disabled {
    cursor: not-allowed;
  }
  .bottom-button:not(:disabled):focus {
    outline: 2px solid var(--slate-300);
    outline-offset: 1px;
    border-bottom-left-radius: var(--border-radius-l);
    border-bottom-right-radius: var(--border-radius-l);
  }

  .hovering-bottom-button .bottom-button:not(:disabled) {
    color: inherit;
  }
  .hovering-bottom-button:not(.no-select) .bottom {
    color: inherit;
    background: var(--slate-50);
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
  .no-select .bottom-button,
  .no-select .bottom {
    color: var(--slate-300);
  }
  .bottom-button .label {
    margin-left: 0.25rem;
  }
</style>
