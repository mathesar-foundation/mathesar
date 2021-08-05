<script lang="ts">
  import {
    faProjectDiagram,
    faCogs,
  } from '@fortawesome/free-solid-svg-icons';

  import { get } from 'svelte/store';
  import { databases, selectedDB } from '@mathesar/stores/databases';
  import { selectedSchema, getSchemaStore } from '@mathesar/stores/schemas';

  import {
    TextAvatar,
    Dropdown,
    Icon,
  } from '@mathesar-components';

  import type { Database, Schema } from '@mathesar/App';

  let interalSelectedDB: Database = get(selectedDB);
  $: schemas = getSchemaStore(interalSelectedDB.name);

  let isOpen;

  function selectDB(db: Database) {
    interalSelectedDB = db;
  }

  function selectSchema(schema: Schema) {
    selectedSchema.set(schema);
    isOpen = false;
  }
</script>

<Dropdown bind:isOpen triggerAppearance="plain"
          triggerClass="selector" contentClass="selector-content">
  <svelte:fragment slot="trigger">
    <TextAvatar text={$selectedDB.name} />
    {$selectedDB.name}
    <span class="separator">/</span>
    {#if $selectedSchema}
      <Icon class="schema" data={faProjectDiagram} />
      {$selectedSchema?.name || ''}
    {/if}
  </svelte:fragment>

  <svelte:fragment slot="content">
    <div class="schema-selector">
      <div class="databases">
        <ul>
          {#each $databases.data as database (database.name)}
            <li>
              <button type="button"
                on:click={() => selectDB(database)}
                on:mouseover={() => selectDB(database)}>
                  <TextAvatar text={database.name} />
                  {database.name}
              </button>
            </li>
          {/each}
        </ul>
      </div>
    
      <div class="schemas">
        <ul>
          {#each $schemas.data as schema (schema.id)}
            <li>
              <a href="/{interalSelectedDB.name}/{schema.id}/"
                  on:click={() => selectSchema(schema)}>
                <Icon class="schema" data={faProjectDiagram} />
                {schema.name}
              </a>
            </li>
          {/each}
    
          <li>
            <a href="/{interalSelectedDB.name}/schemas/"
                on:click={() => selectSchema(null)}>
              <Icon class="manage" data={faCogs}/>
              Manage schemas
            </a>
          </li>
        </ul>
      </div>
    </div>
  </svelte:fragment>
</Dropdown>

<style global lang="scss">
  @import "SchemaSelector.scss";
</style>
