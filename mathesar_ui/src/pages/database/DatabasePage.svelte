<script lang="ts">
  import { Button, Icon, TextInput } from '@mathesar-component-library';
  import type { SchemaEntry } from '@mathesar/AppTypes';
  import DatabaseName from '@mathesar/components/DatabaseName.svelte';
  import EntityType from '@mathesar/components/EntityType.svelte';
  import { iconAddNew } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { modal } from '@mathesar/stores/modal';
  import type { DBSchemaStoreData } from '@mathesar/stores/schemas';
  import { schemas as schemasStore } from '@mathesar/stores/schemas';
  import AddEditSchemaModal from './AddEditSchemaModal.svelte';
  import SchemaRow from './SchemaRow.svelte';
  import SchemasHelp from './__help__/SchemasHelp.svelte';

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
</script>

<svelte:head>
  <title>{database.name} | Mathesar</title>
</svelte:head>

<LayoutWithHeader>
  <div class="database-page-header">
    <div class="database-page-name">
      <div><EntityType>Database</EntityType></div>
      <h1><DatabaseName {database} /></h1>
    </div>
    <Button class="add" on:click={addSchema}>
      <Icon {...iconAddNew} />
      New Schema
    </Button>
  </div>

  <div class="schema-list-wrapper">
    <h2 class="schema-list-title">Schemas ({schemasMap.size}) <SchemasHelp /></h2>
    <TextInput placeholder="Find a schema..." bind:value={filterQuery} />

    <ul class="schema-list">
      {#each displayList as schema (schema.id)}
        <li class="schema-list-item">
          <SchemaRow {database} {schema} on:edit={() => editSchema(schema)} />
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
  .database-page-header {
    margin: 0.5rem 0;
    display: flex;
    align-items: center;
  }
  .database-page-name {
    flex-grow: 1;
    h1 {
      margin: 0;
      font-weight: 500;
    }
  }
  .schema-list-wrapper {
    display: flex;
    flex-direction: column;

    .schema-list-title {
      font-size: var(--text-size-large);
      margin: 1rem 0;
      font-weight: 500;
    }

    .schema-list {
      width: 100%;
      list-style: none;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: 1fr;
      grid-column-gap: 1rem;
      grid-row-gap: 1rem;
    }
  }
</style>
