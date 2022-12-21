<script lang="ts">
  import {
    Button,
    Icon,
    iconSearch,
    TextInputWithPrefix,
  } from '@mathesar-component-library';
  import type { SchemaEntry } from '@mathesar/AppTypes';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { modal } from '@mathesar/stores/modal';
  import type { DBSchemaStoreData } from '@mathesar/stores/schemas';
  import { schemas as schemasStore } from '@mathesar/stores/schemas';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import { iconDatabase, iconAddNew } from '@mathesar/icons';
  import { deleteSchema as deleteSchemaAPI } from '@mathesar/stores/schemas';
  import { removeTablesInSchemaTablesStore } from '@mathesar/stores/tables';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import SchemaRow from './SchemaRow.svelte';
  import AddEditSchemaModal from './AddEditSchemaModal.svelte';
  import { deleteSchemaConfirmationBody } from './__help__/databaseHelp';

  const addEditModal = modal.spawnModalController();

  $: database = (() => {
    if (!$currentDatabase) {
      throw new Error('Current DB name is not set.');
    }
    return $currentDatabase;
  })();

  $: schemasMap = $schemasStore.data;

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

  function handleClearFilterQuery() {
    filterQuery = '';
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
    <Button slot="action" on:click={addSchema} appearance="primary">
      <Icon {...iconAddNew} />
      Create Schema
    </Button>
  </AppSecondaryHeader>

  <div class="schema-list-wrapper">
    <div class="schema-list-title-container">
      <h2 class="schema-list-title">
        Schemas ({schemasMap.size})
      </h2>
    </div>
    <TextInputWithPrefix
      placeholder="Search Schemas..."
      bind:value={filterQuery}
      prefixIcon={iconSearch}
    />

    {#if filterQuery}
      <div class="search-results-info">
        {#if displayList.length}
          <p>
            {displayList.length} result{displayList.length > 1 ? 's' : ''} for all
            schemas matching <strong>{filterQuery}</strong>
          </p>
        {:else}
          <p>
            0 results for all schemas matching <strong>{filterQuery}</strong>
          </p>
        {/if}
        <Button appearance="secondary" on:click={handleClearFilterQuery}
          >Clear</Button
        >
      </div>
    {/if}

    <ul class="schema-list">
      {#each displayList as schema (schema.id)}
        <li class="schema-list-item">
          <SchemaRow
            {database}
            {schema}
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

<style lang="scss">
  .schema-list-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;

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
