<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { SavedExploration } from '@mathesar/api/rpc/explorations';
  import TableName from '@mathesar/components/TableName.svelte';
  import { iconExpandRight, iconExploration } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { getExplorationPageUrl } from '@mathesar/routes/urls';
  import { currentTablesData as tablesStore } from '@mathesar/stores/tables';
  import { Icon } from '@mathesar-component-library';

  export let exploration: SavedExploration;
  export let database: Database;
  export let schema: Schema;

  $: baseTable = $tablesStore.tablesMap.get(exploration.base_table_oid);
</script>

<a
  class="link-container"
  href={getExplorationPageUrl(database.id, schema.oid, exploration.id)}
>
  <div class="content">
    <div class="title-and-meta">
      <div class="title-container">
        <div class="icon-container">
          <Icon {...iconExploration} size="0.875rem" />
        </div>
        <span class="name">{exploration.name}</span>
      </div>
    </div>
    {#if baseTable}
      <div class="detail">
        <span>{$_('based_on')}</span>
        <TableName table={baseTable} />
      </div>
    {/if}
  </div>
  <div class="caret-container">
    <Icon {...iconExpandRight} size="0.875rem" />
  </div>
</a>

<style lang="scss">
  .link-container {
    position: relative;
    text-decoration: none;
    color: inherit;
    padding: var(--sm1) var(--sm2);
    display: flex;
    align-items: center;
    border-radius: var(--border-radius-m);

    &:hover {
      border: 1px solid color-mix(in srgb, var(--SYS-accent-pumpkin-base-contrast), transparent 80%);
      box-shadow: 0 1px 2px 0 color-mix(in srgb, var(--SYS-accent-pumpkin-bright), transparent 80%);
      background: color-mix(in srgb, var(--SYS-accent-pumpkin-base), transparent 95%);

      .caret-container {
        opacity: 1;
      }
    }

    &:focus {
      border: 1px solid color-mix(in srgb, var(--SYS-accent-pumpkin-base-contrast), transparent 80%);
      box-shadow: 0 1px 2px 0 color-mix(in srgb, var(--SYS-accent-pumpkin-bright), transparent 60%);
      background: color-mix(in srgb, var(--SYS-accent-pumpkin-base), transparent 90%);
    }
  }

  .icon-container {
    background: linear-gradient(135deg, var(--SYS-accent-pumpkin-bright), var(--SYS-accent-pumpkin-inverted));
    color: var(--SYS-text-inverted);
    border-radius: var(--border-radius-m);
    width: 1.25rem;
    height: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    flex-grow: 1;
    min-width: 0;
  }

  .title-and-meta {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .title-container {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .name {
    font-size: var(--lg1);
    font-weight: var(--font-weight-medium);
    color: var(--SYS-text-primary);
    line-height: 1.2;
    transition: color 0.2s ease;
  }

  .detail {
    font-size: 1rem;
    color: var(--SYS-text-secondary);
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .caret-container {
    margin-left: auto;
    opacity: 0;
    transition: opacity 0.2s ease;
    display: flex;
    align-items: center;
  }
</style>
