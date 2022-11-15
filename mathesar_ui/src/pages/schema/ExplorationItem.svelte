<script lang="ts">
  import type { QueryInstance } from '@mathesar/api/queries';
  import Icon from '@mathesar/component-library/icon/Icon.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import { iconExploration } from '@mathesar/icons';
  import { getExplorationPageUrl } from '@mathesar/routes/urls';
  import { tables as tablesStore } from '@mathesar/stores/tables';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';

  export let exploration: QueryInstance;
  export let database: Database;
  export let schema: SchemaEntry;

  $: baseTable = $tablesStore.data.get(exploration.base_table);
</script>

<a
  class="link-container"
  href={getExplorationPageUrl(database.name, schema.id, exploration.id)}
>
  <div class="container">
    <div class="horizontal-container name-and-icon">
      <Icon {...iconExploration} />
      <span>{exploration.name}</span>
    </div>
    {#if baseTable}
      <div class="horizontal-container">
        <span class="meta">Based on</span>
        <div class="horizontal-container">
          <TableName table={baseTable} />
        </div>
      </div>
    {/if}
  </div>
</a>

<style lang="scss">
  .link-container {
    text-decoration: none;
    color: inherit;
  }

  .container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.75rem;
    }

    padding: 1rem 0;
  }

  .horizontal-container {
    display: flex;
    flex-direction: row;
    align-items: center;

    > :global(* + *) {
      margin-left: 0.5rem;
    }
  }

  .name-and-icon {
    font-size: var(--text-size-large);
  }

  .meta {
    font-weight: 300;
  }
</style>
