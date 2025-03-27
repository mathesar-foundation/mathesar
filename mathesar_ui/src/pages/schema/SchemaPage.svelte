<script lang="ts">
  import { map } from 'iter-tools';
  import { _ } from 'svelte-i18n';

  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import { iconEdit, iconPermissions, iconSchema } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { modal } from '@mathesar/stores/modal';
  import { queries } from '@mathesar/stores/queries';
  import { currentTablesData as tablesStore } from '@mathesar/stores/tables';
  import AddEditSchemaModal from '@mathesar/systems/schemas/AddEditSchemaModal.svelte';
  import { Button, Icon } from '@mathesar-component-library';

  import CreateTableModal from './CreateTableModal.svelte';
  import SchemaOverview from './SchemaOverview.svelte';
  import SchemaPermissionsModal from './SchemaPermissionsModal.svelte';

  export let database: Database;
  export let schema: Schema;

  const editSchemaModal = modal.spawnModalController();
  const createTableModal = modal.spawnModalController();
  const permissionsModal = modal.spawnModalController();

  $: tablesMap = $tablesStore.tablesMap;
  $: explorationsMap = $queries.data;
  $: tablesRequestStatus = $tablesStore.requestStatus;
  $: explorationsRequestStatus = $queries.requestStatus;

  function handleEditSchema() {
    editSchemaModal.open();
  }

  $: ({ name, description, currentAccess } = schema);
  $: ({ currentRoleOwns } = currentAccess);
</script>

<svelte:head><title>{makeSimplePageTitle($name)}</title></svelte:head>

<LayoutWithHeader
  restrictWidth
  cssVariables={{
    '--page-padding': '0',
    '--max-layout-width': 'var(--max-layout-width-console-pages)',
  }}
>
  <AppSecondaryHeader
    slot="secondary-header"
    name={$name}
    icon={iconSchema}
    entityTypeName={$_('schema')}
  >
    <div slot="action" class="action-buttons">
      <Button
        on:click={handleEditSchema}
        appearance="secondary"
        disabled={!$currentRoleOwns}
      >
        <Icon {...iconEdit} />
        <span>{$_('edit_schema')}</span>
      </Button>
      <Button appearance="secondary" on:click={() => permissionsModal.open()}>
        <Icon {...iconPermissions} />
        <span>{$_('schema_permissions')}</span>
      </Button>
    </div>

    <svelte:fragment slot="bottom">
      {#if $description}
        <span class="description">
          {$description}
        </span>
      {/if}
    </svelte:fragment>
  </AppSecondaryHeader>
  <SchemaOverview
    {tablesRequestStatus}
    {tablesMap}
    {explorationsMap}
    {database}
    {schema}
    {explorationsRequestStatus}
    onCreateEmptyTable={() => createTableModal.open()}
  />
</LayoutWithHeader>

<AddEditSchemaModal controller={editSchemaModal} {database} {schema} />
<CreateTableModal
  controller={createTableModal}
  {schema}
  existingTableNames={new Set(map((t) => t.name, tablesMap.values()))}
/>
<SchemaPermissionsModal controller={permissionsModal} {schema} />

<style>
  .description {
    color: var(--text-color-secondary);
  }

  .action-buttons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>
