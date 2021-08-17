<script lang="ts">
  import { faPlus } from '@fortawesome/free-solid-svg-icons';
  import { currentDBName } from '@mathesar/stores/databases';
  import { currentSchemaId, schemas } from '@mathesar/stores/schemas';
  import {
    Icon,
    Button,
    TextInput,
  } from '@mathesar-components';
  import type { Schema } from '@mathesar/App.d';
  import type { DBSchemaStoreData } from '@mathesar/stores/schemas';
  import SchemaRow from './schema-row/SchemaRow.svelte';
  import AddEditSchema from './AddEditSchema.svelte';

  export let database: string;
  let isAddModalOpen = false;

  function changeCurrentDB(_db: string) {
    if ($currentDBName !== _db) {
      $currentDBName = _db;
    }
    $currentSchemaId = null;
  }

  $: changeCurrentDB(database);

  let filterQuery = '';
  let activeSchema: Schema = null;

  function filterSchemas(schemaData: DBSchemaStoreData['data'], filter: string): Schema[] {
    const filtered: Schema[] = [];
    schemaData.forEach((schema) => {
      if (schema.name?.toLowerCase().includes(filter.toLowerCase())) {
        filtered.push(schema);
      }
    });
    return filtered;
  }

  $: displayList = filterSchemas($schemas.data, filterQuery);

  function addSchema() {
    activeSchema = null;
    isAddModalOpen = true;
  }

  function editSchema(schema: Schema) {
    activeSchema = schema;
    isAddModalOpen = true;
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
        <Icon data={faPlus}/>
        New Schema
      </Button>
    </div>
  </section>

  <div class="container">
    <h2>Schemas ({$schemas.data.size})</h2>
    <TextInput
        placeholder="Find a schema..."
        bind:value={filterQuery}/>
    <ul class="schema-list">
      {#each displayList as schema (schema.id)}
        <li>
          <SchemaRow {schema} on:edit={() => editSchema(schema)}/>
        </li>
      {/each}
    </ul>
  </div>
</main>

{#if isAddModalOpen}
  <AddEditSchema isEditMode={activeSchema !== null}
    schema={activeSchema} bind:isOpen={isAddModalOpen}/>
{/if}

<style global lang="scss">
  @import "Schemas.scss";
</style>
