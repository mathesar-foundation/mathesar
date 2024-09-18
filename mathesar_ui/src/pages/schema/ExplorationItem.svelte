<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { QueryInstance } from '@mathesar/api/rpc/explorations';
  import TableName from '@mathesar/components/TableName.svelte';
  import { iconExploration } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { getExplorationPageUrl } from '@mathesar/routes/urls';
  import { currentTablesData as tablesStore } from '@mathesar/stores/tables';
  import { Icon } from '@mathesar-component-library';

  export let exploration: QueryInstance;
  export let database: Database;
  export let schema: Schema;

  $: baseTable = $tablesStore.tablesMap.get(exploration.base_table_oid);
</script>

<a
  class="link-container"
  href={getExplorationPageUrl(database.id, schema.oid, exploration.id)}
>
  <div class="container">
    <div class="horizontal-container name-and-icon">
      <Icon {...iconExploration} />
      <span>{exploration.name}</span>
    </div>
    {#if baseTable}
      <div class="horizontal-container">
        <span class="meta">{$_('based_on')}</span>
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
    padding-left: 1rem;
    padding-right: 1rem;

    &:hover {
      background: var(--slate-50);
    }
    &:focus {
      background: var(--slate-100);
    }
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
