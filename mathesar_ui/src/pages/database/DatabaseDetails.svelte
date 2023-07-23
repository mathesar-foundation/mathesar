<script lang="ts">
  import {
    Button,
    Help,
    Icon,
    DropdownMenu,
    ButtonMenuItem,
  } from '@mathesar-component-library';
  import { reflectApi } from '@mathesar/api/reflect';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import {
    iconAddNew,
    iconDatabase,
    iconManageAccess,
    iconRefresh,
    iconMoreActions,
  } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
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
  import EntityContainerWithFilterBar from '@mathesar/components/EntityContainerWithFilterBar.svelte';
  import AddEditSchemaModal from './AddEditSchemaModal.svelte';
  import DbAccessControlModal from './DbAccessControlModal.svelte';
  import SchemaRow from './SchemaRow.svelte';
  import { deleteSchemaConfirmationBody } from './__help__/databaseHelp';
  import { LL } from '@mathesar/i18n/i18n-svelte';
  import RichText from '@mathesar/components/RichText.svelte';

  const addEditModal = modal.spawnModalController();
  const accessControlModal = modal.spawnModalController();

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;

  export let database: Database;

  $: schemasMap = $schemasStore.data;

  $: canExecuteDDL = userProfile?.hasPermission({ database }, 'canExecuteDDL');
  $: canEditPermissions = userProfile?.hasPermission(
    { database },
    'canEditPermissions',
  );

  let filterQuery = '';
  let targetSchema: SchemaEntry | undefined;
  let isReflectionRunning = false;

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
      isReflectionRunning = true;
      await reflectApi.reflect();
      window.location.reload();
    } catch (e) {
      toast.fromError(e);
    } finally {
      isReflectionRunning = false;
    }
  }
</script>

<AppSecondaryHeader
  pageTitleAndMetaProps={{
    name: database.name,
    type: 'database',
    icon: iconDatabase,
  }}
>
  <svelte:fragment slot="action">
    {#if canExecuteDDL || canEditPermissions}
      <div>
        {#if canEditPermissions}
          <Button on:click={manageAccess} appearance="secondary">
            <Icon {...iconManageAccess} />
            <span>{$LL.general.manageAccess()}</span>
          </Button>
        {/if}
        <DropdownMenu
          showArrow={false}
          triggerAppearance="plain"
          label=""
          closeOnInnerClick={false}
          icon={iconMoreActions}
          preferredPlacement="bottom-end"
          menuStyle="--spacing-y:0.8em;"
        >
          <ButtonMenuItem
            icon={{ ...iconRefresh, spin: isReflectionRunning }}
            disabled={isReflectionRunning}
            on:click={reflect}
          >
            <div class="reflect">
              {$LL.databaseDetails.syncExternalChanges()}
              <Help>
                <p>
                  {$LL.databaseDetails.structuralChangesHelp()}
                </p>
                <p>
                  <RichText
                    text={$LL.databaseDetails.syncExternalChanges()}
                    let:slotName
                  >
                    {#if slotName === 'rows'}
                      <em>{$LL.general.rows()}</em>
                    {/if}
                  </RichText>
                </p>
              </Help>
            </div>
          </ButtonMenuItem>
        </DropdownMenu>
      </div>
    {/if}
  </svelte:fragment>
</AppSecondaryHeader>

<div class="schema-list-wrapper">
  <div class="schema-list-title-container">
    <h2 class="schema-list-title">
      {$LL.general.schemas()} ({schemasMap.size})
    </h2>
  </div>
  <EntityContainerWithFilterBar
    searchPlaceholder={$LL.general.searchSchemaS()}
    bind:searchQuery={filterQuery}
    on:clear={handleClearFilterQuery}
  >
    <svelte:fragment slot="action">
      {#if canExecuteDDL}
        <Button on:click={addSchema} appearance="primary">
          <Icon {...iconAddNew} />
          <span>{$LL.general.createSchema()}</span>
        </Button>
      {/if}
    </svelte:fragment>
    <p slot="resultInfo">
      {labeledCount(displayList, 'results')}
      for all schemas matching
      <strong>{filterQuery}</strong>
    </p>
    <ul class="schema-list" slot="content">
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
  </EntityContainerWithFilterBar>
</div>

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

    .schema-list-title {
      font-size: var(--text-size-x-large);
      font-weight: 500;
      margin-top: var(--size-super-ultra-small);
    }

    .schema-list {
      width: 100%;
      list-style: none;
      padding: 0;
      display: flex;
      flex-direction: column;
      margin-top: var(--size-x-large);

      .schema-list-item + .schema-list-item {
        margin-top: var(--size-base);
      }
    }
  }
</style>
