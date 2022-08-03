<script lang="ts">
  import { get } from 'svelte/store';
  import { databases, currentDBName } from '@mathesar/stores/databases';
  import {
    currentSchema,
    getSchemasStoreForDB,
  } from '@mathesar/stores/schemas';
  import type { DBSchemaStoreData } from '@mathesar/stores/schemas';

  import {
    TextAvatar,
    Dropdown,
    Icon,
    TextInput,
  } from '@mathesar-component-library';

  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { iconProject, iconSettings } from '@mathesar/icons';

  let interalSelectedDB: Database['name'] = get(currentDBName);
  $: schemas = getSchemasStoreForDB(interalSelectedDB);

  let isOpen: boolean;
  let schemaFilter = '';

  function getFilteredSchemas(
    schemaData: DBSchemaStoreData['data'],
    filter: string,
  ): SchemaEntry[] {
    const filteredSchemas: SchemaEntry[] = [];
    schemaData.forEach((schema) => {
      if (schema.name.toLowerCase().indexOf(filter.toLowerCase()) > -1) {
        filteredSchemas.push(schema);
      }
    });
    return filteredSchemas;
  }

  let displayedSchemas: SchemaEntry[];
  $: displayedSchemas = getFilteredSchemas($schemas.data, schemaFilter);

  function selectDB(db: Database) {
    interalSelectedDB = db.name;
  }

  function closeDropdown() {
    isOpen = false;
  }
</script>

<Dropdown
  bind:isOpen
  triggerAppearance="plain"
  triggerClass="selector"
  contentClass="selector-content"
>
  <svelte:fragment slot="trigger">
    <TextAvatar text={$currentDBName} />
    {$currentDBName}
    <span class="separator">/</span>
    {#if $currentSchema}
      <Icon class="schema" {...iconProject} />
      {$currentSchema.name}
    {/if}
  </svelte:fragment>

  <svelte:fragment slot="content">
    <div class="schema-selector">
      <div class="databases">
        <div class="section-header">
          Databases ({$databases?.data?.length ?? 0})
        </div>
        {#if $databases.data && $databases.data.length}
          <ul>
            {#each $databases.data as database (database.name)}
              <li
                class="item"
                class:active={interalSelectedDB === database.name}
              >
                <button
                  type="button"
                  on:click={() => selectDB(database)}
                  on:mouseover={() => selectDB(database)}
                  on:focus={() => selectDB(database)}
                >
                  <TextAvatar text={database.name} />
                  {database.name}
                </button>
              </li>
            {/each}
          </ul>
        {:else}
          <div>No databases</div>
        {/if}
      </div>

      <div class="schemas">
        <div class="schema-searchbox">
          <TextInput placeholder="Search schemas" bind:value={schemaFilter} />
        </div>
        <div class="section-header">
          Schemas ({displayedSchemas.length})
        </div>
        <ul>
          {#each displayedSchemas as schema (schema.id)}
            <li class="item">
              <a
                href="/{interalSelectedDB}/{schema.id}/"
                on:click={closeDropdown}
              >
                <Icon class="schema" {...iconProject} />
                <span>{schema.name}</span>
              </a>
            </li>
          {:else}
            <div class="empty">No schema found</div>
          {/each}
        </ul>
        <div class="item">
          <a href="/{interalSelectedDB}/schemas/" on:click={closeDropdown}>
            <Icon class="manage" {...iconSettings} />
            Manage schemas
          </a>
        </div>
      </div>
    </div>
  </svelte:fragment>
</Dropdown>

<style global lang="scss">
  @import 'SchemaSelector.scss';
</style>
