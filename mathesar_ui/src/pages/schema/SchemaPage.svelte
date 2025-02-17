<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { getQueryStringFromParams } from '@mathesar/api/rest/utils/requestUtils';
  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import {
    iconEdit,
    iconExport,
    iconPermissions,
    iconSchema,
  } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { modal } from '@mathesar/stores/modal';
  import { queries } from '@mathesar/stores/queries';
  import { currentTablesData as tablesStore } from '@mathesar/stores/tables';
  import AddEditSchemaModal from '@mathesar/systems/schemas/AddEditSchemaModal.svelte';
  import {
    AnchorButton,
    Button,
    Icon,
    Tooltip,
  } from '@mathesar-component-library';

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
  $: exportLinkParams = getQueryStringFromParams({
    database_id: database.id,
    schema_oid: schema.oid,
  });
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
    pageTitleAndMetaProps={{
      name: $name,
      icon: iconSchema,
      entityTypeName: $_('schema'),
    }}
  >
    <div slot="action">
      <Tooltip allowHover>
        <AnchorButton
          slot="trigger"
          href="/api/export/v0/schemas/?{exportLinkParams}"
          data-tinro-ignore
          appearance="secondary"
          size="medium"
          aria-label={$_('export')}
          download="{$name}.sql"
        >
          <Icon {...iconExport} />
          <span class="responsive-button-label">{$_('export')}</span>
        </AnchorButton>
        <span slot="content">
          {$_('export_schema_help', {
            values: { schemaName: $name },
          })}
        </span>
      </Tooltip>
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
