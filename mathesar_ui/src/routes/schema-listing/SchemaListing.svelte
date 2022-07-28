<script lang="ts">
  import { faPlus } from '@fortawesome/free-solid-svg-icons';
  import { currentDBName } from '@mathesar/stores/databases';
  import { currentSchemaId, schemas } from '@mathesar/stores/schemas';
  import { Icon, Button, TextInput } from '@mathesar-component-library';
  import type { SchemaEntry } from '@mathesar/AppTypes';
  import type { DBSchemaStoreData } from '@mathesar/stores/schemas';
  import { modal } from '@mathesar/stores/modal';
  import SchemaRow from './schema-row/SchemaRow.svelte';
  import AddEditSchema from './AddEditSchema.svelte';
  import SchemasHelp from './__help__/SchemasHelp.svelte';

  export let database: string;

  const addEditModal = modal.spawnModalController();

  function changeCurrentDB(_db: string) {
    if ($currentDBName !== _db) {
      $currentDBName = _db;
    }
    $currentSchemaId = undefined;
  }

  $: changeCurrentDB(database);

  let filterQuery = '';
  let activeSchema: SchemaEntry | undefined;

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

  $: displayList = filterSchemas($schemas.data, filterQuery);

  function addSchema() {
    activeSchema = undefined;
    addEditModal.open();
  }

  function editSchema(schema: SchemaEntry) {
    activeSchema = schema;
    addEditModal.open();
  }
</script>

<svelte:head>
  <title>Mathesar - Schemas</title>
</svelte:head>

<main class="schemas">
  <section class="hero">
    <div class="container">
      <h1>{$currentDBName}</h1>
      <Button class="add" on:click={addSchema}>
        <Icon data={faPlus} />
        New Schema
      </Button>
    </div>
  </section>

  <div class="container">
    <h2>Schemas ({$schemas.data.size}) <SchemasHelp /></h2>
    <TextInput placeholder="Find a schema..." bind:value={filterQuery} />

    <ul class="schema-list">
      {#each displayList as schema (schema.id)}
        <li>
          <SchemaRow {schema} on:edit={() => editSchema(schema)} />
        </li>
      {/each}
    </ul>
  </div>
</main>

<AddEditSchema controller={addEditModal} schema={activeSchema} />

<style global lang="scss">
  @import 'SchemaListing.scss';
</style>
