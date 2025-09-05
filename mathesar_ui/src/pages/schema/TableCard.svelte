<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EntityListItem from '@mathesar/components/EntityListItem.svelte';
  import {
    iconDeleteMajor,
    iconEdit,
    iconExploration,
    iconRemoveFromFavorites,
    iconAddToFavorites,
    iconPermissions,
    iconSelectRecord,
    iconTable,
  } from '@mathesar/icons';
  import { favorites, favoritesStore } from '@mathesar/stores/favorites';
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
  $: isFavorited = $favorites.some(
    (fav) =>
      fav.entityType === 'table' &&
      fav.entityId === table.oid &&
      fav.databaseId === database.id,
  );
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

  async function handleToggleFavorite() {
    if (isFavorited) {
      await favoritesStore.removeFavoriteByEntity(
        'table',
        table.oid,
        database.id,
      );
    } else {
      await favoritesStore.addFavorite({
        entityType: 'table',
        entityId: table.oid,
        databaseId: database.id,
        schemaOid: schema.oid,
      });
    }
  }
</script>

<EntityListItem
  href={tablePageUrl}
  name={table.name}
  description={table.description ?? undefined}
  icon={iconTable}
  {pendingMessage}
  primary
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
      on:click={handleToggleFavorite}
      icon={isFavorited ? iconRemoveFromFavorites : iconAddToFavorites}
    >
      {isFavorited ? $_('remove_from_favorites') : $_('add_to_favorites')}
    </ButtonMenuItem>
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
