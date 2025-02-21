<script lang="ts">
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

  import AddTableModal from './AddTableModal.svelte';
  import SchemaOverview from './SchemaOverview.svelte';
  import SchemaPermissionsModal from './SchemaPermissionsModal.svelte';

  export let database: Database;
  export let schema: Schema;

  const editSchemaModal = modal.spawnModalController();
  const addTableModal = modal.spawnModalController();
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
    '--max-layout-width': 'var(--max-layout-width-console-pages)',
    '--layout-background-color': 'var(--sand-50)',
  }}
>
  <AppSecondaryHeader
    slot="secondary-header"
    name={$name}
    icon={iconSchema}
    entityTypeName={$_('schema')}
  >
    <div slot="action">
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
    onCreateEmptyTable={() => addTableModal.open()}
  />
</LayoutWithHeader>

<AddEditSchemaModal controller={editSchemaModal} {database} {schema} />
<AddTableModal controller={addTableModal} {schema} {tablesMap} />
<SchemaPermissionsModal controller={permissionsModal} {schema} />
