<script lang="ts">
  import { _ } from 'svelte-i18n';

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
    Button,
    ButtonMenuItem,
    DropdownMenu,
    Icon,
    LinkMenuItem,
    Tooltip,
    Truncate,
  } from '@mathesar-component-library';

  const recordSelector = getRecordSelectorFromContext();

  export let table: Table;
  export let database: Database;
  export let schema: Schema;
  export let openEditTableModal: (_table: Table) => void;
  export let openTablePermissionsModal: (_table: Table) => void;
  export let condensed = false;

  $: ({ currentRoleOwns, currentRolePrivileges } = table.currentAccess);

  let isHoveringMenuTrigger = false;
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
  class="table-row"
  class:focus={isTableCardFocused}
  class:no-select={!$currentRolePrivileges.has('SELECT')}
  class:hovering-menu-trigger={isHoveringMenuTrigger}
  class:unconfirmed-import={requiresImportConfirmation}
>
  <a
    class="row-content passthrough"
    href={tablePageUrl}
    aria-label={table.name}
    on:focusin={() => {
      isTableCardFocused = true;
    }}
    on:focusout={() => {
      isTableCardFocused = false;
    }}
  >
    <div class="table-info">
      <div class="table-name">
        <TableName {table} />
      </div>
      {#if description}
        <div class="description">
          <Truncate
            lines={1}
            popoverPlacements={['bottom', 'left', 'top', 'right']}
          >
            {description}
          </Truncate>
        </div>
      {/if}
    </div>
    <div class="status">
      {#if requiresImportConfirmation}
        <span class="import-status">{$_('needs_import_confirmation')}</span>
      {/if}
    </div>
  </a>

  <div class="actions">
    {#if !requiresImportConfirmation}
      <Tooltip enabled={condensed}>
        <Button
          slot="trigger"
          on:click={handleFindRecord}
          appearance="secondary"
          size="small"
          disabled={!$currentRolePrivileges.has('SELECT')}
          class="action-button"
        >
          <Icon {...iconSelectRecord} />
          {#if !condensed}
            <span>{$_('find_record')}</span>
          {/if}
        </Button>
        <span slot="content">{$_('find_record')}</span>
      </Tooltip>
    {/if}

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
        triggerAppearance="plain"
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
  </div>
</div>

<style lang="scss">
  .table-row {
    position: relative;
    display: flex;
    align-items: center;
    border: 1px solid var(--card-border);
    background-color: var(--card-background);
    overflow: hidden;
    border-radius: var(--corner-tl) var(--corner-tr) var(--corner-br)
      var(--corner-bl);
    --corner-tl: 0;
    --corner-tr: 0;
    --corner-br: 0;
    --corner-bl: 0;
  }

  .table-row + :global(.table-row) {
    border-top: none;
  }

  .table-row:first-child {
    --corner-tl: var(--border-radius-l);
    --corner-tr: var(--border-radius-l);
  }
  .table-row:last-child {
    --corner-br: var(--border-radius-l);
    --corner-bl: var(--border-radius-l);
  }

  .table-row.focus:not(:hover) {
    outline: 1px solid var(--card-focus-outline);
    outline-offset: -1px;
  }

  .table-row:hover {
    box-shadow: var(--shadow-color) 0 2px 4px 0;
    background: var(--card-hover-background);
    padding-left: 0;
    &::before {
      content: '';
      border-radius: var(--corner-tl) var(--corner-tr) var(--corner-br)
        var(--corner-bl);
      border-left: solid 3px var(--salmon-400);
      position: absolute;
      height: 100%;
      width: 10px;
      top: 0;
      left: 0;
      pointer-events: none;
    }
  }

  .table-row:active {
    border-color: var(--stormy-400);
    box-shadow: var(--shadow-color) 0 1px 2px 0;
    background: var(--card-active-background);
  }

  .table-row.unconfirmed-import {
    color: var(--text-color-muted);
    background-color: var(--disabled-background);
  }

  .row-content {
    display: flex;
    align-items: center;
    flex: 1;
    gap: 1.5rem;
    cursor: pointer;
    overflow: hidden;
    padding: var(--sm2) var(--lg1);
  }

  .table-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 200px;
    max-width: 300px;
    flex: 0 0 auto;
  }

  .table-name {
    font-size: var(--lg1);
    font-weight: var(--font-weight-medium);
    color: var(--text-color-primary);
  }

  .description {
    font-size: 1rem;
    color: var(--text-color-secondary);
    font-weight: var(--font-weight-normal);
    overflow: hidden;
    line-height: 1.2;
  }

  .status {
    margin-left: auto;
    padding-right: 1rem;
  }

  .import-status {
    font-size: var(--sm1);
    color: var(--color-warning);
    background: var(--color-warning-bg);
    padding: 0.25rem 0.5rem;
    border-radius: var(--border-radius-m);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }

  .menu-container {
    display: flex;
  }
</style>
