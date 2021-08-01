<script lang="ts">
  import {
    faPlus,
    faTrash,
    faPencilAlt,
  } from '@fortawesome/free-solid-svg-icons';

  import { schemas } from '@mathesar/stores/schemas';
  import type { SchemaMap } from '@mathesar/stores/schemas';
  import {
    Icon,
    Button,
    SchemaRow,
    TextInput,
  } from '@mathesar-components';

  // Prop
  export let database: string;

  let filterQuery = '';
  const schemaList = [...($schemas.schemaMap as SchemaMap).values()];
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
        <li>
          <SchemaRow
            schemaName={schema.name}
            tableCount={schema.children.length}
            isDefault={false}
            isLocked={false}>
            <Button class="edit">
              <Icon data={faPencilAlt}/>
            </Button>
            <Button class="delete">
              <Icon data={faTrash}/>
            </Button>
          </SchemaRow>
        </li>
      {/each}
    </ul>
  </div>
</main>

<style global lang="scss">
  @import "Schemas.scss";
</style>
