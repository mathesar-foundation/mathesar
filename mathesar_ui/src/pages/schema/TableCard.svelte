<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EntityListItem from '@mathesar/components/EntityListItem.svelte';
  import {
    iconDeleteMajor,
    iconEdit,
    iconExploration,
    iconPermissions,
    iconSelectRecord,
    iconTable,
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
  import { recordSelectorContext } from '@mathesar/systems/record-selector/RecordSelectorController';
  import TableDeleteConfirmationBody from '@mathesar/systems/table-view/table-inspector/table/TableDeleteConfirmationBody.svelte';
  import { tableRequiresImportConfirmation } from '@mathesar/utils/tables';
  import {
    Button,
    ButtonMenuItem,
    Icon,
    LinkMenuItem,
    Tooltip,
  } from '@mathesar-component-library';

  const recordSelector = recordSelectorContext.get();

  export let table: Table;
  export let database: Database;
  export let schema: Schema;
  export let openEditTableModal: (_table: Table) => void;
  export let openTablePermissionsModal: (_table: Table) => void;
  export let condensed = false;

  $: ({ currentRoleOwns, currentRolePrivileges } = table.currentAccess);
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
  $: pendingMessage = requiresImportConfirmation
    ? $_('needs_import_confirmation')
    : undefined;

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
    recordSelector?.navigateToRecordPage({ tableOid: table.oid });
  }
</script>

<EntityListItem
  href={tablePageUrl}
  name={table.name}
  description={table.description ?? undefined}
  icon={iconTable}
  {pendingMessage}
  primary
  cssVariables={{
    '--EntityListItem__accent-color': 'var(--color-table-80)',
  }}
>
  <svelte:fragment slot="action-buttons">
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
  </svelte:fragment>
  <svelte:fragment slot="menu">
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
        {$_('rename_table')}
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
  </svelte:fragment>
</EntityListItem>
