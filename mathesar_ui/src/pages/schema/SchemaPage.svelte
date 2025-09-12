<script lang="ts">
  import { map } from 'iter-tools';
  import { _ } from 'svelte-i18n';

  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import { SchemaRouteContext } from '@mathesar/contexts/SchemaRouteContext';
  import { iconEdit, iconPermissions, iconSchema } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { modal } from '@mathesar/stores/modal';
  import { queries } from '@mathesar/stores/queries';
  import { currentTablesData as tablesStore } from '@mathesar/stores/tables';
  import AddEditSchemaModal from '@mathesar/systems/schemas/AddEditSchemaModal.svelte';
  import { Button, Icon } from '@mathesar-component-library';

  import CreateTableModal from './CreateTableModal.svelte';
  import SchemaOverview from './SchemaOverview.svelte';
  import SchemaPermissionsModal from './SchemaPermissionsModal.svelte';

  const schemaRouteContext = SchemaRouteContext.get();
  const editSchemaModal = modal.spawnModalController();
  const createTableModal = modal.spawnModalController();
  const permissionsModal = modal.spawnModalController();

  $: ({ schema } = $schemaRouteContext);
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
  }}
>
  <div slot="secondary-header" class="schema-page-header">
    <AppSecondaryHeader
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
          <span>{$_('rename_schema')}</span>
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
  </div>
  <SchemaOverview
    {tablesRequestStatus}
    {tablesMap}
    {explorationsMap}
    {explorationsRequestStatus}
    onCreateEmptyTable={() => createTableModal.open()}
  />
</LayoutWithHeader>

<AddEditSchemaModal
  controller={editSchemaModal}
  database={schema.database}
  {schema}
/>
<CreateTableModal
  controller={createTableModal}
  {schema}
  existingTableNames={new Set(map((t) => t.name, tablesMap.values()))}
/>
<SchemaPermissionsModal controller={permissionsModal} {schema} />

<style>
  .schema-page-header {
    --AppSecondaryHeader__background: linear-gradient(
      135deg,
      var(--color-schema-10) 10%,
      var(--color-bg-supporting) 50%,
      var(--color-schema-15) 90%,
      var(--color-brand-10) 100%
    );
    --entity-name-color: var(--color-schema);
  }

  .description {
    color: var(--color-fg-subtle-1);
  }

  .action-buttons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>
