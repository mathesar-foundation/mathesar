<script lang="ts">
  import { faTable } from '@fortawesome/free-solid-svg-icons';
  import {
    Icon,
  } from '@mathesar-components';
  import {
    addTab,
  } from '@mathesar/stores/tabs';
  import type { MathesarTab } from '@mathesar/stores/tabs';
  import type { Schema, SchemaEntry } from '@mathesar/App.d';

  export let database: string;
  export let schema: Schema;
  export let getLink: (entry: MathesarTab) => string;

  function tableSelected(e: Event, table: SchemaEntry) {
    e.preventDefault();

    addTab(database, schema.id, {
      id: table.id,
      label: table.name,
    });
  }
</script>

<aside>
  <nav>
    {#each [...schema.tables] as [id, table] (id)}
      <li>
        <a href={getLink(table)} on:click={(e) => tableSelected(e, table)}>
          <Icon data={faTable}/>
          <span>{table.name}</span>
        </a>
      </li>

    {:else}
      No tables found
    {/each}
<!-- 
    <Tree data={[$currentSchema]} idKey="id" labelKey="name"
          search={true} {getLink} expandedItems={new Set([$currentSchema.id])}
          bind:selectedItems={activeTable} on:nodeSelected={tableSelected}
          let:entry>
    </Tree> -->
  </nav>
</aside>
