<script lang="ts">
  import {
    Button,
    Help,
    Icon,
    iconSearch,
    SpinnerButton,
    TextInputWithPrefix,
  } from '@mathesar-component-library';
  import { reflectApi } from '@mathesar/api/reflect';
  import type { SchemaEntry } from '@mathesar/AppTypes';
  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import {
    iconAddNew,
    iconDatabase,
    iconManageAccess,
    iconRefresh,
  } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { modal } from '@mathesar/stores/modal';
  import type { DBSchemaStoreData } from '@mathesar/stores/schemas';
  import {
    deleteSchema as deleteSchemaAPI,
    schemas as schemasStore,
  } from '@mathesar/stores/schemas';
  import { removeTablesInSchemaTablesStore } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { labeledCount } from '@mathesar/utils/languageUtils';
  import AddEditSchemaModal from './AddEditSchemaModal.svelte';
  import DbAccessControlModal from './DbAccessControlModal.svelte';
  import SchemaRow from './SchemaRow.svelte';
  import { deleteSchemaConfirmationBody } from './__help__/databaseHelp';

  const addEditModal = modal.spawnModalController();
  const accessControlModal = modal.spawnModalController();

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;

  $: database = (() => {
    if (!$currentDatabase) {
      throw new Error('Current DB name is not set.');
    }
    return $currentDatabase;
  })();

  $: schemasMap = $schemasStore.data;

  $: canExecuteDDL = userProfile?.hasPermission({ database }, 'canExecuteDDL');
  $: canEditPermissions = userProfile?.hasPermission(
    { database },
    'canEditPermissions',
  );

  let filterQuery = '';
  let targetSchema: SchemaEntry | undefined;

  function filterSchemas(
    schemaData: DBSchemaStoreData['data'],
    filter: string,
  ): SchemaEntry[] {
    const filtered: SchemaEntry[] = [];
    schemaData.forEach((schema) => {
      if (schema.name?.toLowerCase().includes(filter.toLowerCase())) {
        filtered.push(schema);
      }
    });
    return filtered;
  }

  $: displayList = filterSchemas(schemasMap, filterQuery);

  function addSchema() {
    targetSchema = undefined;
    addEditModal.open();
  }

  function editSchema(schema: SchemaEntry) {
    targetSchema = schema;
    addEditModal.open();
  }

  function deleteSchema(schema: SchemaEntry) {
    void confirmDelete({
      identifierType: 'Schema',
      identifierName: schema.name,
      body: deleteSchemaConfirmationBody,
      onProceed: async () => {
        await deleteSchemaAPI(database.name, schema.id);
        // TODO: Create common util to handle data clearing & sync between stores
        removeTablesInSchemaTablesStore(schema.id);
      },
    });
  }

  function manageAccess() {
    accessControlModal.open();
  }

  function handleClearFilterQuery() {
    filterQuery = '';
  }

  async function reflect() {
    try {
      await reflectApi.reflect();
      window.location.reload();
    } catch (e) {
      toast.fromError(e);
    }
  }
</script>

<svelte:head><title>{makeSimplePageTitle(database.name)}</title></svelte:head>

<LayoutWithHeader restrictWidth={true}>
  <AppSecondaryHeader
    slot="secondary-header"
    pageTitleAndMetaProps={{
      name: database.name,
      type: 'database',
      icon: iconDatabase,
    }}
  >
    <svelte:fragment slot="action">
      {#if canExecuteDDL || canEditPermissions}
        <div>
          {#if canExecuteDDL}
            <Button on:click={addSchema} appearance="primary">
              <Icon {...iconAddNew} />
              <span>Create Schema</span>
            </Button>
          {/if}
          {#if canEditPermissions}
            <Button on:click={manageAccess} appearance="secondary">
              <Icon {...iconManageAccess} />
              <span>Manage Access</span>
            </Button>
          {/if}
        </div>
      {/if}
    </svelte:fragment>
  </AppSecondaryHeader>

  <div class="schema-list-wrapper">
    <div class="schema-list-title-container">
      <h2 class="schema-list-title">Schemas ({schemasMap.size})</h2>
      <div class="reflect">
        <div class="button">
          <SpinnerButton
            onClick={reflect}
            appearance="secondary"
            label="Refresh External Changes"
            icon={iconRefresh}
          />
        </div>
        <Help>
          <p>
            If you make structural changes to the database outside Mathesar
            (e.g. using another tool to add a schema, table, or column), those
            changes will not be reflected in Mathesar until you manually sync
            them with this button.
          </p>
          <p>
            External changes to data (e.g. adding or editing <em>rows</em>) will
            be automatically reflected without clicking this button.
          </p>
        </Help>
      </div>
    </div>
    <TextInputWithPrefix
      placeholder="Search Schemas"
      bind:value={filterQuery}
      prefixIcon={iconSearch}
    />

    {#if filterQuery}
      <div class="search-results-info">
        <p>
          {labeledCount(displayList, 'results')}
          for all schemas matching <strong>{filterQuery}</strong>
        </p>
        <Button appearance="secondary" on:click={handleClearFilterQuery}>
          Clear
        </Button>
      </div>
    {/if}

    <ul class="schema-list">
      {#each displayList as schema (schema.id)}
        <li class="schema-list-item">
          <SchemaRow
            {database}
            {schema}
            canExecuteDDL={userProfile?.hasPermission(
              { database, schema },
              'canExecuteDDL',
            )}
            on:edit={() => editSchema(schema)}
            on:delete={() => deleteSchema(schema)}
          />
        </li>
      {/each}
    </ul>
  </div>
</LayoutWithHeader>

<AddEditSchemaModal
  controller={addEditModal}
  {database}
  schema={targetSchema}
/>

<DbAccessControlModal controller={accessControlModal} {database} />

<style lang="scss">
  .schema-list-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;

    .schema-list-title-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .reflect {
      display: flex;
      align-items: center;
      .button {
        margin-right: 0.5rem;
        font-size: var(--text-size-small);
      }
    }

    .schema-list-title {
      font-size: var(--text-size-x-large);
      font-weight: 500;
    }

    .search-results-info {
      display: flex;
      justify-content: space-between;
      align-items: center;

      p {
        font-size: var(--text-size-large);
      }
    }

    .schema-list {
      width: 100%;
      list-style: none;
      padding: 0;
      display: flex;
      flex-direction: column;
      * + * {
        margin-top: 0.714rem;
      }
    }
  }
</style>
