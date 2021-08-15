<script lang="ts">
  import {
    faProjectDiagram,
    faCogs,
  } from '@fortawesome/free-solid-svg-icons';

  import { get } from 'svelte/store';
  import { databases, currentDBName } from '@mathesar/stores/databases';
  import {
    currentSchema,
    getSchemasStoreForDB,
  } from '@mathesar/stores/schemas';
  import type {
    DBSchemaStoreData,
  } from '@mathesar/stores/schemas';

  import {
    TextAvatar,
    Dropdown,
    Icon,
    TextInput,
  } from '@mathesar-components';

  import type { Database, Schema } from '@mathesar/App.d';

  let interalSelectedDB: Database['name'] = get(currentDBName);
  $: schemas = getSchemasStoreForDB(interalSelectedDB);

  let isOpen;
  let schemaFilter = '';

  function getFilteredSchemas(schemaData: DBSchemaStoreData['data'], filter: string): Schema[] {
    const filteredSchemas: Schema[] = [];
    schemaData.forEach((schema) => {
      if (schema.name.toLowerCase().indexOf(filter.toLowerCase()) > -1) {
        filteredSchemas.push(schema);
      }
    });
    return filteredSchemas;
  }

  let displayedSchemas: Schema[];
  $: displayedSchemas = getFilteredSchemas($schemas.data, schemaFilter);

  function selectDB(db: Database) {
    interalSelectedDB = db.name;
  }

  function closeDropdown() {
    isOpen = false;
  }
</script>

<Dropdown bind:isOpen triggerAppearance="plain"
          triggerClass="selector" contentClass="selector-content">
  <svelte:fragment slot="trigger">
    <TextAvatar text={$currentDBName} />
    {$currentDBName}
    <span class="separator">/</span>
    {#if $currentSchema}
      <Icon class="schema" data={faProjectDiagram} />
      {$currentSchema.name}
    {/if}
  </svelte:fragment>

  <svelte:fragment slot="content">
    <div class="schema-selector">
      <div class="databases">
        <div class="section-header">
          Databases ({$databases.data.length})
        </div>
        <ul>
          {#each $databases.data as database (database.name)}
            <li class="item" class:active={interalSelectedDB === database.name}>
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
        <TextInput placeholder="Search schemas" bind:value={schemaFilter}/>
        <div class="section-header">
          Schemas ({displayedSchemas.length})
        </div>
        <ul>
          {#each displayedSchemas as schema (schema.id)}
            <li class="item">
              <a href="/{interalSelectedDB}/{schema.id}/"
                  on:click={closeDropdown}>
                <Icon class="schema" data={faProjectDiagram} />
                {schema.name}
              </a>
            </li>

          {:else}
            <div class="empty">No schema found</div>
          {/each}
        </ul>
        <div class="item">
          <a href="/{interalSelectedDB}/schemas/"
              on:click={closeDropdown}>
            <Icon class="manage" data={faCogs}/>
            Manage schemas
          </a>
        </div>
      </div>
    </div>
  </svelte:fragment>
</Dropdown>

<style global lang="scss">
  @import "SchemaSelector.scss";
</style>
