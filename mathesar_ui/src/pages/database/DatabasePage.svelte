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
  <div><EntityType>Database</EntityType></div>
  <h1><DatabaseName {database} /></h1>
  <Button class="add" on:click={addSchema}>
    <Icon {...iconAddNew} />
    New Schema
  </Button>

  <h2>Schemas ({schemasMap.size}) <SchemasHelp /></h2>
  <TextInput placeholder="Find a schema..." bind:value={filterQuery} />

  <ul class="schema-list">
    {#each displayList as schema (schema.id)}
      <li>
        <SchemaRow {database} {schema} on:edit={() => editSchema(schema)} />
      </li>
    {/each}
  </ul>
</LayoutWithHeader>

<AddEditSchemaModal
  controller={addEditModal}
  {database}
  schema={targetSchema}
/>

<style lang="scss">
  .schema-list {
    width: 100%;
    list-style: none;
    padding-left: 0;
  }
</style>
