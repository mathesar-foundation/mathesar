<script lang="ts">
  import { faPlus } from '@fortawesome/free-solid-svg-icons';

  import { schemas } from '@mathesar/stores/schemas';
  import type { Schema } from '@mathesar/utils/preloadData';
  import {
    Icon,
    Button,
    TextInput,
  } from '@mathesar-components';

  import SchemaRow from './schema-row/SchemaRow.svelte';

  // Prop
  export let database: string;

  let filterQuery = '';
  const schemaList = $schemas.data as Schema[];
  $: displayList = filterQuery
    ? schemaList.filter((schema) => schema.name.includes(filterQuery))
    : schemaList;
</script>

<svelte:head>
  <title>Mathesar - Schemas</title>
</svelte:head>

<main class="schemas">
  <section class="hero">
    <div class="container">
      <h1>{database}</h1>
      <Button class="add">
        <Icon data={faPlus}/>
        New Schema
      </Button>
    </div>
  </section>

  <div class="container">
    <h2>Schemas ({schemaList.length})</h2>
    <TextInput
        placeholder="Find a schema..."
        bind:value={filterQuery}/>
    <ul class="schema-list">
      {#each displayList as schema, i}
        <li><SchemaRow {schema}/></li>
      {/each}
    </ul>
  </div>
</main>

<style global lang="scss">
  @import "Schemas.scss";
</style>
